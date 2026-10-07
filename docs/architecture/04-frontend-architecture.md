# 04 — Frontend Architecture

**Stack** (`package.json`): React 19, Vite 8, React Router 7, Tailwind 4 (`@tailwindcss/vite`), `@supabase/supabase-js` 2, GSAP 3 + Lenis + Framer Motion (animation), FullCalendar 6 (calendars), `qrcode` (QR images), `html5-qrcode` (camera scanner), `lucide-react` (icons). Lint: Oxlint. There is no TypeScript and no state library (React context + hooks only).

## Boot sequence and provider tree

```mermaid
---
title: main.jsx → providers → router (src/App.jsx)
---
flowchart TD
  classDef proc fill:#f4ead2,stroke:#7a5c2e,color:#222
  classDef ctx fill:#dce8f7,stroke:#2a5b9a,color:#122
  classDef demo fill:#eeeeee,stroke:#888,color:#444,stroke-dasharray: 4 3
  M["main.jsx<br/>createRoot · StrictMode · styles/globals.css"]:::proc --> APP["App"]:::proc
  APP --> AU["AudioProvider<br/>src/audio/AudioContext.jsx · SFX"]:::ctx
  AU --> UA["UserAuthProvider<br/>Supabase session + profiles row · role refresh 60 s / focus"]:::ctx
  UA --> DA["DemoAdminProvider<br/>in-memory flag · DEMO ONLY"]:::demo
  DA --> LE["LenisProvider<br/>smooth scroll"]:::ctx
  LE --> CU["CursorProvider + CustomCursor"]:::ctx
  CU --> BR["BrowserRouter"]:::proc
  BR --> STT["ScrollToTop"]:::proc
  BR --> GO["GlobalOverlays<br/>GlobalDock · TangyAssistantLauncher · AnnouncementCharacterOverlay<br/>suppressed on /admin-portal, /check-in, portals, checkout"]:::proc
  BR --> RS["ReviewStripMount · review builds only"]:::demo
  BR --> SUS["Suspense · RouteFallback"]:::proc --> RT["Routes (134)"]:::proc
```

## Layouts / shells

```mermaid
---
title: Route groups and their shells
---
flowchart LR
  classDef shell fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  classDef proc fill:#f4ead2,stroke:#7a5c2e,color:#222
  classDef gate fill:#fff3c4,stroke:#b38600,color:#222
  RT["Routes"] --> PUBS["PUBLIC SHELL<br/>MainWorld: CurtainOverlay · Navbar · Menu · MicNavRail · sections · Footer<br/>standalone pages: own Navbar / layout"]:::shell
  RT --> PR["ProtectedRoute<br/>signed in? else /join/login?next="]:::gate --> ACC["Account dashboards<br/>PortalUI · PartnerPortal · RoleApplicationDashboard"]:::shell
  RT --> AL["ArtistLayout<br/>artist AuthProvider · public artist pages"]:::shell
  RT --> APS["ArtistPortalShell<br/>artist AuthProvider → PortalFrame<br/>needs artists row with status approved,<br/>else → /artist/application"]:::gate
  RT --> ADM["AdminApp<br/>AdminSessionProvider → AdminGate → ToastProvider → AdminShell → Guard per route"]:::gate
  RT --> CHK["TangyWorldCheckInPage<br/>StaffAuthGate(checkin.perform)"]:::gate
```

| Shell | File | What it adds |
|---|---|---|
| Public | `App.jsx` `MainWorld`, `components/layout/*`, `components/sections/*` | Museum modals, curtain intro, navbar, scroll sections |
| Account | `pages/dashboards/*`, `portal/PartnerPortal.jsx`, `pages/dashboards/portal/PortalUI.jsx` | Tabs, application status, partner sections |
| Artist public | `artist/layouts/ArtistLayout.jsx` | Artist navbar, artist `AuthProvider` |
| Artist portal | `artist/portal/ArtistPortalShell.jsx`, `portalNav.js`, `kit.jsx` | Sidebar nav, request badge, approval gate |
| Admin | `admin/AdminShell.jsx`, `AdminGate.jsx`, `AdminSession.jsx`, `ui.jsx`, `rbac.js` | Permission-generated nav, global search (`admin_search`), notification bell, idle sign-out (`auth.admin_idle_timeout_minutes`, default 60) |
| Check-in | `admin/TangyWorldCheckInPage.jsx`, `StaffAuthGate.jsx` | Same sign-in + permission model as the console |

## Contexts and hooks

| Context / hook | File | Purpose |
|---|---|---|
| `UserAuthContext` | `src/context/UserAuthContext.jsx` | `getSession` + `onAuthStateChange` → loads `profiles` row; exposes `user`, `isLoggedIn`, `signIn` (password), `signUp`, `logout`, login modal state; re-reads `role, is_active` every 60 s and on focus |
| artist `AuthContext` | `src/artist/contexts/AuthContext.jsx` | Maps the caller's `artists` row to the portal user; `null` when no artist row |
| `AdminSessionContext` | `src/admin/AdminSession.jsx` | `my_permissions()` + `get_runtime_settings()`, `can()`, dev mock identity (dev only) |
| `DemoAdminContext` | `src/context/DemoAdminContext.jsx` | **DEMO ONLY** in-memory flag, grants nothing (no Supabase session) |
| `AudioContext` | `src/audio/AudioContext.jsx` | Sound effects (`playSFX`) |
| `useEvents` | `src/hooks/useEvents.js` | Public `events` list |
| `useSessionDetail` | `src/hooks/useSessionDetail.js` | Session page: event, line-up, `booking_quote`, `event_availability`, `my_waitlist`, Realtime subscription `availability-<eventId>` on `event_availability_signal` |
| `useContent` | `src/hooks/useContent.js` | CMS reads |
| `useAnnouncementTrigger` | `src/hooks/useAnnouncementTrigger.js` | Picks a public announcement for the character overlay |
| `usePageMeta`, `useReducedMotion`, `useFocusTrap`, `useGSAPContext`, `useReveal`, `useCursor` | `src/hooks/` | Page titles, a11y, animation |
| `useAdminList`, `useAsync` | `src/admin/useAdminList.js`, `src/admin/hooks.js` | Paged admin lists |

## Service / API layer

```mermaid
---
title: Frontend dependency diagram — who talks to Supabase
---
flowchart LR
  classDef page fill:#f4ead2,stroke:#7a5c2e,color:#222
  classDef svc fill:#fde3c8,stroke:#b8560a,color:#3a1a00
  classDef sb fill:#dce8f7,stroke:#2a5b9a,color:#122
  classDef mock fill:#eeeeee,stroke:#888,color:#444,stroke-dasharray: 4 3
  subgraph PAGES["Pages / components"]
    BP["BookingPage"]:::page
    PD["Patron / Partner dashboards"]:::page
    ART["Artist portal pages"]:::page
    ADM["Admin pages + components"]:::page
    CHK["Check-in page"]:::page
    CNT["Content + archive pages"]:::page
    FRM["Apply / enquiry forms"]:::page
    AI["Tangy assistant"]:::page
  end
  subgraph SVC["Services"]
    BS["lib/bookingService.js"]:::svc
    CS["lib/checkinService.js"]:::svc
    CT["lib/contentService.js · archiveService.js"]:::svc
    STG["lib/storage.js<br/>uploadWithProgress · signedUrl"]:::svc
    AAPI["admin/api.js<br/>rpc · list · one · insert · update · remove · adminApi"]:::svc
    PAPI["portal/portalApi.js"]:::svc
    WAPI["artist/portal/api.js · artist/services/workspaceApi.js"]:::svc
    CHAT["services/chatService.js via conversationService facade"]:::svc
    NS["services/notificationService.js"]:::svc
    MOCK["services/aiSupportService · messageService<br/>MOCK, browser-local"]:::mock
  end
  SB["lib/supabaseClient.js<br/>createClient(URL, publishable key)<br/>persistSession · autoRefreshToken"]:::sb
  BP --> BS
  PD --> BS & PAPI
  ART --> WAPI & STG & PAPI
  ADM --> AAPI & STG & CS & CT & NS & CHAT
  CHK --> CS
  CNT --> CT
  FRM --> SB
  AI --> MOCK
  AI --> CHAT
  BS & CS & CT & STG & AAPI & PAPI & WAPI & CHAT & NS --> SB
```

| Module | Talks to |
|---|---|
| `src/lib/supabaseClient.js` | Creates the only client. Returns `null` when `VITE_SUPABASE_URL` / public key are missing, so the app shows empty or error states instead of crashing |
| `src/lib/bookingService.js` | Edge Functions `razorpay-create-order`, `razorpay-verify-payment`, `send-ticket-email`; table `bookings` (own) |
| `src/lib/checkinService.js` | RPCs `check_in_ticket`, `my_checkin_events`, `event_checkin_stats`, `get_checkin_history`, `booking_checkin_history`; view `attendee_tickets` |
| `src/lib/contentService.js` | `tv_videos`, `diary_posts`, `gallery_albums`, `gallery_photos`, `public_artists`, `event_artists`; storage `content-media` (signed URLs) |
| `src/lib/archiveService.js` | Past `events`, `event_artists`, `programmes`, `programme_events`, content tables |
| `src/lib/storage.js` | Storage REST with the user's JWT (progress events); signed URLs for private buckets |
| `src/admin/api.js` | Generic table helpers + typed `adminApi` RPC wrappers; maps errors to safe messages (`friendlyError`); invokes `admin-invite-user` |
| `src/portal/portalApi.js` | Partner/artist portal RPCs (events, conversations, notifications, requirements, check-in access) + Realtime inserts |
| `src/artist/portal/api.js`, `src/artist/services/workspaceApi.js` | Artist application, availability, booking requests, profile completion, preferences |
| `src/services/chatService.js` (+ `conversationService` facade) | Support conversations, messages, Realtime channels `conversations:inbox`, `messages:<id>` |
| `src/services/notificationService.js` | `application_notifications`; invokes `send-approval-email` |

### Mock services: dead code paths

`src/services/{bookingService,collaborationService,enquiryService,eventService,userService,waitlistService}.js` say *"MOCK service — not connected to Supabase"*. They are only reachable behind `if (isMockAuth)`, and `src/config/auth.js` hard-codes `isMockAuth = false`. In the current build these branches never run (**LEGACY**). `eventService`, `waitlistService` and `assignmentRequestService`/`assignmentService` are not imported by any UI component. The exception is `messageService` + `aiSupportService`, which the public Tangy Assistant **does** use (browser-local transcript, **PARTIALLY IMPLEMENTED**, see 01).

## Build-time switches (`vite.config.js`)

```mermaid
---
title: Build-time guards in vite.config.js
---
flowchart TD
  classDef dec fill:#fff3c4,stroke:#b38600,color:#222
  classDef err fill:#fbdada,stroke:#b42318,color:#5a0d0d
  classDef res fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  S(["vite / vite build"]) --> A{"A VITE_ variable holds sb_secret_… or a service_role JWT?"}:::dec
  A -- yes --> E1["throw — refuse to start"]:::err
  A -- no --> B{"command = build?"}:::dec
  B -- yes --> C{"VITE_SUPABASE_URL + public key set,<br/>https (http only for localhost),<br/>not localhost on Vercel production?"}:::dec
  C -- no --> E2["throw (unless TANGY_ALLOW_UNCONFIGURED_BUILD=1 and not production)"]:::err
  C -- yes --> D
  B -- no --> D["define flags"]
  D --> F1["__TANGY_DEV_TOOLS__ = serve and TANGY_DEV_TOOLS ≠ off"]:::res
  D --> F2["VITE_DEMO_ADMIN_ENABLED = true only in serve or TANGY_ALLOW_DEMO_BUILD=1"]:::res
  D --> F3["__TANGY_REVIEW_MODE__ = VITE_TEAM_REVIEW_MODE and password set,<br/>off on Vercel production unless TANGY_ALLOW_REVIEW_BUILD=1"]:::res
  D --> F4["dev server plugin /__dev/mock-session<br/>loopback + local Supabase only"]:::res
```
