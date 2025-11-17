
# 📒 Telegram Expense Tracker Bot

A fully automated **Telegram-based personal expense tracker** built using:

* **Node.js**
* **Supabase (PostgreSQL)**
* **Google Gemini AI**
* **Render Webhooks**
* **Cron Jobs**

This bot works like a SaaS tool with:
✔ AI categorization
✔ Daily & monthly summaries
✔ Clean separation of user data
✔ Cloud deployment

---

## 🚀 Features

### ✅ User Registration

Users register using `/start`.
Duplicate registration is handled gracefully.

### 💸 Add Expenses

Users simply send:

```
200 coffee
150 metro
500 groceries
```

The bot automatically:

* Reads amount
* Reads item
* Categorizes using **AI + DB lookup**
* Saves to Supabase

### 📊 Daily Summary (`/daily`)

* Total spending
* List of all expenses
* Clean Markdown display

### 🗓 Monthly Summary (`/monthly`)

* Category totals
* Complete monthly breakdown

### 🤖 AI Categorization

If an expense category is unknown:

1. Check in DB → if exists, use it
2. If not → use **Gemini AI**
3. Save in DB for future reuse

### ⏰ Automated Cron Jobs

* **Daily summary** at 11:59 PM
* **Monthly summary** on the last day of month
* **Self-ping cron** to keep Render awake

### 🔗 Webhook-Based Bot

Fully compatible with Render without polling.

---

## 🧱 Database Schema

### **users**

| Column      | Type            |
| ----------- | --------------- |
| id          | serial (PK)     |
| telegram_id | bigint (unique) |
| username    | text            |
| created_at  | timestamp       |

### **expenses**

| Column        | Type                |
| ------------- | ------------------- |
| id            | serial (PK)         |
| user_id       | int (FK → users.id) |
| amount        | numeric(10,2)       |
| item          | text                |
| main_category | text                |
| created_at    | timestamp           |

### **categories**

| Column   | Type               |
| -------- | ------------------ |
| item     | text (PK)          |
| category | text               |
| source   | text (manual / ai) |

---

## 📁 Project Structure

```
/project
│── index.js
│── userService.js
│── expenseService.js
│── supabaseClient.js
│── package.json
│── .env
│── public/
│── README.md
```

---

## 🛠 Setup

### 1️⃣ Clone repo

```bash
https://github.com/vishal-panchal611/telegram-expense-tracker.git
cd telegram-expense-tracker
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Create `.env`

```
TELEGRAM_BOT_TOKEN=your_telegram_token

SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_ROLE=your_service_role

GOOGLE_API_KEY=your_gemini_key

WEBHOOK_URL=https://yourapp.onrender.com
```

---

## ▶️ Run Locally (Polling Mode)

Set polling to true:

```javascript
const bot = new TelegramBot(token, { polling: true });
```

Run:

```bash
npm start
```

---

## 🚀 Deployment (Render.com)

**Build Command**

```
npm install
```

**Start Command**

```
npm start
```

Webhook is automatically registered as:

```
https://yourapp.onrender.com/bot<TELEGRAM_BOT_TOKEN>
```

Add all `.env` variables in Render dashboard.

---

## 📱 Bot Commands

| Command      | Description          |
| ------------ | -------------------- |
| `/start`     | Register user        |
| `/daily`     | Show today’s summary |
| `/monthly`   | Show monthly summary |
| `200 coffee` | Add new expense      |

---

## 🧑‍💻 Tech Stack

* Node.js
* Express.js
* Supabase (PostgreSQL)
* Google Gemini AI
* Telegram Bot API
* Render Webhooks
* Cron Scheduler

---

## ⭐ Support the Project

If you like it, **please star ⭐ the repo**.
Your support motivates more updates & improvements.

---

## 📄 License

MIT License


