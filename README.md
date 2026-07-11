# Waste-to-Value Rwanda Platform

Full-stack circular economy platform built with React, Tailwind CSS v3, Node.js, Express, MySQL and Sequelize.

Waste-to-Value Rwanda supports an academic presentation workflow for industrial waste exchange:

- waste producer material listing and admin approval;
- buyer marketplace search, smart matching and material requests;
- request approval, transaction monitoring and transport job creation;
- transporter delivery job acceptance and proof upload endpoint;
- digital reuse certificate generation with QR verification;
- regulator impact analytics, company ranking and compliance alerts.

## Run locally

```bash
npm run dev
```

Frontend: `http://localhost:5173`  
Backend API: `http://localhost:5000/api/health`

For production-style local testing:

```bash
npm run build
npm start
```

## Demo Accounts

All demo users use password `demo123`.

| Role | Email |
| --- | --- |
| Admin | `admin@wastetovalue.rw` |
| Waste Producer | `industry@wastetovalue.rw` |
| Recycler / SME | `buyer@wastetovalue.rw` |
| Transport Provider | `transport@wastetovalue.rw` |
| COPED / Waste Operator | `regulator@wastetovalue.rw` |

## Database

The backend defines Sequelize models for users, companies, categories, waste materials, requests, transactions, transport jobs, certificates, sustainability scores, notifications and reviews.

The API uses MySQL. On startup it syncs the Sequelize models and refreshes the prepared presentation data unless `SEED_DEMO_DATA=false` is set. Existing demo accounts are updated to the configured `SEED_PASSWORD`, so the live demo credentials remain reliable after redeploys.

```bash
copy backend\.env.example backend\.env
```

Set your MySQL credentials in `backend/.env`, then keep:

```env
DB_SYNC=true
SEED_DEMO_DATA=true
```

## Main Routes

- `/` public landing page
- `/login` and `/register`
- `/admin`
- `/industry`
- `/buyer`
- `/transport`
- `/regulator`
- `/certificates`
- `/analytics`
