# 🔥 FitAI Backend — Setup Guide

## Tech Stack
- **Node.js + Express** — REST API
- **SQLite (better-sqlite3)** — Local database
- **JWT** — Authentication
- **bcryptjs** — Password hashing
- **Nodemailer** — Email notifications

---

## 📁 Folder Structure
```
fitai-backend/
├── server.js          ← Entry point
├── db.js              ← Database setup (all tables)
├── .env.example       ← Copy to .env and fill in
├── package.json
├── middleware/
│   └── auth.js        ← JWT verification
└── routes/
    ├── auth.js        ← Register / Login
    ├── profile.js     ← User profile & targets
    ├── meals.js       ← Food log + calorie debt
    ├── progress.js    ← Weight & measurements
    ├── diet.js        ← Diet plan storage
    ├── water.js       ← Water intake
    └── notify.js      ← Email notifications
```

---

## 🚀 Setup Steps

### 1. Install dependencies
```bash
cd fitai-backend
npm install
```

### 2. Create .env file
```bash
cp .env.example .env
```
Then edit `.env`:
```
PORT=3000
JWT_SECRET=your_random_secret_here
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
FRONTEND_URL=http://localhost:5500
```

> **Gmail App Password**: Go to Google Account → Security → 2-Step Verification → App Passwords → Generate one for "Mail"

### 3. Run the server
```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

### 4. Test it
Open browser: `http://localhost:3000/api/health`  
Should show: `{ "status": "ok", "message": "🔥 FitAI Backend is running!" }`

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login → get JWT token |

**Register body:**
```json
{ "name": "John", "email": "john@email.com", "password": "pass123" }
```

**Login body:**
```json
{ "email": "john@email.com", "password": "pass123" }
```

**Response:** `{ token: "eyJ...", user: { id, name, email } }`

> All routes below require: `Authorization: Bearer <token>` header

---

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get user + targets |
| PUT | `/api/profile` | Update targets |

**PUT body (any/all fields):**
```json
{
  "age": 25, "gender": "male", "height_cm": 175, "weight_kg": 75,
  "goal": "lose", "activity_level": "moderate",
  "cal_target": 1800, "protein_target": 140,
  "carbs_target": 180, "fat_target": 60,
  "water_target": 8, "meal_count": 3
}
```

---

### Meals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/meals?date=2024-01-15` | Get meals for a day |
| POST | `/api/meals` | Add food item |
| DELETE | `/api/meals/:id` | Remove food item |
| POST | `/api/meals/close-day` | End of day → create debt |

**POST body:**
```json
{
  "date": "2024-01-15",
  "meal_name": "Breakfast",
  "food_name": "Oats",
  "calories": 300,
  "protein": 10,
  "carbs": 55,
  "fat": 5,
  "quantity": 1,
  "unit": "bowl"
}
```

**GET response includes:**
```json
{
  "totals": { "calories": 1650, "protein": 120, "carbs": 200, "fat": 55 },
  "adjustedTarget": 1650  ← Calorie debt already deducted here!
}
```

---

### Progress
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/progress?limit=30` | Get progress history |
| POST | `/api/progress` | Log today |
| GET | `/api/progress/stats` | Summary stats |

---

### Water
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/water?date=2024-01-15` | Get glasses today |
| POST | `/api/water` | Update glasses count |

---

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/notify/meal-reminder` | Send meal reminder email |
| POST | `/api/notify/daily-summary` | Send end-of-day summary |

---

## 🔄 Calorie Debt System

When user exceeds daily calorie target:
- **Over ≤300 kcal** → Deduct across **2 days**
- **Over >300 kcal** → Deduct across **3 days**
- Minimum target is always **1200 kcal**
- `/api/meals?date=` response includes `adjustedTarget` — use this on the frontend!

**Flow:**
1. User closes day → POST `/api/meals/close-day`
2. Next day → GET `/api/meals?date=tomorrow` → `adjustedTarget` is auto-reduced

---

## 🔗 Connecting Frontend

Add this to your frontend JS files:
```javascript
const API = 'http://localhost:3000/api';
let token = localStorage.getItem('fitai_token');

// Example: Get today's meals
const res = await fetch(`${API}/meals?date=2024-01-15`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await res.json();
```
