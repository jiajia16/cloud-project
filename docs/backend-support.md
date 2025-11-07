# Backend Support Notes

## Scan-to-Join Flow

- **Services involved:** `authentication-svc` (JWT/JWKS + invite validation), `trails-activities-svc` (invites), `qr-checkin-svc` (QR issuance), `points-vouchers-rules-svc` (rewards afterwards).
- **Endpoints to keep reachable from the browser:**
  - `POST /trails/{trail_id}/invites` (organiser dashboard) – requires organiser JWT scoped to the org.
  - `GET /trails/invites/{token}` and `POST /trails/invites/{token}/register` (senior PWA) – CORS enabled via service defaults.
  - `POST /auth/service-token` – qr-checkin-svc mints a service JWT so points ingestion works even without organiser credentials.
- **Environment configuration:**
  - `qr-checkin-svc` needs `SERVICE_CLIENT_ID/SECRET` and `AUTH_BASE_URL` so it can mint service tokens when `USE_NATS_FOR_POINTS=false`.
  - All services already export `http://localhost:5173` and `http://localhost:3000` in their CORS allow-lists (see each FastAPI app initialisation).

## Bulk Balance & Leaderboard Views

- **Services involved:** `authentication-svc` (org + participant lookup), `points-vouchers-rules-svc` (balances/ledger), `leaderboard-attendance-svc` (system/org leaderboards).
- **Endpoints consumed by organiser dashboard:**
  - `GET /orgs` and `GET /orgs/{org_id}/members` (authentication service) for populating dropdowns and NRIC lookups.
  - `GET /points/orgs/{org_id}/balances` and `GET /points/orgs/{org_id}/ledger` for organisation-wide points snapshots.
  - `GET /leaderboard/system` and `GET /leaderboard/orgs/{org_id}` for insights page.
- **Access scopes:**
  - Organiser JWTs include `org_ids`; each backend endpoint checks that the organiser belongs to a requested organisation.
  - Service-machine credentials (for future batch jobs) can be minted via `/auth/service-token`.

## Per-Trail Reward Settings

- Not implemented yet. Current rules in `points-vouchers-rules-svc` operate at the organisation level (`/orgs/{org_id}/rules`) and only distinguish between `checkin` and `manual_bonus` types.
- Trails do not carry a reward multiplier, so QR check-ins always award the org’s default rule (or the manual adjustment flow). To support per-trail overrides we would need to:
  - Add a `reward_points` (or similar) column to the Trails model and expose it via `trails-activities-svc`.
  - Include that value in the payload that `qr-checkin-svc` sends to `points-vouchers-rules-svc` (HTTP ingest or NATS).
  - Let organisers configure the override in the Manage Trails UI.
- Until those backend changes are in place, document that reward settings are org-wide only and trail-specific bonuses must be handled via manual point adjustments.

With the above in place, both the scan-to-join experience and the organiser bulk views work against dev/prod environments without additional feature flags.
