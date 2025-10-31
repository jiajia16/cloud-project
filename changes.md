# Change Log

- Updated `.gitignore` to ignore workspace build artifacts and node modules for clean status.
- Declared `react-router-dom` as a peer dependency in `packages/ui/package.json` so shared components resolve router imports.
- Added matching dev dependencies in `packages/ui/package.json` to support local builds with `react-router-dom`.
- Introduced a post-signup welcome screen in `apps/senior-pwa/src/pages/Signup.jsx` and adjusted routing so the confirmation message appears before redirecting home.
- Added \\checklist.md\\ (backend root) listing every API endpoint for tracking coverage. 

- Senior PWA now triggers /auth/logout on sign-out (updated pps/senior-pwa/src/services/auth.js, pps/senior-pwa/src/contexts/AuthContext.jsx, and pps/senior-pwa/src/pages/Home.jsx). 

- Senior PWA auth module/context now support token refresh, `/users/me` hydration, and expiry-aware persistence.
