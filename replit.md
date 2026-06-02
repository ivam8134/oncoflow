# OncoFlow

Clinical Oncology Registry Platform — React frontend + Node.js/Express/MySQL backend.

## Project Structure

```
.
├── artifacts/
│   └── oncoflow/              # React + Vite + TypeScript frontend
│       ├── src/
│       │   ├── pages/         # Login, Dashboard, Patients, Notes, etc.
│       │   ├── components/    # UI + RequireAuth route guard
│       │   ├── context/       # AuthContext, LanguageContext
│       │   ├── lib/api.ts     # Fetch client w/ JWT injection
│       │   └── i18n/          # en.ts, fr.ts
│       └── .env.example       # VITE_API_URL=http://localhost:5000/api
│
└── backend/                   # Node.js + Express + MySQL REST API
    ├── server.js              # Express entry
    ├── db.js                  # MySQL pool
    ├── auth.js                # JWT middleware
    ├── schema.sql             # Full DB schema
    ├── routes/                # auth, patients, records, notes, voice,
    │                          # appointments, files, ai, chat, translations
    ├── uploads/               # File upload destination
    └── .env.example
```

## Run Locally

### Backend
```bash
cd backend
cp .env.example .env       # set DB creds + JWT_SECRET
mysql -u root -p < schema.sql
npm install
npm start                  # http://localhost:5000
```

### Frontend
```bash
cd artifacts/oncoflow
cp .env.example .env       # VITE_API_URL=http://localhost:5000/api
pnpm install
pnpm dev                   # http://localhost:<vite-port>/oncoflow/
```

## On Replit

Both services run automatically as workflows:
- **Backend API** — port 5000 (`backend/server.js`)
- **artifacts/oncoflow: web** — Vite dev server

Set `JWT_SECRET` and DB credentials in Replit Secrets, and start a MySQL instance (external or self-hosted) before backend requests will succeed.

## API Surface

| Resource     | Base path           |
|--------------|---------------------|
| Auth         | `/api/auth`         |
| Patients     | `/api/patients`     |
| Records      | `/api/records`      |
| Notes        | `/api/notes`        |
| Voice notes  | `/api/voice`        |
| Appointments | `/api/appointments` |
| Files        | `/api/files`        |
| AI           | `/api/ai/predict`   |
| Chat         | `/api/chat`         |
| i18n         | `/api/translations` |

All routes except `/api/auth/*` and `/api/translations/*` require `Authorization: Bearer <token>`.

## Frontend Auth Flow

1. `Login.tsx` calls `POST /api/auth/login` via `lib/api.ts`.
2. JWT stored in `localStorage` and exposed via `AuthContext`.
3. `RequireAuth` wraps protected routes and redirects to `/login` when no token.
4. All subsequent requests inject `Authorization: Bearer <token>` automatically.
