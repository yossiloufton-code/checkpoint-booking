# checkpoint-booking

🏢 Room Booking Platform

A scalable room booking system built with React (frontend) and Node.js + Express (backend).
The system supports user registration, authentication, room search, and booking management — following the design and implementation requirements of a production-grade booking platform.

🧭 High-Level Architecture
                     ┌────────────────────────────┐
                     │        Frontend (SPA)       │
                     │  React 18 + Vite + Context  │
                     │  - Auth / Rooms / Bookings  │
                     │  - JWT via axios interceptor│
                     │  - Toasts, Pagination, SCSS │
                     └──────────────┬──────────────┘
                                    │ HTTPS (REST)
                                    ▼
                     ┌────────────────────────────┐
                     │        Backend API          │
                     │ Node.js + Express + TS      │
                     │  Routes: /auth /rooms /book │
                     │  Middleware: JWT, cache,    │
                     │  rate-limit, helmet, errors │
                     │  Health: /healthz /readyz   │
                     └──────────────┬──────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
  ┌────────────────────┐   ┌────────────────────┐   ┌───────────────────┐
  │ PostgreSQL Database │   │  Cache Layer       │   │ (Optional) Queue  │
  │  - Users            │   │  apicache / Redis  │   │  Email / logs     │
  │  - Rooms            │   │  Cached search     │   │  Async events     │
  │  - Bookings         │   │  Invalidated on    │   │  Future extension │
  │  Constraints:       │   │  new booking       │   │                   │
  │  No double booking  │   │                    │   │                   │
  └────────────────────┘   └────────────────────┘   └───────────────────┘


Scalable design:
Stateless frontend + backend → horizontally scalable via CDN and load balancer.
Backend health endpoints allow automated failover and multi-region deployment.

📁 Project Structure
/booking-app
│
├── backend/       # Node.js + Express microservice
│   ├── src/
│   │   ├── config/       # env, DB setup, seed
│   │   ├── controllers/  # route handlers
│   │   ├── entities/     # TypeORM entities
│   │   ├── middleware/   # auth, rate limiting, caching, errors
│   │   ├── routes/       # REST API definitions
│   │   ├── services/     # business logic
│   │   ├── cache/        # cache invalidation
│   │   ├── infra/        # redis (optional)
│   │   ├── utils/        # password helpers
│   │   ├── app.ts        # express setup
│   │   ├── server.ts     # server bootstrap
│   │   └── ...
│   └── package.json
│
└── frontend/      # React 18 (Vite)
    ├── src/
    │   ├── api/          # axios client + typed endpoints
    │   ├── components/   # UI components (rooms, bookings, layout)
    │   ├── context/      # AuthContext, RoomsContext, BookingsContext
    │   ├── pages/        # login, register, rooms, bookings
    │   ├── hooks/        # custom hooks
    │   ├── styles/       # SCSS modules
    │   └── main.tsx, App.tsx
    └── package.json

⚙️ Backend Overview
🧩 Architecture

Stack: Node.js, Express, TypeScript, TypeORM, PostgreSQL.

Security: Helmet, JWT auth, rate limiting, centralized error handling.

Cache: apicache for short-TTL caching on read endpoints.

Health: /healthz (liveness), /readyz (DB readiness).

Scalability: stateless service; horizontally scalable.

🛠️ Key Endpoints
Auth
Method	Endpoint	Description
POST	/api/auth/register	Register new user
POST	/api/auth/login	Login and receive JWT
POST	/api/auth/refresh	Refresh access token
Rooms
Method	Endpoint	Description
GET	/api/rooms?location&minCapacity&startTime&endTime&page&limit	Search & paginate available rooms (cached)
Bookings
Method	Endpoint	Description
POST	/api/bookings	Create a booking (auth required)
		Returns 409 if overlap detected
💾 Database Schema

Users

id (PK), email (unique), password_hash, created_at


Rooms

id (PK), name, location, capacity, available_from, available_to


Bookings

id (PK), user_id (FK), room_id (FK),
start_time, end_time, status, created_at

🔒 Concurrency Handling

Booking overlaps prevented by SQL:

start_time < :endTime AND end_time > :startTime


DB constraint option:

EXCLUDE USING gist (room_id WITH =, tstzrange(start_time,end_time) WITH &&)


Optional per-room advisory lock:

SELECT pg_advisory_xact_lock(hashtext(room_id));

🚀 Scalability & Fault Tolerance

Stateless API, health endpoints for orchestration (K8s, ECS, Docker).

Short-TTL cache invalidated after booking creation.

Pagination to limit payloads.

Ready for Redis + read replicas.

Future: message queue for async emails/logs.

💻 Frontend Overview
🧩 Architecture

Stack: React 18 + TypeScript + Vite + SCSS.

Routing: React Router (protected routes).

State: Context API (AuthContext, RoomsContext, BookingsContext).

API: axios with JWT interceptor.

UX: Debounced search, pagination, toasts, responsive layout.

🧱 Main Features

User registration, login, or guest mode.

Room search with filters and pagination.

Booking creation, confirmation, and cancellation.

Auto-refresh & caching in contexts.

Toast notifications for feedback.

🔐 Authentication

JWT tokens stored in memory + localStorage.

Context exposes:

isAuthenticated

isGuest

isMember

roleLabel

Syncs across browser tabs via storage event.

🧭 Data Flow

User logs in → JWT stored → axios interceptor adds Authorization header.

RoomsContext fetches rooms via /rooms API (cached server-side).

BookingsContext loads bookings only when authenticated.

UI auto-refreshes after booking/cancel/confirm actions.

🧠 Concurrency & Consistency

Frontend prevents duplicate submissions by disabling buttons while pending.

Backend enforces strict overlap validation and transactional inserts.

Safe retries possible with optional Idempotency-Key header.

📈 Scalability & Fault Tolerance

Frontend: Static SPA → deployable via any CDN (Netlify, Vercel, S3 + CloudFront).

Backend: Horizontal scaling via load balancer; /healthz removes bad nodes.

DB: Supports read replicas and constraints for consistency.

Security: Helmet, JWT, rate limits, sanitized inputs.

🧩 Optional Components (future-ready)

Redis: distributed cache for cross-instance search.

SQS / RabbitMQ: async booking confirmation emails.

Monitoring: ELK / CloudWatch / Sentry.

Analytics: lightweight events for usage insights.

WAF: optional layer-7 protection.

🧪 Run Locally
Backend
cd backend
npm install
npm run dev


Visit: http://localhost:3001/healthz

Frontend
cd frontend
npm install
npm run dev


Visit: http://localhost:5173/

🧰 Environment Variables (Backend)
Variable	Description
PORT	API server port
DB_HOST	Postgres host
DB_PORT	Postgres port
DB_USER	DB username
DB_PASS	DB password
DB_NAME	DB name
JWT_SECRET	JWT signing key
