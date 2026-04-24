import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "..", "wealth-tracker.db");

const db = new sqlite3.Database(dbPath);

export const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      return resolve(this);
    });
  });

export const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      return resolve(rows);
    });
  });

export const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      return resolve(row);
    });
  });

export async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT CHECK(type IN ('debit', 'credit')) NOT NULL,
      category TEXT DEFAULT 'Uncategorized',
      subCategory TEXT DEFAULT 'General',
      mandatory INTEGER DEFAULT 0,
      month TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword TEXT NOT NULL,
      category TEXT NOT NULL,
      subCategory TEXT NOT NULL,
      mandatory INTEGER DEFAULT 0
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goal TEXT NOT NULL,
      targetAmount REAL NOT NULL,
      targetDate TEXT NOT NULL,
      monthlyRequired REAL DEFAULT 0
    )
  `);

  const seedRules = [
    ["ZOMATO", "Food", "Ordering", 0],
    ["SWIGGY", "Food", "Ordering", 0],
    ["ZEPTO", "Grocery", "Essentials", 1],
    ["RENT", "Rent", "House", 1],
    ["SIP", "Investment", "Mutual Fund", 1]
  ];

  const existing = await get("SELECT COUNT(*) as count FROM rules");
  if (!existing?.count) {
    for (const rule of seedRules) {
      await run(
        "INSERT INTO rules(keyword, category, subCategory, mandatory) VALUES(?, ?, ?, ?)",
        rule
      );
    }
  }
}