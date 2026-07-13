# Waste-to-Value Rwanda Platform

Full-stack circular economy workflow for posting industrial waste, approving quality, matching recyclers, coordinating transport, and issuing reuse certificates.

The active system is the new WTV app:

- React/Vite frontend in `frontend/src/wtv`
- Express API in `backend/routes.js`
- Sequelize/MySQL models in `backend/models`
- Demo data seeded by `backend/seed.js`

## Run Locally

Install dependencies:

```bash
npm run install:all
```

Seed the database:

```bash
npm run db:seed --prefix backend
```

Start frontend and backend together:

```bash
npm run dev
```

Frontend: `http://localhost:5173`  
Backend health check: `http://localhost:5000/api/health`

## Demo Accounts

All demo users use password `password123`.

| Role | Email |
| --- | --- |
| Admin | `admin@wastetovalue.rw` |
| Waste Producer | `industry@wastetovalue.rw` |
| Recycler / SME | `buyer@wastetovalue.rw` |
| Transport Staff | `transport@wastetovalue.rw` |

## Current Workflow

1. Producer posts a waste listing.
2. Admin approves or rejects the listing and assigns quality grade A, B, or C.
3. Recycler searches the approved marketplace and requests material.
4. Producer approves the request, which creates a transport job for producer-created transport staff.
5. Transport staff advances the job through picked up, in transit, and delivered.
6. Recycler confirms receipt and the backend issues a certificate.

## Main API Routes

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/categories`
- `GET /api/admin/reports`
- `GET /api/admin/companies/pending`
- `POST /api/admin/companies/:id/review`
- `GET /api/admin/listings/pending`
- `POST /api/admin/listings/:id/review`
- `POST /api/listings`
- `GET /api/listings/mine`
- `GET /api/producer/transport-staff`
- `POST /api/producer/transport-staff`
- `GET /api/marketplace`
- `POST /api/listings/:id/requests`
- `POST /api/requests/:id/review`
- `GET /api/transport/jobs`
- `POST /api/transport/jobs/:id/advance`
- `POST /api/listings/:id/confirm-receipt`

## Verify The System

With the backend running and seeded:

```bash
npm test --prefix backend
```

The verification script exercises the full four-role workflow and writes evidence to `Book/evidence/waste-to-value-system-verification.json`.
