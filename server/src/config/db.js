import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { env } from "./env.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultDbPath = join(__dirname, "..", "..", "data", "mentorflow.sqlite");
const dbPath = env.sqlitePath || defaultDbPath;

let db;

export async function connectDb() {
  mkdirSync(dirname(dbPath), { recursive: true });
  db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA busy_timeout = 5000");
  migrate();
  console.log(`SQLite connected at ${dbPath}`);
}

export function getDb() {
  if (!db) throw new Error("Database not initialized");
  return db;
}

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      title TEXT DEFAULT 'Team Member',
      department TEXT DEFAULT 'People',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pairings (
      id TEXT PRIMARY KEY,
      mentor_id TEXT NOT NULL,
      mentee_id TEXT NOT NULL,
      observers TEXT NOT NULL DEFAULT '[]',
      start_date TEXT NOT NULL,
      end_date TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (mentor_id) REFERENCES users(id),
      FOREIGN KEY (mentee_id) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_pairings_mentor ON pairings(mentor_id);
    CREATE INDEX IF NOT EXISTS idx_pairings_mentee ON pairings(mentee_id);
    CREATE INDEX IF NOT EXISTS idx_pairings_status ON pairings(status);

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      pairing_id TEXT NOT NULL,
      date TEXT NOT NULL,
      agenda TEXT NOT NULL,
      notes TEXT NOT NULL,
      action_items TEXT NOT NULL DEFAULT '[]',
      visibility TEXT NOT NULL DEFAULT 'pair',
      created_by TEXT NOT NULL,
      updated_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (pairing_id) REFERENCES pairings(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_pairing ON sessions(pairing_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_visibility ON sessions(visibility);
    CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);

    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      pairing_id TEXT NOT NULL,
      from_id TEXT NOT NULL,
      to_id TEXT NOT NULL,
      body TEXT NOT NULL,
      visibility TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (pairing_id) REFERENCES pairings(id) ON DELETE CASCADE,
      FOREIGN KEY (from_id) REFERENCES users(id),
      FOREIGN KEY (to_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_feedback_pairing ON feedback(pairing_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_visibility ON feedback(visibility);
    CREATE INDEX IF NOT EXISTS idx_feedback_from ON feedback(from_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_to ON feedback(to_id);

    CREATE TABLE IF NOT EXISTS kras (
      id TEXT PRIMARY KEY,
      pairing_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      created_by TEXT NOT NULL,
      kpis TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (pairing_id) REFERENCES pairings(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_kras_pairing ON kras(pairing_id);
  `);
}
