# EduSMS — localized AI school assistant (Rwanda)

EduSMS is a school management web app for the EdTech sector in Rwanda. The demo school is **G.S. Demo Kigali**. Staff, teachers, students, and parents sign in, use role-based dashboards, and ask a school assistant about attendance, fees, exams, teachers, and the timetable in **English, French, or Kinyarwanda**.

The assistant reads live records the signed-in user is allowed to see. If `OPENAI_API_KEY` or `GEMINI_API_KEY` is set, that reply comes from the live model. If no key is set, a built-in school-data assistant still answers from the database and explains how to turn the live model on.

## Assessment map

| Requirement | What this prototype does |
|-------------|--------------------------|
| Responsive UI | React + Vite + Tailwind. Sidebar collapses on small screens. Language switcher (EN / FR / RW). |
| Backend API | Express REST API under `/api/v1`. |
| Database | Prisma + **PostgreSQL** (local via `docker-compose`, production via **Neon** on Vercel). |
| AI | School assistant on `/ai`, plus staff drafting tools (report comment, lesson outline, risk check). Live model via OpenAI-compatible API or Gemini when a key is present. |
| Localization | Interface and assistant replies in English, French, and Kinyarwanda. Demo records use Rwandan names, RWF, and `Africa/Kigali`. |
| Auth and workflows | JWT login, role checks, dashboards, attendance, exams, fees, and portals for student, parent, teacher, finance, and other staff. |
| Deployment config | Root `vercel.json` — frontend + Express API on **Vercel**, database on **Neon**. See [Deployment](#deployment). |

## Architecture

```
Browser (React, Vite, Tailwind, TanStack Query, Zustand)
        │  /api  proxied to the API in local dev
        ▼
Express API  (/api/v1)
  presentation/routes        HTTP routes and auth middleware
  application/services       School rules, portals, AI assistant
  infrastructure/            Prisma, email, file storage, LLM client
        │
        ▼
PostgreSQL via Prisma (local Docker or Neon in production).
```

The UI language is chosen in the header and sent with each assistant message. The API checks the JWT, loads a **role-scoped snapshot** of school data, then either calls the configured model or builds a fallback answer from that snapshot. Threads and messages are saved on `AiConversation` and `AiMessage`.

## Database design

A **school** has users, classes, subjects, students, and teachers.

- **User** is the login (email, password hash, role). A user may be linked to one student, teacher, or parent profile.
- **Student** belongs to a school and a class. Attendance rows, exam results, and fee invoices hang off the student.
- **Parent** is linked to students through **StudentGuardian** (only those children are visible to that parent).
- **Teacher** is linked to timetable slots. The assistant limits a teacher to classes that appear on their timetable.
- **Class** has a weekly **Timetable** (day, time, subject, teacher, room).
- **Exam** belongs to a class and subject. **ExamResult** stores a student’s marks. Students and parents only receive exams marked published.
- **FeeInvoice** stores the amount, amount paid, balance, and status for a student. Amounts in the demo are Rwandan francs (RWF).
- **AiConversation** belongs to one user and one school. **AiMessage** rows are the user and assistant turns. A user can only read their own threads.

Other modules (library, hostel, transport, health, HR, assignments) use their own tables. The assistant does not pull medical notes, passwords, or phone numbers into replies.

## Features

- **Auth:** password login requires a 6-digit email verification code (two steps), optional passwordless email-code login, JWT + refresh tokens, and password reset. Google OAuth variables exist in config only; there is no Google login route.
- **Dashboards and portals:** admin analytics, plus student, parent, teacher, finance, library, nurse, transport, and HR views.
- **School operations:** students, teachers, classes, attendance marking, exams and marks, fee invoices and payments, timetable, assignments.
- **AI assistant (`/ai`):** persisted chats; English, French, and Kinyarwanda; answers grounded in the caller’s data. Staff also have three drafting tools that do not call the live model.
- **Access control:** routes and navigation depend on role. The assistant snapshot is narrower than the database:
  - School owner, principal, vice principal, registrar: school totals, attendance follow-up, open fees, published exams, today’s timetable.
  - Bursar and accountant: fees only.
  - Teacher: their timetable classes only.
  - Student: their own attendance, fees, published results, and timetable.
  - Parent: linked children only.
  - Other staff: school totals only, without individual names, fees, or marks.

## AI assistant

| Piece | Detail |
|-------|--------|
| Page | `/ai` |
| API | `GET /api/v1/ai/status`, `GET/POST /api/v1/ai/conversations`, `GET/DELETE /api/v1/ai/conversations/:id`, `POST /api/v1/ai/conversations/:id/messages` |
| Auth | Bearer JWT and a school on the user. Drafting tools (`/ai/report-comment`, `/ai/lesson-plan`, `/ai/student-risk`) are staff-only. |
| Provider | `AI_PROVIDER=auto` uses OpenAI when `OPENAI_API_KEY` is set, otherwise Gemini when `GEMINI_API_KEY` is set, otherwise the local fallback. Set `AI_PROVIDER` to `openai`, `gemini`, or `fallback` to force one path. |
| OpenAI | `POST {OPENAI_BASE_URL}/chat/completions` (default `https://api.openai.com/v1`, model `gpt-4o-mini`). Any OpenAI-compatible base URL works. |
| Gemini | `generativelanguage.googleapis.com` generateContent, model `gemini-2.0-flash` unless `GEMINI_MODEL` is set. |
| Fallback | Rule-based summary of the same snapshot, in the selected language, plus the env vars to enable a live model. |
| Data | The snapshot described above. The model is instructed not to invent records or leave that snapshot. |

No API keys are stored in the repo. Put them only in `backend/.env` (gitignored).

## Run locally

Requirements: Node.js 20+, npm.

```bash
docker compose up -d postgres
npm install
cd backend && npm install && cd ../frontend && npm install && cd ..
cd backend
cp .env.example .env
npx prisma generate
npx prisma db push
npm run db:seed
cd ..
npm run dev
```

- App: http://localhost:8080
- API: http://localhost:5020/api/v1/health

`npm run dev` starts the API on port **5020** and the UI on port **8080**. The Vite dev server proxies `/api` to the API, so leave `VITE_API_URL` empty locally.

Copy `backend/.env.example` to `backend/.env`. Start Postgres with `docker compose up -d postgres` (matches the default `DATABASE_URL` in the example).

### Demo logins

Password for every account: `Admin@123`

| Role | Email |
|------|--------|
| School owner (project) | ishimwehervin10@gmail.com |
| School owner (demo) | admin@demoschool.edu |
| Principal | principal@demoschool.edu |
| Teacher | teacher1@demoschool.edu |
| Student | student1@demoschool.edu |
| Parent | faustin.niyonsaba@parent.rw |
| Librarian | librarian@demoschool.edu |
| Nurse | nurse@demoschool.edu |
| Transport | transport@demoschool.edu |

Try the assistant as the school owner, then as the student. The student reply should only mention that student’s records.

## Environment variables

Backend (`backend/.env.example`):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (local Docker or Neon) |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Token signing. Change these before any real deployment. |
| `PORT` | API port, default `5020` |
| `FRONTEND_URL` | Browser origin for CORS, default `http://localhost:8080` |
| `AI_PROVIDER` | `auto`, `openai`, `gemini`, or `fallback` |
| `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL` | OpenAI-compatible chat completions |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Gemini generateContent |
| `SMTP_*` | Optional email for OTP and password reset. Codes can still be returned in development when mail is not configured. |

Frontend (`frontend/.env.example`):

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Leave empty locally and on Vercel when using the root `vercel.json` (same-origin `/api/v1`). |

## Deployment

**Stack:** GitHub → **Vercel** + **Neon** (PostgreSQL via Vercel Marketplace). No Railway.

| | URL |
|--|-----|
| **App (UI)** | [school-management-system-gamma-lyart.vercel.app](https://school-management-system-gamma-lyart.vercel.app) |
| **API** | [school-management-system-api-zeta.vercel.app](https://school-management-system-api-zeta.vercel.app) (`/api/v1/...`) |

**Vercel projects:** `school-management-system` (repo root, `vercel.json` → `frontend/`) and `school-management-system-api` (root directory **`backend`**, `backend/vercel.json` + `backend/api/index.ts`).

**Neon:** Integration resource **`edusms-db`** is connected to both projects (`DATABASE_URL` injected automatically).

**Production env (API project):** `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL` (UI URL), `NODE_ENV=production`, and **required** `SMTP_*` (Gmail App Password) — [docs/EMAIL-SMTP.md](docs/EMAIL-SMTP.md). Login codes are email-only in production.

**UI project:** `VITE_API_URL=https://school-management-system-api-zeta.vercel.app/api/v1`

**Seed (once):** `cd backend` with Neon `DATABASE_URL` → `npx prisma db push && npm run db:seed`

Do not commit `.env` files.

Do not commit `.env` files.

## Project layout

```
backend/src/application/services/ai-assistant.service.ts   role-scoped snapshot and fallback
backend/src/infrastructure/ai/llm.client.ts                OpenAI-compatible and Gemini calls
backend/src/presentation/routes/dashboard.routes.ts        /ai routes
backend/prisma/schema.prisma                               database models
frontend/src/pages/ai/index.tsx                            assistant UI
frontend/src/i18n/locales/                                 en, fr, rw
```

## Scripts

| Command | Where | What |
|---------|--------|------|
| `npm run dev` | repo root | API + UI |
| `npm run build` | repo root | `tsc` for the API and the UI |
| `npm run db:seed` | repo root | Demo Rwandan school data |
| `npm run db:studio` | repo root | Prisma Studio |
