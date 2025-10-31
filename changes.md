# Change Log

- Updated `.gitignore` to ignore workspace build artifacts and node modules for clean status.
- Declared `react-router-dom` as a peer dependency in `packages/ui/package.json` so shared components resolve router imports.
- Added matching dev dependencies in `packages/ui/package.json` to support local builds with `react-router-dom`.
- Introduced a post-signup welcome screen in `apps/senior-pwa/src/pages/Signup.jsx` and adjusted routing so the confirmation message appears before redirecting home.
- Added \checklist.md\ (backend root) listing every API endpoint for tracking coverage.

- Senior PWA now triggers /auth/logout on sign-out (updated apps/senior-pwa/src/services/auth.js, apps/senior-pwa/src/contexts/AuthContext.jsx, and apps/senior-pwa/src/pages/Home.jsx).

- Senior PWA auth module/context now support token refresh, `/users/me` hydration, and expiry-aware persistence.
- Senior PWA trails views now call live APIs for listings, registrations, and confirmed trails (new apps/senior-pwa/src/services/trails.js, updated apps/senior-pwa/src/pages/Home.jsx and apps/senior-pwa/src/pages/MyTrails.jsx).
- Trail detail, join/cancel UI, and registration status lookup added but backend session cleanup still unstable (in progress; see trails-activities-svc/app/db.py).
- Senior PWA trail detail page now memoizes its refresh handler without trail-state churn and tracks first-load with a ref, preventing the view from spamming `GET /users/me/registrations`/`GET /trails/:id` while open.
