# Tangy World — accessibility audit (local)

Method: automated checks in the E2E suites plus a scripted, manual-style
review of keyboard behaviour, dialog semantics and colour contrast. No
screen-reader session with real assistive technology (VoiceOver, NVDA,
TalkBack) has been run — that remains to be done by a person.

## Checked and passing (automated, every run)

| Check | Where | Result |
| --- | --- | --- |
| No sideways scrolling | 18 public pages × 5 widths (375, 390, 412, 768, 1440) — `responsive.mjs`; 13 admin pages × 3 phone widths and every remaining route at 390 px — `routing.mjs`, `sweep.mjs`; portal and admin flows — `mobile.mjs` | pass |
| One visible `<h1>` per public page | `responsive.mjs` | pass |
| Every `<img>` has an `alt` attribute (empty for decoration); gallery photos require alt text (database constraint) | `responsive.mjs`, `content_cms.test.sql` | pass |
| Every visible button and link has an accessible name | `responsive.mjs` | pass |
| Per-page `<title>` on public pages; `Tangy Admin — <page>` in the console | `responsive.mjs`, `routing.mjs` | pass |
| First Tab stop is "Skip to content" (console) | `routing.mjs` | pass |
| Dialogs: focus moves in on open, Tab / Shift+Tab stay inside, Escape closes, focus returns to the opener | admin `Modal` / `Drawer`, public sign-in dialog, gallery lightbox — `routing.mjs` | pass |
| Buttons / inputs ≥ 44 px on the checkout steps | `checkout.mjs` | pass |

## Fixed in this pass

- Focus trap, focus restore and Escape for every admin modal and drawer (`useFocusTrap`), the public sign-in dialog (now `role="dialog"`, `aria-modal`, labelled by its heading) and the gallery lightbox.
- Section navigation is real links with `aria-current="page"` (admin section tabs, portal sections, dashboard sections); the sidebar marks both the section and the sub-section on nested pages.
- Breadcrumb trail (`nav aria-label="Breadcrumb"`, current page `aria-current="page"`, not a link).
- Colour contrast: low-opacity text (cream at 30–50 % on the dark backgrounds, 2.2–3.8 : 1) raised to ≥ 60 % (≥ 5.2 : 1); ink at 50 % on paper (3.4 : 1) raised to 70 % (6.3 : 1). 79 files.
- Archive lightbox close buttons have their own handler and a 44 px target.
- Status messages use `role="status"` / `role="alert"` (waitlist, checkout, forms, toasts); loading states announce with `aria-live`.

## Remaining findings

1. **Rust accent `#B94717` on small text** — 3.4 : 1 on the dark backgrounds, 4.0–4.1 : 1 on paper (AA needs 4.5 : 1 for text under 18.66 px bold). Used for ~64 small uppercase labels/kickers. Needs a per-context choice (a darker rust on paper, a lighter one on dark), best made with the designer.
2. **Screen-reader pass** with real assistive technology on the booking flow, check-in terminal and admin tables.
3. The home page's animated sections respect `prefers-reduced-motion` in CSS; this was not re-audited here.
