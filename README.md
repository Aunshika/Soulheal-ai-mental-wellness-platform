# 💙 SoulHeal – Student Mental Health Platform

A full-stack MERN application for student mental wellness — featuring mood tracking, self-assessments, AI suggestions, counselor appointments, real-time chat, and role-based access control.

---

## 📁 Project Structure

```
soulheal/
├── backend/
│   ├── config/         → MongoDB connection
│   ├── controllers/    → Business logic
│   ├── middleware/      → Auth, error handling
│   ├── models/         → Mongoose schemas
│   ├── routes/         → Express API routes
│   ├── server.js       → Entry point
│   ├── seed.js         → Database seeder
│   └── .env.example
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/ → Sidebar, LoadingScreen
│       ├── context/    → AuthContext
│       ├── pages/      → All page components
│       ├── utils/      → Axios instance
│       ├── App.js
│       └── index.css   → Design system
└── README.md
```

---

## ⚡ Quick Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- npm or yarn

---

### 1. Clone / Extract the project

```bash
cd soulheal
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create your `.env` file:
```bash
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/soulheal
JWT_SECRET=your_very_secure_secret_key_here
JWT_EXPIRE=7d
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=development
```

Seed the database with demo data:
```bash
node seed.js
```

Start the backend:
```bash
npm run dev       # development (with nodemon)
# or
npm start         # production
```

Backend runs at: `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create your `.env` file:
```bash
cp .env.example .env
```

Edit `.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
REACT_APP_SOCKET_URL=http://localhost:5000
```

Start the frontend:
```bash
npm start
```

Frontend runs at: `http://localhost:3000`

---

## 🔐 Demo Credentials

After running `node seed.js`:

| Role | Email | Password |
|------|-------|----------|
| Student | student@demo.com | demo123 |
| Counselor | counselor@demo.com | demo123 |
| Admin | admin@demo.com | demo123 |

---

## 🔑 Google reCAPTCHA Setup

1. Go to https://www.google.com/recaptcha/admin
2. Register a new site → reCAPTCHA v2 → "I'm not a robot"
3. Add `localhost` to allowed domains
4. Copy **Site Key** → `REACT_APP_RECAPTCHA_SITE_KEY` in frontend `.env`
5. Copy **Secret Key** → `RECAPTCHA_SECRET_KEY` in backend `.env`

> **Note:** The app uses Google's public test keys by default (6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI), which always pass. Replace with real keys for production.

---

## 🤖 AI Integration (Gemini)

1. Go to https://makersuite.google.com/app/apikey
2. Create an API key
3. Add to backend `.env`: `GEMINI_API_KEY=your_key`

The AI provides:
- **Mood suggestions** after logging daily mood
- **Assessment recommendations** after completing questionnaires

> The app has smart fallback suggestions if no API key is set.

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login with CAPTCHA |
| GET  | /api/auth/me | Get current user |
| PUT  | /api/auth/profile | Update profile |

### Mood
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/mood | Student |
| GET  | /api/mood | Student |
| DELETE | /api/mood/:id | Student |
| GET  | /api/mood/student/:id | Counselor/Admin |

### Assessment
| Method | Endpoint | Access |
|--------|----------|--------|
| GET  | /api/assessment/questions/:type | All |
| POST | /api/assessment | Student |
| GET  | /api/assessment | Student |

### Appointments
| Method | Endpoint | Access |
|--------|----------|--------|
| GET  | /api/appointments/counselors | All |
| POST | /api/appointments | Student |
| GET  | /api/appointments/my | Student |
| GET  | /api/appointments/counselor | Counselor |
| PUT  | /api/appointments/:id | Counselor/Admin |
| PUT  | /api/appointments/:id/cancel | Student |

### Admin
| Method | Endpoint | Access |
|--------|----------|--------|
| GET  | /api/admin/stats | Admin |
| GET  | /api/admin/users | Admin |
| PUT  | /api/admin/users/:id/toggle | Admin |
| PUT  | /api/admin/users/:id/role | Admin |
| CRUD | /api/admin/resources | Admin |
| GET  | /api/admin/appointments | Admin |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| CAPTCHA | Google reCAPTCHA v2 |
| Chat | Socket.io |
| AI | Google Gemini API |
| Icons | Flaticon UIcons |
| Charts | Recharts |

---

## 🚀 Features

### Student
- ✅ Register/Login with reCAPTCHA
- ✅ Daily mood tracking (8 moods, 1–10 score)
- ✅ AI-powered mood suggestions (Gemini)
- ✅ 5 types of self-assessment tests
- ✅ AI recommendations after assessments
- ✅ Book counselor appointments
- ✅ View appointment history
- ✅ Wellness resources library
- ✅ Mood trend charts
- ✅ Progress dashboard

### Counselor
- ✅ View all appointment requests
- ✅ Confirm / Complete / Cancel appointments
- ✅ View student mood history
- ✅ Real-time chat with students (Socket.io)
- ✅ Add meeting links and notes

### Admin
- ✅ Platform stats overview
- ✅ Manage all users (activate/deactivate, change roles)
- ✅ View all appointments
- ✅ Add / delete wellness resources

---

## 🔒 Security Features

- JWT authentication with expiry
- bcrypt password hashing (salt rounds: 10)
- Role-based access control (student/counselor/admin)
- reCAPTCHA on login & registration
- Centralized error handling
- Input validation with express-validator
- CORS protection

---

## 📦 Build for Production

```bash
# Frontend
cd frontend && npm run build

# Backend (set NODE_ENV=production in .env)
cd backend && npm start
```

---

## 🆘 Troubleshooting

**MongoDB connection error:**
- Make sure MongoDB is running: `mongod`
- Or use MongoDB Atlas cloud URI

**CAPTCHA failing:**
- Using test keys in development → always passes
- Add your domain to reCAPTCHA admin for production

**Port already in use:**
- Change `PORT` in backend `.env`
- Change proxy in frontend `package.json`
