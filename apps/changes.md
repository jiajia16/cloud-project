- Adjusted senior Home header: profile button no longer logs out, added separate logout button and placeholders for profile/language actions. 

- Senior PWA logout now calls /auth/logout (see AuthContext.jsx, services/auth.js) and explicitly navigates to login. Updated Home header to use new logout handler. 

