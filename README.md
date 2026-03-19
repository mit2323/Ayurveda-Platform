# 🌿 AyurVeda E-commerce Platform

A production-grade full-stack e-commerce platform for Ayurvedic products.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Zustand, TanStack Query |
| Backend | FastAPI, SQLAlchemy, Pydantic v2, Alembic |
| Database | PostgreSQL (Neon/Supabase) |
| Cache | Redis (Upstash) |
| Storage | Cloudinary |
| Payments | Razorpay |
| Email | SendGrid |
| SMS/OTP | Twilio |
| Monitoring | Sentry, Prometheus + Grafana |
| CI/CD | GitHub Actions |
| Deployment | Vercel (frontend), Render/Railway (backend) |

## Monorepo Structure

```
ayurveda-platform/
├── apps/
│   ├── api/          # FastAPI backend
│   └── web/          # Next.js frontend
├── infra/
│   ├── nginx/        # Nginx config
│   └── docker/       # Docker files
├── docker-compose.yml
└── README.md
```

## Quick Start (Local)

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.11+

### 1. Clone and configure environment
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Edit both .env files with your credentials
```

### 2. Start all services
```bash
docker-compose up -d         # PostgreSQL + Redis
cd /d/Medicine_Selling_Platform/ayurveda-platform/apps/api
source venv/Scripts/activate
export PYTHONPATH=.
uvicorn app.main:app --reload --port 8000
pip install -r requirements.txt
alembic upgrade head         # Run migrations

```

### 3. Start frontend
```bash
cd apps/web
npm install
npm run dev                  # http://localhost:3000
```

## API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Environment Variables

### Backend (`apps/api/.env`)
See `apps/api/.env.example` for all required variables.

### Frontend (`apps/web/.env.local`)
See `apps/web/.env.example` for all required variables.

## Development Phases
- **Phase 1** — Foundation: Auth, Products, DB schema
- **Phase 2** — Shopping: Cart, Checkout, Razorpay, Orders
- **Phase 3** — Discovery: Search, Filters, Reviews, SEO
- **Phase 4** — Admin: Dashboard, Analytics, Inventory
- **Phase 5** — Hardening: Security, Monitoring, CI/CD