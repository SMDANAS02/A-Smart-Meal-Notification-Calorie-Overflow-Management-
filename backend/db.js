// db.js — Universal Database Adapter (PostgreSQL for Cloud / Supabase / Neon, SQLite for Local)
require("dotenv").config();
const path = require("path");
const fs = require("fs");

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

let db = {};

if (DATABASE_URL) {
  // ─────────────────────────────────────────
  // POSTGRESQL (Supabase / Neon / Render Postgres)
  // ─────────────────────────────────────────
  const { Pool, types } = require("pg");

  // Ensure numeric types (like SUM, count, decimals) parse as numbers, matching SQLite behavior
  types.setTypeParser(1700, val => (val === null ? null : parseFloat(val)));
  types.setTypeParser(20, val => (val === null ? null : parseInt(val, 10)));

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false }
  });

  console.log("✅ PostgreSQL connected (Cloud database active)");

  // Translate SQLite query syntax to PostgreSQL syntax
  function translateQuery(sql) {
    let index = 1;
    let pgSql = sql.replace(/\?/g, () => `$${index++}`);
    pgSql = pgSql.replace(/datetime\('now'\)/gi, "CURRENT_TIMESTAMP");
    return pgSql;
  }

  function cleanParams(params) {
    if (params.length === 1 && Array.isArray(params[0])) {
      params = params[0];
    }
    return params.map(p => (p === undefined ? null : p));
  }

  db.isPostgres = true;
  db.pool = pool;

  db.query = async (sql, params = []) => {
    const pgSql = translateQuery(sql);
    return await pool.query(pgSql, cleanParams(params));
  };

  db.exec = async (sql) => {
    return await pool.query(sql);
  };

  db.prepare = (sql) => {
    const isInsert = /^\s*INSERT\s+INTO/i.test(sql);
    let runSql = sql;
    if (isInsert && !/RETURNING/i.test(runSql)) {
      runSql = `${runSql.trim()} RETURNING id`;
    }

    return {
      async get(...args) {
        const pgSql = translateQuery(sql);
        const res = await pool.query(pgSql, cleanParams(args));
        return res.rows[0] || null;
      },
      async all(...args) {
        const pgSql = translateQuery(sql);
        const res = await pool.query(pgSql, cleanParams(args));
        return res.rows;
      },
      async run(...args) {
        const pgSql = translateQuery(runSql);
        const res = await pool.query(pgSql, cleanParams(args));
        const lastId = res.rows && res.rows[0] ? (res.rows[0].id || res.rows[0].ID) : null;
        return {
          lastInsertRowid: lastId,
          changes: res.rowCount || 0
        };
      }
    };
  };

  // Direct helpers
  db.get = async (sql, ...args) => db.prepare(sql).get(...args);
  db.all = async (sql, ...args) => db.prepare(sql).all(...args);
  db.run = async (sql, ...args) => db.prepare(sql).run(...args);

  // Auto-initialize PostgreSQL tables
  (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id          SERIAL PRIMARY KEY,
          name        TEXT    NOT NULL,
          email       TEXT    NOT NULL UNIQUE,
          password    TEXT    NOT NULL,
          phone       TEXT,
          google_id   TEXT,
          avatar      TEXT,
          created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS profiles (
          id              SERIAL PRIMARY KEY,
          user_id         INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
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
          updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS meals (
          id          SERIAL PRIMARY KEY,
          user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          date        TEXT    NOT NULL,
          meal_name   TEXT    NOT NULL,
          food_name   TEXT    NOT NULL,
          calories    REAL    NOT NULL DEFAULT 0,
          protein     REAL    DEFAULT 0,
          carbs       REAL    DEFAULT 0,
          fat         REAL    DEFAULT 0,
          quantity    REAL    DEFAULT 1,
          unit        TEXT    DEFAULT 'serving',
          created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS calorie_debt (
          id          SERIAL PRIMARY KEY,
          user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          debt_date   TEXT    NOT NULL,
          over_cal    REAL    NOT NULL,
          split_days  INTEGER NOT NULL,
          per_day     REAL    NOT NULL,
          cleared     INTEGER DEFAULT 0,
          created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS progress (
          id          SERIAL PRIMARY KEY,
          user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          date        TEXT    NOT NULL,
          weight_kg   REAL,
          chest_cm    REAL,
          waist_cm    REAL,
          hips_cm     REAL,
          arms_cm     REAL,
          thighs_cm   REAL,
          note        TEXT,
          created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS diet_plans (
          id           SERIAL PRIMARY KEY,
          user_id      INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          plan_data    TEXT    NOT NULL,
          generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS water_log (
          id          SERIAL PRIMARY KEY,
          user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          date        TEXT    NOT NULL,
          glasses     INTEGER DEFAULT 0,
          updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("✅ PostgreSQL schema verified and ready");
    } catch (err) {
      console.error("⚠️ PostgreSQL table initialization error:", err.message);
    }
  })();

} else {
  // ─────────────────────────────────────────
  // SQLITE (Local fallback)
  // ─────────────────────────────────────────
  const Database = require("better-sqlite3");

  let DB_PATH = process.env.DB_PATH;
  if (!DB_PATH) {
    if (process.env.NODE_ENV === "production" && fs.existsSync("/data")) {
      DB_PATH = "/data/fitai.db";
    } else {
      DB_PATH = path.join(__dirname, "fitai.db");
    }
  }

  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("synchronous = NORMAL");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      email       TEXT    NOT NULL UNIQUE,
      password    TEXT    NOT NULL,
      phone       TEXT,
      google_id   TEXT,
      avatar      TEXT,
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

  console.log("✅ SQLite connected:", DB_PATH);

  db.isPostgres = false;
  db.sqlite = sqlite;

  db.prepare = (sql) => {
    const stmt = sqlite.prepare(sql);
    return {
      get(...args) {
        return stmt.get(...args);
      },
      all(...args) {
        return stmt.all(...args);
      },
      run(...args) {
        return stmt.run(...args);
      }
    };
  };

  db.exec = (sql) => sqlite.exec(sql);
  db.get = (sql, ...args) => sqlite.prepare(sql).get(...args);
  db.all = (sql, ...args) => sqlite.prepare(sql).all(...args);
  db.run = (sql, ...args) => sqlite.prepare(sql).run(...args);
}

module.exports = db;