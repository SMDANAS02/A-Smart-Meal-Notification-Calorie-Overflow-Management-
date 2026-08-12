#  FitAI Backend

Backend REST API for the **FitAI Calorie & Fitness Tracking Application**, built with Node.js and Express. It provides authentication, user profiles, meal tracking, calorie-debt management, progress tracking, water intake, and email notifications.

## 🛠️ Tech Stack

* **Node.js + Express** — REST API
* **SQLite + better-sqlite3** — Local database
* **JWT** — Authentication
* **bcryptjs** — Password hashing
* **Nodemailer** — Email notifications

---

## 📁 Project Structure

```text
fitai-backend/
├── server.js
├── db.js
├── .env.example
├── package.json
├── middleware/
│   └── auth.js
└── routes/
    ├── auth.js
    ├── profile.js
    ├── meals.js
    ├── progress.js
    ├── diet.js
    ├── water.js
    └── notify.js
```

### Main Files

| File                 | Purpose                          |
| -------------------- | -------------------------------- |
| `server.js`          | Application entry point          |
| `db.js`              | SQLite database and table setup  |
| `middleware/auth.js` | JWT authentication middleware    |
| `routes/auth.js`     | Register and login               |
| `routes/profile.js`  | User profile and fitness targets |
| `routes/meals.js`    | Food logging and calorie debt    |
| `routes/progress.js` | Weight and measurement tracking  |
| `routes/diet.js`     | Diet plan management             |
| `routes/water.js`    | Water intake tracking            |
| `routes/notify.js`   | Email notifications              |

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd fitai-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Then configure your `.env` file:

```env
PORT=3000
JWT_SECRET=your_random_secret_here
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
FRONTEND_URL=http://localhost:5500
```

### 📧 Gmail App Password

For email notifications:

1. Open your Google Account.
2. Go to **Security**.
3. Enable **2-Step Verification**.
4. Open **App Passwords**.
5. Generate an app password for Mail.
6. Add the generated password to `EMAIL_PASS`.

> Do not commit your `.env` file or expose your Gmail app password or JWT secret.

---

## ▶️ Run the Backend

### Development

```bash
npm run dev
```

The development server automatically restarts when files are changed.

### Production

```bash
npm start
```

The API will be available at:

```text
http://localhost:3000
```

### Health Check

Open:

```text
http://localhost:3000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "message": "🔥 FitAI Backend is running!"
}
```

---

# 📡 API Documentation

## 🔐 Authentication

| Method | Endpoint             | Description                 |
| ------ | -------------------- | --------------------------- |
| `POST` | `/api/auth/register` | Create a new account        |
| `POST` | `/api/auth/login`    | Login and receive JWT token |

### Register

**Endpoint**

```text
POST /api/auth/register
```

**Request Body**

```json
{
  "name": "John",
  "email": "john@email.com",
  "password": "pass123"
}
```

### Login

**Endpoint**

```text
POST /api/auth/login
```

**Request Body**

```json
{
  "email": "john@email.com",
  "password": "pass123"
}
```

**Response**

```json
{
  "token": "eyJ...",
  "user": {
    "id": 1,
    "name": "John",
    "email": "john@email.com"
  }
}
```

### Authentication Header

All protected endpoints require:

```http
Authorization: Bearer <token>
```

---

# 👤 Profile

| Method | Endpoint       | Description                        |
| ------ | -------------- | ---------------------------------- |
| `GET`  | `/api/profile` | Get user profile and targets       |
| `PUT`  | `/api/profile` | Update profile and fitness targets |

### Update Profile

**Endpoint**

```text
PUT /api/profile
```

**Request Body**

```json
{
  "age": 25,
  "gender": "male",
  "height_cm": 175,
  "weight_kg": 75,
  "goal": "lose",
  "activity_level": "moderate",
  "cal_target": 1800,
  "protein_target": 140,
  "carbs_target": 180,
  "fat_target": 60,
  "water_target": 8,
  "meal_count": 3
}
```

Any or all supported fields can be updated.

---

# 🍽️ Meals

| Method   | Endpoint                     | Description                              |
| -------- | ---------------------------- | ---------------------------------------- |
| `GET`    | `/api/meals?date=2024-01-15` | Get meals for a specific day             |
| `POST`   | `/api/meals`                 | Add a food item                          |
| `DELETE` | `/api/meals/:id`             | Remove a food item                       |
| `POST`   | `/api/meals/close-day`       | Close the day and calculate calorie debt |

### Add Food

**Endpoint**

```text
POST /api/meals
```

**Request Body**

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

### Get Daily Meals

```text
GET /api/meals?date=2024-01-15
```

The response includes daily totals and the adjusted calorie target:

```json
{
  "totals": {
    "calories": 1650,
    "protein": 120,
    "carbs": 200,
    "fat": 55
  },
  "adjustedTarget": 1650
}
```

> `adjustedTarget` already includes any applicable calorie debt deduction.

---

# ⚖️ Calorie Debt System

FitAI automatically handles days when the user consumes more calories than their target.

### Rules

| Calorie Over Target | Debt Distribution                 |
| ------------------- | --------------------------------- |
| `≤ 300 kcal`        | Deduct across the next **2 days** |
| `> 300 kcal`        | Deduct across the next **3 days** |

The minimum adjusted calorie target is always:

```text
1200 kcal
```

### Flow

```text
User exceeds calorie target
          ↓
User closes the day
          ↓
POST /api/meals/close-day
          ↓
Calorie debt is calculated
          ↓
Next day's target is automatically reduced
          ↓
GET /api/meals?date=tomorrow
          ↓
Frontend receives adjustedTarget
```

The frontend should always use `adjustedTarget` when displaying the user's daily calorie target.

---

# 📈 Progress

| Method | Endpoint                 | Description             |
| ------ | ------------------------ | ----------------------- |
| `GET`  | `/api/progress?limit=30` | Get progress history    |
| `POST` | `/api/progress`          | Log today's progress    |
| `GET`  | `/api/progress/stats`    | Get progress statistics |

Progress data can be used to track changes in:

* Weight
* Body measurements
* Fitness progress
* Historical trends

---

# 💧 Water

| Method | Endpoint                     | Description              |
| ------ | ---------------------------- | ------------------------ |
| `GET`  | `/api/water?date=2024-01-15` | Get today's water intake |
| `POST` | `/api/water`                 | Update water intake      |

The water system tracks the number of glasses consumed by the user.

---

# 📧 Notifications

| Method | Endpoint                    | Description              |
| ------ | --------------------------- | ------------------------ |
| `POST` | `/api/notify/meal-reminder` | Send meal reminder email |
| `POST` | `/api/notify/daily-summary` | Send daily summary email |

Email notifications are powered by **Nodemailer**.

---

# 🔗 Connecting the Frontend

Set the backend API URL in your frontend:

```javascript
const API = 'http://localhost:3000/api';
let token = localStorage.getItem('fitai_token');
```

### Example: Get Today's Meals

```javascript
const res = await fetch(`${API}/meals?date=2024-01-15`, {
  headers: {
    Authorization: `Bearer ${token}`
  }
});

const data = await res.json();
console.log(data);
```

---

# 🔒 Security

The backend uses:

* **JWT** for user authentication
* **bcryptjs** for password hashing
* Environment variables for sensitive configuration

Never commit sensitive values such as:

```text
.env
JWT_SECRET
EMAIL_PASS
```

Add `.env` to your `.gitignore`:

```gitignore
.env
node_modules/
*.db
```

---

# 🧪 API Testing

You can test the API using tools such as:

* Postman
* Insomnia
* Thunder Client
* Frontend `fetch()`

Recommended testing order:

```text
1. Register
   ↓
2. Login
   ↓
3. Copy JWT token
   ↓
4. Add Authorization header
   ↓
5. Test Profile
   ↓
6. Test Meals
   ↓
7. Test Progress
   ↓
8. Test Water
   ↓
9. Test Notifications
```

---

# 📌 Environment Variables

| Variable       | Description                          |
| -------------- | ------------------------------------ |
| `PORT`         | Backend server port                  |
| `JWT_SECRET`   | Secret key used to sign JWT tokens   |
| `EMAIL_USER`   | Gmail address used for notifications |
| `EMAIL_PASS`   | Gmail App Password                   |
| `FRONTEND_URL` | Frontend application URL             |

---

# 👨‍💻 Development

Start the backend in development mode:

```bash
npm run dev
```

Make sure the frontend and backend are running on their respective ports.

### Default Local Setup

```text
Frontend
http://localhost:5500

Backend
http://localhost:3000

API
http://localhost:3000/api
```
