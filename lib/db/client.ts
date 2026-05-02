import * as SQLite from "expo-sqlite";
import type { DebtStatus, DebtWithFriend, Friend, ReminderType } from "@/types/hisaab";
import { getInitials, startOfToday, uid } from "@/lib/utils";

let sqlite: SQLite.SQLiteDatabase | null = null;

function getDb() {
  if (sqlite) return sqlite;
  try {
    sqlite = SQLite.openDatabaseSync("hisaab.db");
    return sqlite;
  } catch {
    return null;
  }
}

export async function migrateDatabase() {
  const db = getDb();
  if (!db) return;

  await db.execAsync(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS friends (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      phone       TEXT,
      initials    TEXT NOT NULL,
      created_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS debts (
      id              TEXT PRIMARY KEY,
      friend_id       TEXT NOT NULL REFERENCES friends(id),
      amount          REAL NOT NULL,
      note            TEXT,
      direction       TEXT NOT NULL CHECK(direction IN ('lent', 'borrowed')),
      date_borrowed   INTEGER NOT NULL,
      due_date        INTEGER,
      status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK(status IN ('pending', 'settled', 'overdue', 'forgiven')),
      created_at      INTEGER NOT NULL,
      updated_at      INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id            TEXT PRIMARY KEY,
      debt_id       TEXT NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
      scheduled_at  INTEGER NOT NULL,
      sent          INTEGER NOT NULL DEFAULT 0,
      type          TEXT NOT NULL CHECK(type IN ('due_soon', 'overdue', 'weekly_digest'))
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key        TEXT PRIMARY KEY,
      value      TEXT,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS debts_friend_id_idx ON debts(friend_id);
    CREATE INDEX IF NOT EXISTS debts_status_idx ON debts(status);
    CREATE INDEX IF NOT EXISTS debts_due_date_idx ON debts(due_date);
    CREATE INDEX IF NOT EXISTS reminders_debt_id_idx ON reminders(debt_id);
  `);
}

export async function getAppSetting(key: string) {
  const db = getDb();
  if (!db) return null;
  const row = await db.getFirstAsync<{ value: string | null }>(`SELECT value FROM app_settings WHERE key = ? LIMIT 1`, key);
  return row?.value ?? null;
}

export async function setAppSetting(key: string, value: string) {
  const db = getDb();
  if (!db) return;
  await db.runAsync(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    key,
    value,
    Date.now(),
  );
}

export async function deleteAppSetting(key: string) {
  const db = getDb();
  if (!db) return;
  await db.runAsync(`DELETE FROM app_settings WHERE key = ?`, key);
}

export async function refreshOverdueStatuses() {
  const db = getDb();
  if (!db) return;

  await db.runAsync(
    `UPDATE debts
     SET status = 'overdue', updated_at = ?
     WHERE status = 'pending' AND due_date IS NOT NULL AND due_date < ?`,
    Date.now(),
    startOfToday(),
  );
}

export async function getFriends() {
  const db = getDb();
  if (!db) return [];
  return db.getAllAsync<Friend>(
    `SELECT id, name, phone, initials, created_at
     FROM friends
     ORDER BY name COLLATE NOCASE ASC`,
  );
}

export async function getDebts() {
  const db = getDb();
  if (!db) return [];
  return db.getAllAsync<DebtWithFriend>(
    `SELECT
       debts.id,
       debts.friend_id,
       debts.amount,
       debts.note,
       debts.direction,
       debts.date_borrowed,
       debts.due_date,
       debts.status,
       debts.created_at,
       debts.updated_at,
       friends.name AS friend_name,
       friends.phone AS friend_phone,
       friends.initials AS friend_initials
     FROM debts
     INNER JOIN friends ON friends.id = debts.friend_id
     ORDER BY debts.updated_at DESC, debts.created_at DESC`,
  );
}

export async function getFriendById(id: string) {
  const db = getDb();
  if (!db) return null;
  return db.getFirstAsync<Friend>(
    `SELECT id, name, phone, initials, created_at FROM friends WHERE id = ? LIMIT 1`,
    id,
  );
}

export async function findFriendByName(name: string) {
  const db = getDb();
  if (!db) return null;
  return db.getFirstAsync<Friend>(
    `SELECT id, name, phone, initials, created_at
     FROM friends
     WHERE lower(name) = lower(?)
     LIMIT 1`,
    name.trim(),
  );
}

export async function ensureFriend(name: string, phone?: string | null) {
  const db = getDb();
  if (!db) {
    return {
      id: uid("friend"),
      name: name.trim().replace(/\s+/g, " "),
      phone: phone ?? null,
      initials: getInitials(name),
      created_at: Date.now(),
    } satisfies Friend;
  }

  const cleanName = name.trim().replace(/\s+/g, " ");
  const existing = await findFriendByName(cleanName);

  if (existing) {
    if (phone && phone !== existing.phone) {
      await db.runAsync(`UPDATE friends SET phone = ? WHERE id = ?`, phone, existing.id);
      return { ...existing, phone };
    }
    return existing;
  }

  const friend: Friend = {
    id: uid("friend"),
    name: cleanName,
    phone: phone ?? null,
    initials: getInitials(cleanName),
    created_at: Date.now(),
  };

  await db.runAsync(
    `INSERT INTO friends (id, name, phone, initials, created_at) VALUES (?, ?, ?, ?, ?)`,
    friend.id,
    friend.name,
    friend.phone,
    friend.initials,
    friend.created_at,
  );

  return friend;
}

type PersistDebtInput = {
  id?: string;
  friendId: string;
  amount: number;
  note?: string | null;
  direction: "lent" | "borrowed";
  dateBorrowed: number;
  dueDate?: number | null;
};

export async function insertDebt(input: PersistDebtInput) {
  const db = getDb();
  const now = Date.now();
  const id = input.id ?? uid("debt");
  if (!db) return id;

  await db.runAsync(
    `INSERT INTO debts
      (id, friend_id, amount, note, direction, date_borrowed, due_date, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    id,
    input.friendId,
    input.amount,
    input.note?.trim() || null,
    input.direction,
    input.dateBorrowed,
    input.dueDate ?? null,
    now,
    now,
  );

  return id;
}

export async function updateDebtRecord(id: string, input: PersistDebtInput) {
  const db = getDb();
  if (!db) return;
  await db.runAsync(
    `UPDATE debts
     SET friend_id = ?, amount = ?, note = ?, direction = ?, date_borrowed = ?, due_date = ?, status = 'pending', updated_at = ?
     WHERE id = ?`,
    input.friendId,
    input.amount,
    input.note?.trim() || null,
    input.direction,
    input.dateBorrowed,
    input.dueDate ?? null,
    Date.now(),
    id,
  );
}

export async function setDebtStatus(id: string, status: DebtStatus) {
  const db = getDb();
  if (!db) return;
  await db.runAsync(`UPDATE debts SET status = ?, updated_at = ? WHERE id = ?`, status, Date.now(), id);
}

export async function settleAllForFriendRecord(friendId: string) {
  const db = getDb();
  if (!db) return;
  await db.runAsync(
    `UPDATE debts
     SET status = 'settled', updated_at = ?
     WHERE friend_id = ? AND status IN ('pending', 'overdue')`,
    Date.now(),
    friendId,
  );
}

export async function deleteDebtRecord(id: string) {
  const db = getDb();
  if (!db) return;
  await db.runAsync(`DELETE FROM debts WHERE id = ?`, id);
}

export async function insertReminder(id: string, debtId: string, scheduledAt: number, type: ReminderType) {
  const db = getDb();
  if (!db) return;
  await db.runAsync(
    `INSERT OR REPLACE INTO reminders (id, debt_id, scheduled_at, sent, type) VALUES (?, ?, ?, 0, ?)`,
    id,
    debtId,
    scheduledAt,
    type,
  );
}

export async function getReminderIdsForDebt(debtId: string) {
  const db = getDb();
  if (!db) return [];
  const rows = await db.getAllAsync<{ id: string }>(`SELECT id FROM reminders WHERE debt_id = ?`, debtId);
  return rows.map((row) => row.id);
}

export async function deleteRemindersForDebt(debtId: string) {
  const db = getDb();
  if (!db) return;
  await db.runAsync(`DELETE FROM reminders WHERE debt_id = ?`, debtId);
}
