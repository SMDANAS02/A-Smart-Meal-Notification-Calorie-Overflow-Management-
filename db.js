// db.js — SQLite Database Setup
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'fitai.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─────────────────────────────────────────
// CREATE TABLES
// ─────────────────────────────────────────

db.exec(`
  -- USERS TABLE
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,
    phone       TEXT,
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  -- USER PROFILE / TARGETS TABLE
  CREATE TABLE IF NOT EXISTS profiles (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL UNIQUE,
    age             INTEGER,
    gender          TEXT,
    height_cm       REAL,
    weight_kg       REAL,
    goal            TEXT,         -- lose / maintain / gain
    activity_level  TEXT,         -- sedentary / light / moderate / active
    cal_target      INTEGER DEFAULT 2000,
    protein_target  INTEGER DEFAULT 150,
    carbs_target    INTEGER DEFAULT 200,
    fat_target      INTEGER DEFAULT 65,
    water_target    INTEGER DEFAULT 8,
    meal_count      INTEGER DEFAULT 3,
    updated_at      TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- MEALS TABLE (daily food log)
  CREATE TABLE IF NOT EXISTS meals (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    date        TEXT    NOT NULL,   -- YYYY-MM-DD
    meal_name   TEXT    NOT NULL,   -- Breakfast / Lunch / Dinner / Snack
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

  -- CALORIE DEBT TABLE (overflow carry-forward)
  CREATE TABLE IF NOT EXISTS calorie_debt (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    debt_date   TEXT    NOT NULL,   -- date overflow happened
    over_cal    REAL    NOT NULL,   -- how much over
    split_days  INTEGER NOT NULL,   -- 2 or 3 days
    per_day     REAL    NOT NULL,   -- deduction per day
    cleared     INTEGER DEFAULT 0, -- 0=active, 1=cleared
    created_at  TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- PROGRESS TABLE (weight/measurements log)
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

  -- DIET PLAN TABLE
  CREATE TABLE IF NOT EXISTS diet_plans (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL UNIQUE,
    plan_data   TEXT    NOT NULL,   -- JSON string
    generated_at TEXT   DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- WATER LOG TABLE
  CREATE TABLE IF NOT EXISTS water_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    date        TEXT    NOT NULL,
    glasses     INTEGER DEFAULT 0,
    updated_at  TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

console.log('✅ Database connected:', DB_PATH);
module.exports = db;
