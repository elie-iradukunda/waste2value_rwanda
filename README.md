# Waste2Value Rwanda Platform

Full-stack circular economy platform built with React, Tailwind CSS v3, Node.js, Express, MySQL and Sequelize.

Waste2Value Rwanda supports an academic presentation workflow for industrial waste exchange:

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
| Admin | `admin@waste2value.rw` |
| Waste Producer | `industry@waste2value.rw` |
| Recycler / SME | `buyer@waste2value.rw` |
| Transport Provider | `transport@waste2value.rw` |
| COPED / Waste Operator | `regulator@waste2value.rw` |

## Database

The backend defines Sequelize models for users, companies, categories, waste materials, requests, transactions, transport jobs, certificates, sustainability scores, notifications and reviews.

By default the API uses seed data and does not connect to MySQL, so the platform opens immediately for demos. To enable MySQL sync:

```bash
copy backend\.env.example backend\.env
```

Set your MySQL credentials in `backend/.env`, then change:

```env
DB_SYNC=true
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
