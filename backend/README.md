# OncoFlow Backend

Node.js + Express + MySQL REST API.

## Setup

```bash
cp .env.example .env       # fill DB creds + JWT_SECRET
mysql -u root -p < schema.sql
npm install
npm start                  # http://localhost:5000
```

## Structure

```
backend/
├── server.js              # Express entry (mounts all routes)
├── db.js                  # MySQL connection pool (mysql2/promise)
├── auth.js                # JWT auth + role middleware
├── schema.sql             # Full DB schema (12 tables)
├── routes/
│   ├── auth.js            # POST /register, /login
│   ├── patients.js        # CRUD
│   ├── records.js         # CRUD
│   ├── notes.js           # text notes
│   ├── voice.js           # audio upload + transcription
│   ├── appointments.js    # CRUD
│   ├── files.js           # file uploads
│   ├── ai.js              # /predict placeholder
│   ├── chat.js            # chat history
│   └── translations.js    # i18n key/value lookup
└── uploads/               # multer destination
```

## Routes

| Method | Path                         | Auth |
|--------|------------------------------|------|
| POST   | `/api/auth/register`         | no   |
| POST   | `/api/auth/login`            | no   |
| GET    | `/api/patients`              | yes  |
| POST   | `/api/patients`              | yes  |
| PUT    | `/api/patients/:id`          | yes  |
| DELETE | `/api/patients/:id`          | yes  |
| GET    | `/api/records?patient_id=…`  | yes  |
| POST   | `/api/records`               | yes  |
| PUT    | `/api/records/:id`           | yes  |
| DELETE | `/api/records/:id`           | yes  |
| GET    | `/api/notes`                 | yes  |
| POST   | `/api/notes`                 | yes  |
| POST   | `/api/voice` (multipart)     | yes  |
| GET    | `/api/appointments`          | yes  |
| POST   | `/api/appointments`          | yes  |
| PUT    | `/api/appointments/:id`      | yes  |
| DELETE | `/api/appointments/:id`      | yes  |
| POST   | `/api/files` (multipart)     | yes  |
| GET    | `/api/files`                 | yes  |
| GET    | `/api/ai/models`             | yes  |
| POST   | `/api/ai/predict`            | yes  |
| GET    | `/api/chat`                  | yes  |
| POST   | `/api/chat`                  | yes  |
| GET    | `/api/translations/languages`| no   |
| GET    | `/api/translations/:lang`    | no   |
| POST   | `/api/translations`          | no   |
