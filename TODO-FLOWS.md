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
- [] Extend QR token lifespans to match the full trail duration so organisers don't reissue codes mid-event.

11th Nov flow run test
SIGNUP & SIGNIN
- [] on org - lack of organiser signup/ organisation creation/ 
- [X] on org - login as admin and password (from create admin) all working
- [X] on senior - sign up & sign in & log out all working
- [X] on senior - join the organisations by selecting from drop-down list working (as automatically joined)
- [X] on org - organiser created a new trail -> on senior yes, only join the org then can see the activities
JOIN A TRAIL
- [] on org - organiser generated qr to join the trail -> can generate but on senior - the senior scan -> "invalid or expired token"
- [] on org - organiser generated invite link to join the trail -> can generate but on senior - the senior paste the link -> "not found/ invalid"
- [X] on senior - can join under the list of trails via button "JOIN TRAIL"
APPROVE/ CONFIRM THE PARTICIPANTS & CHECKIN
- [X] after apply for the trail, it shows the requests on the org -> organiser can approve/ confirm/ cancel
- [X] after confirm -> then the senior can scan qr to checkin
- [X] on senior -can checkin using QR code/ paste the link 
ACTIVITIES INTO THE TRAILS
- [X] on org - organiser can add/ remove an activity with the points rewarded and via scan QR code
- [] on org - organiser generate qr code for an activity not yet STATIC/ event duration
- [] on senior - senior scan and get the points, might need to improve the "Scan successfully confirm UI page" abit
SCORE & POINTS AND LEADERBOARD
- [X] on senior - the leaderboard seems ranking based on activities done, not the current rewards points
- [X] on senior - the leaderboard can view org/ system wide
- [X] on org - org can manually add the scores and shown on the senior side
REWARDS & REDEEMPTION
- [X] on senior - show correctly the rewarded points
- [X] on org - can create voucher with points costed, code
- [X] on senior - senior can redeemed and view the code successfully
INSIGHTS 
- [X] can see all the real-time data very nice 
REPORTS
- [X] not yet implemented the export but it is ok, not the main things (for now can be just for UI)
