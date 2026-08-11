Milestone 3 — Analytics, Recommendations & Reporting

Project: YieldSense AI — Crop Yield Prediction & Agricultural Productivity Forecasting System Status: ✅ Complete — all four deliverables built, wired end-to-end, and verified with real data through the UI.

1. What This Milestone Delivers
#	Deliverable	Backend	Frontend
1–3	Recommendation Engine & Risk Assessment	POST /api/v1/analytics/recommendations	Risk panel on /predict
4–5	Analytics Dashboard (yield trend, crop comparison, productivity score)	GET /api/v1/dashboard/summary	/dashboard page (Recharts)
6	Report Export (CSV)	GET /api/v1/reports/export-csv	"Download Report" button on /dashboard

All endpoints require authentication and are scoped to the logged-in user.

2. New / Changed Backend Files
backend/
├── app/
│   ├── models/
│   │   ├── __init__.py            # now imports User + Prediction so SQLAlchemy
│   │   │                          #   can resolve the FK between them (see §4)
│   │   └── prediction.py          # added user_id (UUID, FK -> users.user_id)
│   ├── schemas/
│   │   ├── analytics.py           # NEW — recommendation engine request/response
│   │   ├── dashboard.py           # NEW — dashboard summary response shape
│   │   └── prediction.py          # added PredictionHistoryItem/Response
│   ├── routes/
│   │   ├── recommendations.py     # NEW — risk & recommendation logic
│   │   ├── dashboard.py           # NEW — /dashboard/summary
│   │   ├── reports.py             # wired in (already existed, unused until now)
│   │   ├── predictions.py         # now persists each prediction; added /history
│   │   └── auth.py                # rewritten to use real DB (see §4)
│   └── services/
│       └── jwt_service.py         # rewritten to use real DB (see §4)
├── seed_roles.py                  # one-off script, seeds the `roles` table
└── main.py                        # wires in dashboard + reports routers
3. API Reference
POST /api/v1/analytics/recommendations

Rule-based recommendation engine + risk assessment. Input: crop type, soil pH, N/P/K, avg temp, rainfall. Output: overall risk level (Low/Medium/High), numeric risk score (0–100), itemized risks with advice, fertilizer/soil recommendations, and general best-practice tips.

GET /api/v1/dashboard/summary

Returns the current user's prediction history reshaped for charting:

json
{
  "yield_trend": [{"season": "Aug 2026", "yield": 6078.8}],
  "productivity_score": 100.0,
  "crop_comparison": [{"name": "Wheat", "yield": 6078.8}]
}

productivity_score = latest prediction's yield as a percentage of the user's all-time average. crop_comparison = average yield per crop type (only shown in the UI once 2+ crop types exist).

GET /api/v1/reports/export-csv

Streams the current user's full prediction history as a downloadable CSV.

GET /api/v1/predictions/history

Raw prediction history for the current user (used internally; dashboard summary is the reshaped/aggregated version of this same data).

4. Notable Fixes Made During This Milestone

These weren't part of the original Milestone 3 spec but were blocking prerequisites discovered while wiring up per-user data:

Auth was not DB-backed. jwt_service.py previously used an in-memory dict (_FAKE_USER_DB) as a Milestone-1 placeholder. Since dashboard/history features require real, persistent user_ids tied to real database rows, this was rewritten to query/insert against the real users/roles tables. onboarding_service.py's call site was updated accordingly.
roles table required seed data. seed_roles.py inserts the five known roles (farmer, cooperative, agribusiness, government, admin). Run once per fresh database:
bash
  python seed_roles.py
SQLAlchemy model registration. app/models/__init__.py now explicitly imports both User and Prediction — without this, SQLAlchemy can't resolve the predictions.user_id foreign key at runtime (it would only work if some unrelated code path happened to import User first).
Alembic migration history was reset once. The original "initial" migration was an empty stub (pass/pass) while roles/users/predictions had apparently been created outside of Alembic's tracking. Migration history was reset (alembic stamp base) and a single clean migration (79710fc49325_create_all_tables) now accurately reflects the schema.
5. Known Limitations / Deviations from Spec
Dashboard scoping. The mentor's Week 5 handout sample code scopes dashboard data by farm_id. This project's Prediction model ties records to user_id, not farm_id — farm profiles created during onboarding are not yet DB-backed (onboarding_service.py still uses an in-memory _FAKE_FARM_DB stand-in, same pattern the auth system had). Until that's wired up, "one user = one farm" is the practical scope. Documented inline in app/routes/dashboard.py.
"Season" is derived, not stored. There's no explicit season field on Prediction; the dashboard labels each point using created_at.strftime("%b %Y"). Fine for the current use case, but worth revisiting if true multi-season comparison (not just chronological) is needed later.
onboarding_service.py's farm-profile storage is still the Milestone-1 in-memory placeholder and should be migrated to a real farms table in a future pass — same category of issue the auth system had, not yet addressed for farms specifically.
6. How to Verify Locally
bash
# Backend
cd backend
pip install -r requirements.txt
python seed_roles.py          # only needed once, on a fresh DB
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
Register an account at /onboarding or /login → register.
Log in — you should land on /predict (not /dashboard).
Submit a prediction. Confirm the yield card and risk assessment panel both render.
Click Dashboard in the nav. Confirm Productivity Score and Yield Trend chart show your data.
Submit a second prediction with a different crop type — confirm the Crop Comparison bar chart appears.
Click Download Report (CSV) — confirm a file downloads with your prediction rows.
7. Suggested Follow-ups (Not Blocking Milestone 3)
Persist farm profiles from onboarding to a real farms table; add farm_id to Prediction for true multi-farm dashboards.
Add pagination to /predictions/history and /dashboard/summary once prediction counts grow large.
Consider a PDF export option (Task 6, Option A from the original spec) alongside the existing CSV export.