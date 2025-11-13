# Flow Fix Checklist

- [x] Allow seniors to re-register for an event they previously cancelled (ensure UI re-enables the join action and backend accepts the repeat registration).
- [x] Add organiser dashboard view to monitor all seniors' point balances with organisation filters.
- [x] Build attendee-facing invite consumption flow so seniors can register via tokens organisers share.
- [x] Let organiser tools accept NRIC lookups everywhere (status checks, registrations, point adjustments) instead of raw user IDs.
- [x] Expose senior balance monitoring so organisers aren't limited to their own ledger (shares scope with monitoring view above).
- [x] Add QR "scan to join" experience for unregistered seniors - available via /join with auto hand-off after login.
- [x] Investigated and fixed senior invite auto-registration: login/signup now auto-consumes pending tokens and surfaces status on Home.
- [x] Surface a prominent banner for newly signed-up seniors who lack an organisation assignment ("You have not been assigned to an organisation, please contact an admin.")
- [x] Enable organisers to browse leaderboards for all organisations with an organisation filter (not just the ones they belong to).
- [x] Decide on policy for rejoining after cancellation and align backend behaviour with the planned UI change.
- [x] Automate point awards on trail attendance: qr-checkin now mints a service token and hits points ingest whenever NATS awarding is disabled.
- [x] Coordinate backend support for "scan to join" and bulk balance/leaderboard views (documented service requirements and env wiring in `docs/backend-support.md`).
- [x] Update organiser Points Ledger to display organisation-wide transactions (not just the organiser's own log).
- [x] Ensure onboarding banner ties into access controls (Rewards + Scan disabled until seniors are assigned to an organisation, with backend enforcement).
- [x] Refresh the senior experience automatically after an organiser assigns them to an organisation (no manual logout/login).
- [x] Display participant name and NRIC alongside the unique ID in organiser registration rosters.
- [x] Populate the organiser dashboard "Recent Activities" panel with live trail data pulled from Trails & Orgs services.
- [x] Provide a way to set per-trail point/leaderboard rewards (documented backend gaps + current stance in `docs/backend-support.md`).
- [x] Add an organiser rewards management tab for org-scoped reward CRUD.
- [x] Replace hardcoded organiser overview stats (participants/activities/completion rate) with live service data.

<!-- - [] might need to revise the user flow a little bit, as this platform for elderly -> give me more freedom, exploration to more things -> the priority is them mah -> upon signing up they can join any org -> no need for the admin to add them to org, the organiser only come to confirm the attandance list of an activity/ trails
- [] not sure why my QR code not working and all invite link to register for a trail not working 
- [] invite to a trail code at the senior-pwa dashboard not reading properly 
- [] after registered successfully (manual) for a trail, the checkin qr code and checkin link not working also, and then run once, should be able to run twice until success or token expired. hence attendance feature not able to test yet
- [] make new reward -> point cost can be 0 
- [] after redeemed the voucher, go code displayed for the senior 
- [] implement the report functionalities on the org dashboard
- [] upon signing up 2 seniors, joined the same org, the leaderboard not implemented 
- [] create the add activities for a trail -> activity 1 done then scan qr code then get the points, activitiy 2 done then scan qr code then get the points, etc. -->

Additional clarifications of the open items above:

- [x] Rework onboarding so seniors can freely join whichever organisation they want immediately after signup, leaving organisers responsible only for attendance confirmation.
- [x] Debug the QR / invite flow end-to-end because trail invite links and QR joins are currently failing to register seniors.
- [x] Fix the senior PWA dashboard so the "invite to a trail" code entry parses and displays invite tokens correctly.
- [x] Make check-in QR codes/links reliable after manual registration-each should allow at least two attempts until the token succeeds or expires so attendance can actually be tested.
- [x] Backend now reserves + releases QR tokens so retries are possible; once deployed, run end-to-end QA to confirm seniors can rescan successfully before closing the reliability item above.
- [x] Allow organisers to create rewards whose point cost is zero (free rewards).
- [x] After a voucher redemption, surface the generated "GO code" (or redemption code) back to the senior immediately.
- [x] Build the organiser reporting section that was planned for the dashboard (exportables / KPIs) — organiser Insights now pulls live member counts, attendance trends, trail stats, and points activity.
- [x] Persist per-trail activity definitions from Manage Trails into backend storage so organiser-created activities survive refreshes.
- [x] Ensure leaderboards refresh when multiple seniors join the same organisation and support multi-activity trails awarding points after each activity's QR scan (backend now trusts activity metadata from QR tokens; still need senior app auto-selection + end-to-end verification).
- [X] Extend QR token lifespans to match the full trail duration so organisers don't reissue codes mid-event.

11th Nov flow run test
SIGNUP & SIGNIN
- [X] on org - lack of organiser signup/ organisation creation/ 
- [X] on org - login as admin and password (from create admin) all working
- [X] on senior - sign up & sign in & log out all working
- [X] on senior - join the organisations by selecting from drop-down list working (as automatically joined)
- [X] on org - organiser created a new trail -> on senior yes, only join the org then can see the activities
JOIN A TRAIL
- [X] on org - organiser generated qr to join the trail -> can generate but on senior - the senior scan -> "invalid or expired token"
- [X] on org - organiser generated invite link to join the trail -> can generate but on senior - the senior paste the link -> "not found/ invalid"
- [X] on senior - can join under the list of trails via button "JOIN TRAIL"
APPROVE/ CONFIRM THE PARTICIPANTS & CHECKIN
- [X] after apply for the trail, it shows the requests on the org -> organiser can approve/ confirm/ cancel
- [X] after confirm -> then the senior can scan qr to checkin
- [X] on senior -can checkin using QR code/ paste the link 
ACTIVITIES INTO THE TRAILS
- [X] on org - organiser can add/ remove an activity with the points rewarded and via scan QR code
- [?] on org - organiser generate qr code for an activity not yet STATIC/ event duration
- [X] on senior - senior scan and get the points, might need to improve the "Scan successfully confirm UI page" abit
SCORE & POINTS AND LEADERBOARD
- [X] on senior - the leaderboard seems ranking based on activities done, not the current rewards points
- [X] on senior - the leaderboard can view org/ system wide
- [X] on org - org can manually add the scores and shown on the senior side
REWARDS & REDEEMPTION
- [X] on senior - show correctly the rewarded points
- [X] on org - can create voucher with points costed, code
- [X] on senior - senior can redeemed and view the code successfully
- [x] on senior - enrich rewards points history to show the trail and activity titles instead of generic "Activity check-in" entries
INSIGHTS 
- [X] can see all the real-time data very nice 
REPORTS
- [X] not yet implemented the export but it is ok, not the main things (for now can be just for UI)

- [X] on the org, the expired date and time for qr code not accurate

## Suggestions
- [x] Resolve organiser dashboard hydration mismatch reported by Next.js (`react-dom-client.development.js:5528` surfaces "Hydration failed because the server rendered HTML didn't match the client" when loading `apps/organizer-dashboard/src/app/page.tsx`). Identify non-deterministic SSR output (e.g. `Date.now()`, locale formatting, `Math.random()`, or `window` branches) and move it into client-only effects so the server markup matches the client tree.
- [x] Replace organiser dashboard participant identifiers (`530b4905...6d09`) wherever they still appear with a composite of participant ID + name + NRIC so organisers can immediately see who each record belongs to without cross-referencing IDs manually (focus on the remaining UUID-only views such as Trails rosters, Points, Rewards; leave the sections that already include name/NRIC as-is unless there's a cleaner shared component to adopt).
- [x] Wire up the "My organiser activity" tile in Manage Trails so it actually lists organiser-created trails/activities (currently renders a placeholder div with no logic). Decide what data should appear and hook it to the Trails service.
- [x] Implement the "Export Reports" action in the organiser Reports tab so downloading CSV/XLS summaries works instead of a no-op button.
- [x] Remove redundant per-tab organisation dropdowns (Points, Rewards, Insights leaderboards) and ensure the global organisation selector drives those views so the filters remain in sync.
- [x] Expand the Overview/Recent Activities widget to include more organiser actions (trail creation, approvals, rewards edits) with clear labels instead of the minimal event list today.
- [x] Make the Manage Trails refresh button reload both the trail list and the currently selected trail's detail pane, so organisers see updated metadata immediately after refresh.
- [x] Fix `/trails/reports/orgs/{org_id}/overview` aggregation so Postgres doesn't reject the query for selecting full `Trail` rows without grouping every column (`csc3104_elderly_platform/trails-activities-svc/app/routers/trails.py` ~245-290). Select only required columns or expand the `GROUP BY`.
- [x] Align organiser Insights org selection with backend permissions: either hide orgs the user cannot access or relax `GET /orgs/{id}/stats` to allow admin/service tokens so the UI stops throwing 403 errors when browsing other orgs (`cloud-project/apps/organizer-dashboard/src/app/insights/page.tsx`, `csc3104_elderly_platform/authentication-svc/app/routers/orgs.py`).
- [ ] Expand automated coverage across services by adding integration tests for points awarding/redemption in `points-vouchers-rules-svc` and UI tests for the senior rewards flow in `apps/senior-pwa`. This guards against regressions whenever the ledger or voucher logic changes and gives confidence before releases.
- [x] Fix Manage Trails check-in QR generator so the QR/link updates per trail; right now the generated token persists when navigating to other trails and shows the same link.
- [x] When returning to a trail that already had a check-in QR generated, show the existing QR/link instead of clearing the state so organisers don't need to regenerate immediately.
- [x] Introduce observability hooks (structured audit events + Prometheus counters) around voucher redemption, manual adjustments, and check-in awards. Emit events via a dedicated logger and expose metrics on a `/metrics` endpoint so operations can trace issues and set up alerts for anomalies.
- [ ] Optimise senior app data fetching by layering in a client-side cache (React Query/SWR) for points, ledger, and vouchers. Cached reads reduce perceived latency when seniors switch organisations and cut redundant API calls.
- [x] Centralise copy and formatting for localisation by extracting strings/date formats in the senior PWA into a translation module. This prepares the interface for multi-language support (English, Mandarin, Malay, Tamil) and keeps regional formatting consistent.
- [ ] (Optional) Streamline developer onboarding with a devcontainer or compose profile that boots all core services plus seed data. Document the workflow so new contributors can run end-to-end tests locally without manual setup. 

## UI/UX Suggestions
- [ ] Improve senior accessibility by shipping a quick settings sheet (font scaling, high-contrast mode, language toggle) and auditing components for WCAG-compliant touch targets and optional audio cues.
- [ ] Add contextual assistance to the senior PWA—a floating "Need help?" button, inline tips for QR scanning/joining trails, and celebratory animations in the scan-success flow—to reduce anxiety and guide first-time users.
- [ ] Enrich the senior rewards ledger UI with visual cues (icons, color accents, badges) and a lightweight timeline widget on Home so seniors immediately recognise how they earned points and celebrate milestones.
- [ ] Upgrade organiser insights with drill-down modals and persistent filters, surfacing at-a-glance stats (top trail, weekly redemptions) on dashboard load so organisers can act without navigating away.
- [ ] Introduce wizard-style organiser workflows for trail setup and voucher creation, offering real-time previews and suggested point values derived from historical data to speed up repeat tasks.
- [ ] Build a cross-role notification centre: organisers compose announcements with delivery tracking while seniors receive in-app and email notices with consistent acknowledgement states.

