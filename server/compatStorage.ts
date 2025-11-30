import fs from "fs";
import path from "path";

let Database: any = null;
let db: any = null;

try {
  // lazy require so project still runs if package not installed
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Database = require("better-sqlite3");
} catch (e) {
  Database = null;
}

const DB_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "dev.sqlite");

export async function initSqlite() {
  if (!Database) return false;
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  db = new Database(DB_FILE);

  // Enable WAL for concurrency
  db.pragma("journal_mode = WAL");

  // Create tables if they don't exist
  db.exec(
    `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT NOT NULL,
      employeeId TEXT NOT NULL UNIQUE,
      hasChangedPassword INTEGER DEFAULT 0,
      avatar TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      date TEXT NOT NULL,
      checkInTime TEXT,
      checkOutTime TEXT,
      status TEXT,
      totalHours REAL,
      notes TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    );
  `,
  );

  return true;
}

function rowToUser(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    role: row.role,
    department: row.department,
    employeeId: row.employeeId,
    avatar: row.avatar,
    hasChangedPassword: Boolean(row.hasChangedPassword),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function isSqliteEnabled() {
  return Boolean(Database && db);
}

export function getAllUsers() {
  if (!db) return [];
  const stmt = db.prepare("SELECT * FROM users ORDER BY createdAt DESC");
  return stmt.all().map(rowToUser);
}

export function getUserByEmail(email: string) {
  if (!db) return null;
  const stmt = db.prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
  return rowToUser(stmt.get(email));
}

export function getUserById(id: string) {
  if (!db) return null;
  const stmt = db.prepare("SELECT * FROM users WHERE id = ? LIMIT 1");
  return rowToUser(stmt.get(id));
}

export function addUser(user: any) {
  if (!db) return null;
  const now = new Date().toISOString();
  const stmt = db.prepare(
    `INSERT INTO users (id, name, email, password, role, department, employeeId, hasChangedPassword, avatar, createdAt, updatedAt)
     VALUES (@id,@name,@email,@password,@role,@department,@employeeId,@hasChangedPassword,@avatar,@createdAt,@updatedAt)`,
  );
  const info = stmt.run({
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.password,
    role: user.role,
    department: user.department,
    employeeId: user.employeeId,
    hasChangedPassword: user.hasChangedPassword ? 1 : 0,
    avatar: user.avatar || null,
    createdAt: now,
    updatedAt: now,
  });
  return getUserById(user.id);
}

export function deleteUser(id: string) {
  if (!db) return false;
  const stmt = db.prepare("DELETE FROM users WHERE id = ?");
  const info = stmt.run(id);
  return info.changes > 0;
}

export function updatePassword(id: string, newPassword: string) {
  if (!db) return false;
  const now = new Date().toISOString();
  const stmt = db.prepare("UPDATE users SET password = ?, hasChangedPassword = 1, updatedAt = ? WHERE id = ?");
  const info = stmt.run(newPassword, now, id);
  return info.changes > 0;
}

export function addAttendance(record: any) {
  if (!db) return null;
  const now = new Date().toISOString();
  const stmt = db.prepare(
    `INSERT INTO attendance (id, userId, date, checkInTime, checkOutTime, status, totalHours, notes, createdAt, updatedAt)
     VALUES (@id,@userId,@date,@checkInTime,@checkOutTime,@status,@totalHours,@notes,@createdAt,@updatedAt)`,
  );
  stmt.run({
    id: record.id,
    userId: record.userId,
    date: record.date,
    checkInTime: record.checkInTime || null,
    checkOutTime: record.checkOutTime || null,
    status: record.status || null,
    totalHours: record.totalHours || null,
    notes: record.notes || null,
    createdAt: now,
    updatedAt: now,
  });
  const r = db.prepare("SELECT * FROM attendance WHERE id = ?").get(record.id);
  return r;
}

export function getAttendanceByUser(userId: string) {
  if (!db) return [];
  const stmt = db.prepare("SELECT * FROM attendance WHERE userId = ? ORDER BY date DESC");
  return stmt.all(userId);
}

export function getAllAttendance() {
  if (!db) return [];
  const stmt = db.prepare(
    `SELECT a.*, u.id as uid, u.name as uname, u.email as uemail, u.role as urole, u.department as udepartment, u.employeeId as uemployeeId
     FROM attendance a LEFT JOIN users u ON a.userId = u.id ORDER BY a.date DESC`,
  );
  return stmt.all().map((row: any) => {
    const user = {
      id: row.uid,
      name: row.uname,
      email: row.uemail,
      role: row.urole,
      department: row.udepartment,
      employeeId: row.uemployeeId,
    };
    const { uid, uname, uemail, urole, udepartment, uemployeeId, ...attendance } = row;
    return { ...attendance, user };
  });
}

export function getTeamStats() {
  if (!db) return { totalEmployees: 0, presentToday: 0, absentToday: 0, lateToday: 0 };
  const today = new Date().toISOString().slice(0, 10);
  const totalEmployees = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'employee'").get().c;
  const todayRecords = db.prepare("SELECT * FROM attendance WHERE date = ?").all(today);
  return {
    totalEmployees,
    presentToday: todayRecords.filter((r: any) => r.status === "present").length,
    absentToday: todayRecords.filter((r: any) => r.status === "absent").length,
    lateToday: todayRecords.filter((r: any) => r.status === "late").length,
  };
}
