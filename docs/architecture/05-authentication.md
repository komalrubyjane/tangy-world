# 05 — Authentication, Role and Permission Resolution

Supabase Auth is the only identity provider. Tangy never generates, stores or checks OTP codes itself. `EmailOtpAuth` calls `supabase.auth.signInWithOtp()` and `verifyOtp()`.

## Implemented auth flows

| Flow | Status | Where |
|---|---|---|
| Email OTP sign-up + sign-in (customers, partners, artists) | **IMPLEMENTED** | `src/components/auth/EmailOtpAuth.jsx` (`shouldCreateUser: allowSignup`, `verifyOtp({type:'email'})`), used by `UserLoginModal`, `/join`, `/join/login`, `/artist/login`, `/artist/apply`, `RequireAuthToApply`, `/invitation` |
| Console sign-in | **IMPLEMENTED** | `AdminLoginPanel` (`AdminGate.jsx`): OTP with `allowSignup=false` (existing accounts only); **password fallback** (`signInWithPassword`) |
| Set / change password | **IMPLEMENTED** | `/profile` and Patron settings: `supabase.auth.updateUser({ password })` |
| Password reset by email (`resetPasswordForEmail`) | **NOT IMPLEMENTED** | no call in `src/` |
| Social / OAuth sign-in | **NOT IMPLEMENTED** | — |
| Session persistence and refresh | **IMPLEMENTED** | `createClient(..., { auth: { persistSession: true, autoRefreshToken: true } })` |
| Role refresh while signed in | **IMPLEMENTED** | `UserAuthContext` re-reads `profiles.role, is_active` every 60 s, on window focus and on tab visibility |
| Console idle sign-out | **IMPLEMENTED** | `AdminShell` `useIdleTimeout`, setting `auth.admin_idle_timeout_minutes` (default 60; 0 disables) |
| Console sign-in audit | **IMPLEMENTED** | `AdminGate` → `log_auth_event('auth.login')` once per browser session |
| Invitation (console accounts) | **IMPLEMENTED** | `admin-invite-user` Edge Function + `create_account_invitation` / `invitation_preview` / `accept_account_invitation` (0030) |
| OTP email template contains `{{ .Token }}` | **PRODUCTION CONFIGURATION** / **DOCUMENTED BUT NOT VERIFIED IN CODE** | `supabase/README.md` §2b: dashboard setting; the repo says it *"could not be verified against a live project"* |
| Team review one-click login | **DEMO / LOCAL ONLY** | `/team-demo`, `signInWithPassword` with `VITE_TEAM_REVIEW_PASSWORD` |
| Dev role switcher | **DEMO / LOCAL ONLY** | `vite` dev server `/__dev/mock-session` (magic-link token for local accounts) |

## Complete authentication flowchart

```mermaid
---
title: Authentication → role → permission → enforcement
---
flowchart TD
  classDef start fill:#1f6f43,color:#fff
  classDef proc fill:#f4ead2,stroke:#7a5c2e,color:#222
  classDef dec fill:#fff3c4,stroke:#b38600,color:#222
  classDef db fill:#dce8f7,stroke:#2a5b9a,color:#122
  classDef err fill:#fbdada,stroke:#b42318,color:#5a0d0d
  classDef res fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  U(["User opens a sign-in surface"]):::start --> E["Enter email<br/>signInWithOtp(email, shouldCreateUser)"]:::proc
  E --> SA["Supabase Auth emails a 6-digit code"]:::db
  SA --> C["Enter code · verifyOtp(email, token, type email)"]:::proc
  C --> V{"Code valid?"}:::dec
  V -- no --> ER["friendlyOtpError message"]:::err
  V -- yes --> JWT["Session + JWT stored by supabase-js<br/>auto-refresh"]:::db
  JWT --> NEW{"First sign-in?"}:::dec
  NEW -- yes --> TR["auth.users insert → handle_new_user()<br/>profiles: role user · passport_id"]:::db
  NEW -- no --> PL
  TR --> PL["UserAuthContext.loadProfile<br/>select * from profiles where id = auth user"]:::proc
  PL --> PE{"Profile row loaded?"}:::dec
  PE -- no --> PF["profileError · fallback role user"]:::err
  PE -- yes --> ROLE["user.role = profiles.role"]:::res
  ROLE --> SURF{"Which surface?"}:::dec
  SURF -- "account dashboards" --> PR["ProtectedRoute: signed in only<br/>DashboardRedirect by role"]:::proc
  SURF -- "artist portal" --> AP["artist AuthContext:<br/>artists row for this user,<br/>status approved"]:::proc
  SURF -- "console / check-in" --> PERM["AdminSessionProvider<br/>my_permissions() + get_runtime_settings()"]:::db
  PERM --> G{"can(requires)?"}:::dec
  G -- no --> NA["No access / Deactivated card"]:::err
  G -- yes --> CON["Console renders · nav from buildNav(perms)"]:::res
  PR & AP & CON --> CALL["Data call with user JWT"]:::proc
  CALL --> RLS{"RLS policy / RPC has_permission() / auth.uid() check"}:::dec
  RLS -- denied --> D["0 rows / 42501 → 'You don't have permission'"]:::err
  RLS -- allowed --> OK["Data returned / mutation done · audit_write"]:::res
```

## Sign-in surfaces

```mermaid
---
title: Who signs in where
---
flowchart LR
  classDef proc fill:#f4ead2,stroke:#7a5c2e,color:#222
  classDef db fill:#dce8f7,stroke:#2a5b9a,color:#122
  classDef demo fill:#eeeeee,stroke:#888,color:#444,stroke-dasharray: 4 3
  CUS["Customer"]:::proc --> M1["Login modal · /join/login · /join"]:::proc
  ART["Artist"]:::proc --> M2["/artist/login · /artist/apply"]:::proc
  PAR["Sponsor · Vendor · Venue · Crew · Volunteer"]:::proc --> M3["/join/login (approval email links here)"]:::proc
  TEAM["Staff · Admin · Super Admin"]:::proc --> M4["/admin-portal AdminLoginPanel<br/>OTP (no sign-up) or password"]:::proc
  VOL["Volunteer with grant"]:::proc --> M5["/check-in StaffAuthGate"]:::proc
  INV["Invited person"]:::proc --> M6["/invitation#token=…"]:::proc
  M1 & M2 & M3 & M6 --> OTP["EmailOtpAuth → Supabase Auth"]:::db
  M4 & M5 --> OTP
  M4 --> PW["signInWithPassword"]:::db
  REV["Reviewer"]:::demo --> M7["/team-demo · review builds"]:::demo --> PW
```

## Invitation flow (console accounts)

```mermaid
---
title: Console invitation — admin-invite-user + accept_account_invitation
---
sequenceDiagram
  autonumber
  actor SA as Inviter (Admin or Super Admin)
  participant UI as Users & Roles page
  participant EF as admin-invite-user (Edge Function)
  participant DB as Postgres
  participant RS as Resend
  actor NEW as Invitee
  participant IP as /invitation page
  SA->>UI: email, full name, role (staff / admin / super_admin)
  UI->>EF: functions.invoke with inviter JWT
  EF->>EF: auth.getUser() · validate · 32 random bytes token · SHA-256 hash
  EF->>DB: rpc create_account_invitation(email, name, role, token_hash) as INVITER
  DB->>DB: can_invite_role(role): roles.manage for admin or super_admin, staff.invite for staff
  DB-->>EF: invitation id, expires_at
  EF->>RS: email with SITE_URL/invitation#token=… (token only in URL fragment)
  EF->>DB: set_invitation_email_status(sent / failed / not_configured)
  EF-->>UI: ok · if email failed, the link is returned once to deliver by hand
  NEW->>IP: open link · sign in with the invited email (OTP)
  IP->>DB: invitation_preview(token) then accept_account_invitation(token)
  DB->>DB: hash match · pending · not expired · email equals auth email · account active · rank higher
  DB->>DB: update profiles.role (trigger allows: accepted_by = self, accepted_at = now())
  DB-->>IP: role granted → console
```

## Session and role refresh

```mermaid
---
title: Session lifecycle
---
stateDiagram-v2
  [*] --> SignedOut
  SignedOut --> Verifying: verifyOtp / signInWithPassword
  Verifying --> SignedIn: session stored
  Verifying --> SignedOut: invalid code
  SignedIn --> SignedIn: autoRefreshToken renews JWT
  SignedIn --> RoleChanged: 60 s poll / focus sees new role or is_active
  RoleChanged --> SignedIn: menus + guards follow the server role
  SignedIn --> Deactivated: is_active false — current_role_name() returns null
  Deactivated --> SignedOut: logout
  SignedIn --> IdleSignedOut: console idle timeout (default 60 min)
  IdleSignedOut --> SignedOut
  SignedIn --> SignedOut: logout()
```

**Why the server role always wins:** every RLS policy and RPC reads `profiles.role` through `current_role_name()` / `has_permission()` on each request. When a Super Admin changes someone's role, the database stops honouring the old role immediately. The 60-second client refresh only updates the menus.

## Artist login specifics

The artist portal does **not** gate on `profiles.role`. `ArtistPortalShell` → artist `AuthContext` loads the `artists` row for `auth.uid()`:

- no row → redirect to `/artist/login?next=…`
- status ≠ `approved` → redirect to `/artist/application`
- `approved` → portal

Approval also sets `profiles.role = 'artist'` (`approve_artist_application`), so `/dashboard` redirects artists to `/artist/dashboard`.
