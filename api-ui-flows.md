# SilverTrails API-Driven UI Flows

This document maps the front-end user journeys to the underlying service calls in the SilverTrails platform. It covers both organiser-facing flows (Next.js dashboard) and senior-facing flows (PWA), highlighting how each API is exercised through the UI and flagging notable UX considerations.

## Organiser Dashboard (`apps/organizer-dashboard/src/services`)

### Auth & Identity (`auth.ts`)

- **Sign-in sequence (`POST /auth/organisers/login`)**
  1. Organiser submits the login form (`/login` page) with username/password.
  2. `organiserLogin` returns tokens + basic profile; `AuthContext` persists them and immediately triggers `fetchOrganiserProfile` (`GET /users/me`) to hydrate role/org data.
  3. On success the UI redirects to the dashboard; on failure the form surfaces the error message from the API.
- **Session upkeep (`POST /auth/refresh`)**
  1. `AuthContext` schedules a refresh ~1 minute before `expires_in`.
  2. `organiserRefresh` exchanges the refresh token; `fetchOrganiserProfile` re-runs to keep `org_ids` current.
  3. Any refresh failure forces a silent logout to avoid using a stale token.
- **Explicit logout (`POST /auth/logout`)**
  1. Triggered from the user menu; `organiserLogout` is best-effort (errors are swallowed).
  2. Local storage and context are cleared regardless of network success so the UI always returns to `/login`.
- **Participant lookup (`GET /users/lookup`)**
  1. Forms that accept “participant ID / NRIC” call `resolveParticipantUserId`; if the input is not UUID-shaped it performs an NRIC lookup.
  2. The UI should therefore label the field clearly (“NRIC or User ID”) and surface lookup errors inline.
- **Participants list & organisation assignment**
  1. Participants page concurrently loads `listParticipants` (`GET /users/participants`) and `listOrganisations` (`GET /orgs`).
  2. Selecting an organisation and pressing “Assign” calls `assignParticipantToOrganisation` (`POST /orgs/{orgId}/members`).
  3. The table immediately mutates local state to reflect the new membership; the alert banner confirms or reports API errors.
- **UX notes**
  - Participant assignment assumes organisers can pick any org, even ones they do not belong to—consider filtering by `user.org_ids` if policy requires it.
  - `resolveParticipantUserId` throws when the NRIC is unknown; current UI treats this like a generic failure, so adding explicit messaging (“NRIC not found”) would reduce confusion.

### Trails Management (`trails.ts`)

- **Browse & filter (`GET /trails`)**
  1. Manage Trails page calls `listTrails` with optional `org_id` and `status_filter`.
  2. Selections in the UI update the query params; the list re-fetches when filters change.
- **Create new trail (`POST /trails/orgs/{orgId}`)**
  1. “Create Trail” button opens the form backed by `createTrail`.
  2. After successful creation, the modal closes, the list refreshes, and a toast confirms.
- **Edit trail (`PATCH /trails/{trailId}`)**
  1. Selecting a trail loads details via `getTrail` for preview.
  2. “Edit” reuses the same form and issues `updateTrail`; fields like status can be toggled.
  3. The UI should warn before changing status because it directly impacts registration actions.
- **Registration oversight (`GET /trails/{trailId}/attendees`)**
  1. Opening the “Registrations” tab fetches a paged list through `getTrailRegistrations` (limit 25).
  2. Action buttons map to `approveRegistration`, `confirmRegistration`, `rejectRegistration`, `cancelRegistration`, each POSTing to `/registrations/{id}/{action}` and refreshing the list on success.
  3. `getRegistrationStatus` underpins the “Lookup attendee” form—organisers must know the attendee’s user ID string; providing NRIC lookup here would align with other flows.
- **Register on behalf (`POST /registrations/trails/{trailId}/by-organiser`)**
  1. Organiser enters NRIC/user ID; `resolveParticipantUserId` runs before `createRegistrationForTrail`.
  2. Successful registrations update both the registration table and organiser’s personal lists (`listOwnRegistrations`, `listOwnConfirmedTrails`).
- **Invite links (`POST /invites/trails/{trailId}`)**
  1. “Generate Invite” calls `createTrailInvite` to obtain a token + shareable URL.
  2. “Preview invite” calls `previewInvite`; the UI shows the trail summary pulled from the token.
  3. “Accept invite” currently calls `acceptInvite` using the organiser’s session—useful for dry runs, but seniors cannot redeem the link without their own flow (see UX notes).
- **UX notes**
  - Invite acceptance is organiser-only today; to support seniors self-registering, expose a public/attendee endpoint or guide them to log into the PWA instead.
  - `getRegistrationStatus` expects internal IDs; consider letting the UI reuse `resolveParticipantUserId` so staff can search by NRIC.

### Check-in Operations (`checkins.ts`)

- **Generate event QR (`POST /checkin/trails/{trailId}/qr`)**
  1. Clicking “Generate QR” issues `createTrailQr`, yielding a short-lived token and canonical URL.
  2. The UI shows expiry metadata so staff know when to refresh.
- **Distribute QR**
  1. “Copy link” copies either the returned `url` or the organiser-provided vanity link.
  2. “Download QR” first calls `getTrailQrImage` (`GET .../qr.png`) and then anchors the blob for download.
- **Monitor attendance (`GET /checkin/trails/{trailId}/roster`)**
  1. “View roster” fetches `Checkin` entries (user, method, timestamp) so staff can reconcile onsite.
  2. Errors (e.g., expired session) are surfaced in-line; there is no retry/backoff logic beyond manual refresh.
- **UX notes**
  - `getTrailQrImage` returns raw errors via `handleError`; ensure the UI distinguishes between “token expired” and network faults so staff can regenerate quickly.

### Points & Rewards (`points.ts`)

- **Review organiser balance (`GET /points/users/me/balance`)**
  1. When the organiser selects an organisation, the page calls `getMyPointsBalance` and `getMyPointsLedger` to populate their own reward history.
  2. Token expiry is handled by `AuthContext`; failures prompt the user to re-authenticate.
- **Adjust senior points (`POST /points/orgs/{orgId}/adjust`)**
  1. Staff submits a form (member identifier + delta + reason).
  2. `adjustPoints` resolves NRIC/UUID, posts the adjustment, and the UI echoes the new balance from the response.
  3. Negative deltas are accepted; the UI should guard against overdrawing if the backend enforces limits.
- **Voucher management**
  1. `listVouchers` populates the catalogue; filters by organisation via `org_id`.
  2. Creating (`POST /vouchers/orgs/{orgId}`) or editing (`PATCH /vouchers/{voucherId}`) vouchers updates the table immediately on success.
- **UX notes**
  - Because `adjustPoints` resolves identifiers by calling the auth service, latency spikes can occur; consider prefetching participant suggestions to make the flow feel snappier.
  - Voucher `total_quantity` can be null to denote unlimited; ensure the form copy clarifies this to avoid unintended unlimited vouchers.

### Leaderboards & Attendance (`leaderboard.ts`)

- **System-wide leaderboard (`GET /leaderboard/system`)**
  1. Insights/Reports pages request `getSystemLeaderboard`, optionally constraining `limit` or a `ym` (YYYYMM) period.
  2. The UI renders rank + score; there is no pagination, so consider capping `limit` UI-side.
- **Organisation leaderboard (`GET /leaderboard/orgs/{orgId}`)**
  1. Selecting an org fetches data via `getOrgLeaderboard`; errors fall back to an empty state.
- **Trail attendance (`GET /attendance/trails/{trailId}`)**
  1. Within a trail detail view, `getTrailAttendance` surfaces the raw check-in entries for that org.
- **Personal attendance (`GET /attendance/users/me`)**
  1. Currently used to show the organiser’s own participation history; mainly useful for testing.
- **UX notes**
  - Org selection should be disabled when the organiser lacks membership (`user.org_ids`), otherwise the API returns 403.
  - `ym` expects an integer (e.g., `202401`); adding a date picker in the UI helps prevent malformed queries.

## Senior PWA (`apps/senior-pwa/src/services`)

### Auth (`auth.js`)

- **Signup (`POST /auth/signup`)**
  1. Seniors complete the signup form with name/NRIC/passcode; `signupAttendee` enforces `role: attend_user`.
  2. On success the UI redirects to login and surfaces a confirmation banner.
- **Login (`POST /auth/login`)**
  1. Enter NRIC + passcode; `loginUser` returns tokens and the UI stores them via `AuthContext`.
  2. `fetchCurrentUser` immediately runs to populate name/org memberships for personalised greeting.
- **Session management**
  1. Background refresh mirrors the organiser flow, calling `refreshTokens` before expiry.
  2. `logoutUser` clears state regardless of network success so the UI instantly locks.
- **UX notes**
  - All requests include `credentials: "include"`; ensure the PWA is served over HTTPS so cookies survive installs.

### Trails & Registrations (`trails.js`)

- **Discover trails (`GET /trails`)**
  1. Home/Trails page fetches `listTrails`, optionally filtering by organisation, status, or date range (controlled by UI filters).
  2. Seniors do not need to be signed in to browse, but authenticated requests include the bearer token to expose personalisation.
- **Trail detail & registration (`GET /trails/{trailId}`, `POST /registrations/trails/{trailId}/self`)**
  1. Selecting a trail loads detail via `getTrail`.
  2. “Register” button calls `registerForTrail`; optional note is sent as part of the body.
  3. Success updates local state and triggers toasts; repeated registrations should gracefully handle “already registered” errors from the API.
- **Manage own registrations**
  1. `getMyRegistrations` backs the “My Trails” list.
  2. `getMyConfirmedTrails` powers quick shortcuts (e.g., upcoming events card).
  3. Cancelling uses `cancelRegistration` (DELETE `/registrations/{registrationId}`) and removes the entry from both lists.
- **Check status by trail (`GET /trails/{trailId}/registrations/by-user/{userId}`)**
  1. Primarily used internally to show status badges; the UI pulls `userId` from the auth context to avoid manual entry.
- **UX notes**
  - Incoming invite links need their own handler—currently the PWA does not consume organiser-generated tokens, so consider adding a deep link that calls the attendee equivalent of `acceptInvite`.

### Check-ins (`checkins.js`)

- **Scan QR (`POST /checkin/scan`)**
  1. Scan page uses the device camera; decoded strings run through `extractTokenFromScan` to handle raw URLs or `token=...` fragments.
  2. When the user confirms, `scanCheckin` posts the token; success yields check-in metadata for feedback.
  3. Errors differentiate between authentication issues (“sign in”) and invalid tokens (“ask organiser to refresh QR”).
- **View history (`GET /checkin/users/me`)**
  1. The “History” component calls `listMyCheckins` to show past scans ordered by `checked_at`.
- **UX notes**
  - Because QR tokens expire quickly, the UI should surface their expiry when possible to reduce repeat failures.
  - `extractTokenFromScan` accepts relative URLs; guard against allowing arbitrary text that is not a token to avoid confusing seniors.

### Points & Rewards (`points.js`)

- **Balance overview (`GET /points/users/me/balance`)**
  1. Rewards page loads current balance once the user picks an organisation (if they belong to several).
- **Ledger history (`GET /points/users/me/ledger`)**
  1. Displays the transaction feed; pagination is not yet implemented, so the UI currently shows the backend default range.
- **Browse vouchers (`GET /vouchers`)**
  1. Calls `listOrgVouchers` with `org_id`; results populate redeemable rewards.
- **Redeem voucher (`POST /vouchers/{voucherId}/redeem`)**
  1. Tapping “Redeem” posts the request; success triggers a detail modal and refreshes both balance and ledger.
- **Redemption history (`GET /vouchers/users/me/redemptions`)**
  1. Used to show past rewards; consider preloading to reduce wait after redemption.
- **UX notes**
  - The UI should disable redemption if the balance is insufficient; the API will reject it, but proactive checks improve clarity.
  - When no organisation is set, helper text prompts the user to contact an organiser, matching the copy in `Rewards.jsx`.

### Leaderboards & Attendance (`leaderboard.js`)

- **View system leaderboard (`GET /leaderboard/system`)**
  1. Leaderboard page fetches `getSystemLeaderboard`; default limit is 50.
- **View organisation leaderboard (`GET /leaderboard/orgs/{orgId}`)**
  1. Switching organisations triggers another fetch; missing membership should prompt the user to join via organiser.
- **Attendance feed (`GET /attendance/users/me`)**
  1. Provides the senior’s own check-in history for the “My Activity” section.
- **UX notes**
  - Large leaderboards can be overwhelming; consider chunking the response client-side or letting users filter by period (`ym`).

## Cross-App Touchpoints

- **QR attendance pipeline**
  1. Organiser generates a QR (`createTrailQr`) and optionally downloads the PNG.
  2. Seniors scan the code in the PWA (`scanCheckin`), which consumes the same token.
  3. Organiser roster (`getTrailRoster`) updates in near real-time, allowing staff to verify attendance.
- **Trail registration pipeline**
  1. Organiser advertises new trails (list + create APIs).
  2. Seniors register via `registerForTrail`; organisers manage statuses via the registration APIs.
  3. Conflicts (e.g., full capacity) should be surfaced consistently in both UIs to prevent contradictory messaging.
- **Points lifecycle**
  1. Organisers adjust balances and configure vouchers.
  2. Seniors view balances, redeem vouchers, and see ledger entries; organisers should monitor the same via their ledger views to reconcile rewards.
- **Invite links**
  - Tokens are generated in the organiser app but lack a dedicated attendee consumption path. Adding a PWA route that reads the token, previews the trail (`previewInvite`), and self-registers would close this loop.

## Open UX Questions

- Should organiser-only APIs (e.g., `acceptInvite`, `getMyAttendance`) be exposed to seniors, or are they meant solely for administrative testing?
- Can organisers act on behalf of organisations they are not a member of? If not, add backend validation or UI gating around `assignParticipantToOrganisation` and trail CRUD.
- Do seniors ever know their internal user ID? If not, ensure every UI entry point that currently asks for it first resolves NRIC automatically.
- How should expired QR tokens communicate next steps to seniors? Consider including expiry timestamps in the token payload so the PWA can present clearer guidance.

