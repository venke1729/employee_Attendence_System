// This module now proxies to the server compatibility API at /api/compat
// so frontend code can continue to call `api.*` functions without changing
// many imports. The server endpoints are lightweight in-memory fallbacks.

export type UserRole = "employee" | "manager";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatar?: string;
  employeeId: string;
  hasChangedPassword?: boolean;
}

export type AttendanceStatus = "present" | "absent" | "late" | "half-day";

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: AttendanceStatus;
  totalHours?: number;
}

// Point to backend server - dynamic based on environment
const API_PREFIX = typeof window !== 'undefined' 
  ? `${window.location.protocol}//${window.location.hostname}:3001/api/compat`
  : "http://localhost:3001/api/compat";

function authHeaders() {
  const token = localStorage.getItem("attendance_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson(path: string, opts: RequestInit = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) } as Record<string, string>;
  const res = await fetch(`${API_PREFIX}${path}`, { ...opts, headers });
  if (!res.ok) {
    const txt = await res.text();
    let msg = txt;
    try { msg = JSON.parse(txt).message || txt; } catch (e) {}
    throw new Error(msg || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  login: async (email: string, password: string): Promise<User> => {
    const body = JSON.stringify({ email, password });
    const res = await fetchJson(`/auth/login`, { method: "POST", body, headers: authHeaders() });
    // server returns { message, token, user }
    const token = (res as any).token;
    if (token) localStorage.setItem("attendance_token", token);
    return (res as any).user as User;
  },

  getCurrentUser: async (): Promise<User> => {
    const res = await fetchJson(`/auth/me`, { method: "GET", headers: authHeaders() });
    return (res as any).user as User;
  },

  getAllEmployees: async (): Promise<User[]> => {
    const res = await fetchJson(`/employees`, { method: "GET", headers: authHeaders() });
    return res as User[];
  },

  addEmployee: async (name: string, email: string, department: string, password: string): Promise<User> => {
    const body = JSON.stringify({ name, email, department, password });
    const res = await fetchJson(`/employees`, { method: "POST", body, headers: { ...authHeaders() } });
    return (res as any).user as User;
  },

  removeEmployee: async (userId: string): Promise<void> => {
    await fetchJson(`/employees/${encodeURIComponent(userId)}`, { method: "DELETE", headers: authHeaders() });
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    await fetchJson(`/auth/change-password`, { method: "POST", body: JSON.stringify({ oldPassword, newPassword }), headers: authHeaders() });
  },

  getEmployeeAttendance: async (userId: string): Promise<AttendanceRecord[]> => {
    const res = await fetchJson(`/attendance?userId=${encodeURIComponent(userId)}`, { method: "GET", headers: authHeaders() });
    return res as AttendanceRecord[];
  },

  getAllAttendance: async (): Promise<(AttendanceRecord & { user: User })[]> => {
    const res = await fetchJson(`/attendance/all`, { method: "GET", headers: authHeaders() });
    return res as any;
  },

  checkIn: async (userId: string): Promise<AttendanceRecord> => {
    const res = await fetchJson(`/attendance/check-in`, { method: "POST", headers: authHeaders() });
    return (res as any).record as AttendanceRecord;
  },

  checkOut: async (userId: string): Promise<AttendanceRecord> => {
    const res = await fetchJson(`/attendance/check-out`, { method: "POST", headers: authHeaders() });
    return (res as any).record as AttendanceRecord;
  },

  getTeamStats: async () => {
    const res = await fetchJson(`/stats/team`, { method: "GET", headers: authHeaders() });
    return res;
  }
};
