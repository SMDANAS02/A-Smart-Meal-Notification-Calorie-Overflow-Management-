// db.js — SQLite Database Setup
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// Decide database path
const DB_PATH =
  process.env.NODE_ENV === "production"
    ? "/data/fitai.db"
    : path.join(__dirname, "fitai.db");

// Ensure /data directory exists in production
if (process.env.NODE_ENV === "production") {
  if (!fs.existsSync("/data")) {
    fs.mkdirSync("/data", { recursive: true });
  }
}

const db = new Database(DB_PATH);

// Performance settings
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("synchronous = NORMAL");

// ─────────────────────────────────────────
// CREATE TABLES
// ─────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,
    phone       TEXT,
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL UNIQUE,
    age             INTEGER,
    gender          TEXT,
    height_cm       REAL,
    weight_kg       REAL,
    goal            TEXT,
    activity_level  TEXT,
    cal_target      INTEGER DEFAULT 2000,
    protein_target  INTEGER DEFAULT 150,
    carbs_target    INTEGER DEFAULT 200,
    fat_target      INTEGER DEFAULT 65,
    water_target    INTEGER DEFAULT 8,
    meal_count      INTEGER DEFAULT 3,
    updated_at      TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS meals (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    date        TEXT    NOT NULL,
    meal_name   TEXT    NOT NULL,
    food_name   TEXT    NOT NULL,
    calories    REAL    NOT NULL DEFAULT 0,
    protein     REAL    DEFAULT 0,
    carbs       REAL    DEFAULT 0,
    fat         REAL    DEFAULT 0,
    quantity    REAL    DEFAULT 1,
    unit        TEXT    DEFAULT 'serving',
    created_at  TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS calorie_debt (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    debt_date   TEXT    NOT NULL,
    over_cal    REAL    NOT NULL,
    split_days  INTEGER NOT NULL,
    per_day     REAL    NOT NULL,
    cleared     INTEGER DEFAULT 0,
    created_at  TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS progress (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    date        TEXT    NOT NULL,
    weight_kg   REAL,
    chest_cm    REAL,
    waist_cm    REAL,
    hips_cm     REAL,
    arms_cm     REAL,
    thighs_cm   REAL,
    note        TEXT,
    created_at  TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS diet_plans (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL UNIQUE,
    plan_data   TEXT    NOT NULL,
    generated_at TEXT   DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS water_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    date        TEXT    NOT NULL,
    glasses     INTEGER DEFAULT 0,
    updated_at  TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

console.log("✅ Database connected:", DB_PATH);

module.exports = db;