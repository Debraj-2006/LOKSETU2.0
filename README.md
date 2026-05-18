# LokSetu 2.0 🏛️
### Civic Grievance Redressal Platform | लोक सेतु | লোক সেতু

A full-stack web application connecting citizens with local government to raise, track, and resolve civic complaints — transparently and efficiently.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Cloudinary](https://cloudinary.com) account

### 1. Database Setup (Supabase)
1. Go to **Supabase Dashboard → SQL Editor → New Query**
2. Paste and run the entire contents of `database/schema.sql`
3. Go to **Realtime → Tables** and enable realtime for `complaints` and `notifications`

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Fill in your credentials in .env
npm install
npm run dev        # runs on http://localhost:5000
```

**backend/.env values:**
| Variable | Where to find |
|---|---|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `SUPABASE_SERVICE_KEY` | Supabase Dashboard → Settings → API → service_role key |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Dashboard → Settings |
| `CLOUDINARY_API_KEY` | Cloudinary Dashboard → Settings |
| `CLOUDINARY_API_SECRET` | Cloudinary Dashboard → Settings |
| `ADMIN_SECRET_CODE` | Set any secret string (used during admin registration) |
| `FRONTEND_URL` | `http://localhost:5173` for development |

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env
# Fill in your Supabase credentials
npm install
npm run dev        # runs on http://localhost:5173
```

**frontend/.env values:**
| Variable | Where to find |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon/public key |

---

## 📁 Project Structure

```
loksetu 2.0/
├── backend/                    # Node.js + Express API
│   ├── config/supabase.js      # Supabase admin client
│   ├── middleware/             # Auth + admin guards
│   ├── routes/                 # complaints, admin, auth, notifications
│   ├── services/               # Cloudinary upload, escalation cron
│   └── server.js
│
├── frontend/                   # React + Vite + Tailwind CSS
│   └── src/
│       ├── pages/              # Landing, Login, Register, Dashboards
│       ├── components/         # Reusable UI components
│       ├── contexts/           # Auth context
│       └── utils/              # Supabase client, Axios instance
│
└── database/
    └── schema.sql              # Full Supabase schema + RLS policies
```

---

## ✨ Features

### Citizen
- 📋 Register with name, phone, and area
- 🗂️ Raise complaints: Electricity ⚡, Road 🛣️, Water 💧, Sanitation 🚽
- 📸 Upload photos of the issue
- 📍 Pin location on interactive OpenStreetMap
- 📊 Track status: **Pending → In Progress → Resolved / Cancelled**
- 🔔 Real-time notifications on status change
- 👍 Upvote shared issues to increase priority

### Admin
- 🛡️ Separate admin login (role-based via Supabase Auth)
- 📋 View all complaints with filters (category, status, area, escalated)
- ✏️ Update complaint status + add remarks
- 📨 Citizens auto-notified on every update
- 📊 Dashboard stats: total, pending, in-progress, resolved, escalated

### Automatic Escalation
- ⏰ Cron job runs hourly
- 🔴 Complaints unresolved for **7+ days** are flagged as escalated
- Admin panel highlights escalated complaints with a red banner

---

## 🎨 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v3 |
| Backend | Node.js, Express |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + password) |
| File Upload | Cloudinary |
| Maps | Leaflet.js + OpenStreetMap (free) |
| Realtime | Supabase Realtime |
| Scheduler | node-cron |
| Font | Noto Sans (Hindi + Bengali support) |

---

## 🔑 Creating an Admin Account

During registration, expand **"Have an Admin Code?"** and enter the value of `ADMIN_SECRET_CODE` from your `.env`. The account will be created with `role = 'admin'`.

---

## 📝 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register citizen or admin |
| POST | `/api/complaints` | Citizen | Create complaint |
| GET | `/api/complaints/my` | Citizen | My complaints |
| GET | `/api/complaints/:id` | Auth | Complaint detail |
| POST | `/api/complaints/:id/upvote` | Citizen | Toggle upvote |
| GET | `/api/admin/complaints` | Admin | All complaints + filters |
| GET | `/api/admin/stats` | Admin | Dashboard statistics |
| PATCH | `/api/admin/complaints/:id` | Admin | Update status + remark |
| GET | `/api/notifications` | Citizen | My notifications |
| PATCH | `/api/notifications/:id/read` | Citizen | Mark as read |

---

## 🌐 Deployment

### Backend → Railway / Render
Set all environment variables from `.env.example` in the platform dashboard.

### Frontend → Vercel / Netlify
Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables.
Update `FRONTEND_URL` in backend `.env` to your deployed frontend URL.

---

Built with ❤️ for India 🇮🇳
