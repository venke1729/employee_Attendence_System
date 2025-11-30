import { Express, Request, Response } from "express";
import { format } from "date-fns";
import { generateToken, verifyToken, extractToken } from "./auth";
import { randomUUID } from "crypto";

type UserRole = "employee" | "manager";

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  avatar?: string;
  employeeId: string;
  hasChangedPassword?: boolean;
}

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: string;
  totalHours?: number;
}

const USERS: User[] = [
  {
    id: "1",
    name: "Sarah Jenkins",
    email: "sarah@company.com",
    password: "password",
    role: "employee",
    department: "Engineering",
    employeeId: "EMP001",
    avatar: "https://i.pravatar.cc/150?u=sarah",
    hasChangedPassword: false,
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "michael@company.com",
    password: "password",
    role: "manager",
    department: "Engineering",
    employeeId: "MGR001",
    avatar: "https://i.pravatar.cc/150?u=michael",
    hasChangedPassword: false,
  },
  {
    id: "3",
    name: "Venkey Pujari",
    email: "pujarivenkey18@gmail.com",
    password: "Venkey@1729",
    role: "manager",
    department: "HR",
    employeeId: "MGR002",
    avatar: "https://i.pravatar.cc/150?u=venkey",
    hasChangedPassword: false,
  },
];

let ATTENDANCE_DB: AttendanceRecord[] = [];

function requireAuth(req: Request): { ok: boolean; user?: any; message?: string } {
  const token = extractToken(req.headers.authorization as string | undefined);
  if (!token) return { ok: false, message: "No token provided" };
  const payload = verifyToken(token);
  if (!payload) return { ok: false, message: "Invalid token" };
  return { ok: true, user: payload };
}

export function registerCompatRoutes(app: Express) {
  // Ensure demo manager account exists (idempotent)
  try {
    const demoEmail = "pujarivenkey18@gmail.com";
    const existing = USERS.find(u => u.email.toLowerCase() === demoEmail.toLowerCase());
    if (!existing) {
      const id = randomUUID();
      const demoManager: User = {
        id,
        name: "Venkey Pujari",
        email: demoEmail,
        password: "Venkey@1729",
        role: "manager",
        department: "HR",
        employeeId: `MGR${String(USERS.filter(u => u.role === "manager").length + 1).padStart(3, "0")}`,
        avatar: `https://i.pravatar.cc/150?u=venkey`,
        hasChangedPassword: false,
      };
      USERS.push(demoManager);
      console.log(`[SEED] Added demo manager: ${demoEmail}`);
    }
  } catch (e) {
    console.log("[SEED] Error ensuring demo manager:", (e as Error).message);
  }
  // Auth login
  app.post("/api/compat/auth/login", async (req: Request, res: Response) => {
    try {
      let { email, password } = req.body;
      email = (email || "").toString().trim().toLowerCase();
      password = (password || "").toString();
      if (!email || !password) return res.status(400).json({ message: "email and password required" });
      const user = USERS.find((u) => u.email.toLowerCase() === email);
      if (!user) {
        console.log(`[LOGIN] User not found for email: ${email}. Available users:`, USERS.map(u => u.email));
        return res.status(401).json({ message: "Invalid credentials" });
      }
      if (user.password !== password) {
        console.log(`[LOGIN] Password mismatch for ${email}. Expected: ${user.password}, Got: ${password}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken({ userId: user.id, email: user.email, role: user.role });
      const { password: _p, ...u } = user;
      return res.json({ message: "Login successful", token, user: { ...u, hasChangedPassword: user.hasChangedPassword || false } });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  });

  // Change password
  app.post("/api/compat/auth/change-password", async (req: Request, res: Response) => {
    try {
      const auth = requireAuth(req);
      if (!auth.ok) return res.status(401).json({ message: auth.message });
      const userId = auth.user.userId;
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) return res.status(400).json({ message: "oldPassword and newPassword required" });
      const user = USERS.find((u) => u.id === userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      if (user.password !== oldPassword) return res.status(401).json({ message: "Old password incorrect" });
      user.password = newPassword;
      user.hasChangedPassword = true;
      return res.json({ message: "Password changed" });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  });

  // Get current user (by token)
  app.get("/api/compat/auth/me", (req: Request, res: Response) => {
    const auth = requireAuth(req);
    if (!auth.ok) return res.status(401).json({ message: auth.message });
    const user = USERS.find((u) => u.id === auth.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const { password: _p, ...u } = user;
    return res.json({ user: { ...u, hasChangedPassword: user.hasChangedPassword || false } });
  });

  // Employees
  app.get("/api/compat/employees", (req: Request, res: Response) => {
    const auth = requireAuth(req);
    if (!auth.ok) return res.status(401).json({ message: auth.message });
    const list = USERS.map(({ password, ...u }) => u);
    res.json(list);
  });

  app.post("/api/compat/employees", (req: Request, res: Response) => {
    const auth = requireAuth(req);
    if (!auth.ok) return res.status(401).json({ message: auth.message });
    if (auth.user.role !== "manager") return res.status(403).json({ message: "Only managers" });
    let { name, email, department, password } = req.body;
    email = (email || "").toString().trim().toLowerCase();
    name = (name || "").toString().trim();
    department = (department || "").toString().trim();
    password = (password || "").toString();
    if (!name || !email || !department || !password) return res.status(400).json({ message: "All fields required" });
    if (USERS.find((u) => u.email.toLowerCase() === email)) return res.status(409).json({ message: "Email exists" });
    const id = randomUUID();
    const employeeId = `EMP${String(USERS.filter(u => u.role === "employee").length + 1).padStart(3, "0")}`;
    const newUser: User = {
      id,
      name,
      email,
      password,
      role: "employee",
      department,
      employeeId,
      avatar: `https://i.pravatar.cc/150?u=${email}`,
      hasChangedPassword: false,
    };
    USERS.push(newUser);
    const { password: _pw, ...u } = newUser;
    res.status(201).json({ user: u });
  });

  app.delete("/api/compat/employees/:id", (req: Request, res: Response) => {
    const auth = requireAuth(req);
    if (!auth.ok) return res.status(401).json({ message: auth.message });
    if (auth.user.role !== "manager") return res.status(403).json({ message: "Only managers" });
    const { id } = req.params;
    const idx = USERS.findIndex((u) => u.id === id);
    if (idx === -1) return res.status(404).json({ message: "Not found" });
    USERS.splice(idx, 1);
    return res.json({ message: "Deleted" });
  });

  // Attendance
  app.get("/api/compat/attendance", (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ message: "userId required" });
    const records = ATTENDANCE_DB.filter(r => r.userId === userId).sort((a,b) => b.date.localeCompare(a.date));
    res.json(records);
  });

  app.get("/api/compat/attendance/all", (req: Request, res: Response) => {
    const auth = requireAuth(req);
    if (!auth.ok) return res.status(401).json({ message: auth.message });
    if (auth.user.role !== "manager") return res.status(403).json({ message: "Only managers" });
    const records = ATTENDANCE_DB.map(r => {
      const user = USERS.find(u => u.id === r.userId)!;
      const { password, ...u } = user;
      return { ...r, user: u };
    }).sort((a,b) => b.date.localeCompare(a.date));
    res.json(records);
  });

  app.post("/api/compat/attendance/check-in", (req: Request, res: Response) => {
    const auth = requireAuth(req);
    if (!auth.ok) return res.status(401).json({ message: auth.message });
    const userId = auth.user.userId;
    const today = format(new Date(), "yyyy-MM-dd");
    const time = format(new Date(), "HH:mm");
    const exists = ATTENDANCE_DB.find(r => r.userId === userId && r.date === today);
    if (exists && exists.checkInTime) return res.status(400).json({ message: "Already checked in" });
    const rec: AttendanceRecord = { id: `${userId}-${today}`, userId, date: today, checkInTime: time, status: "present", totalHours: 0 };
    ATTENDANCE_DB.push(rec);
    res.status(201).json({ record: rec });
  });

  app.post("/api/compat/attendance/check-out", (req: Request, res: Response) => {
    const auth = requireAuth(req);
    if (!auth.ok) return res.status(401).json({ message: auth.message });
    const userId = auth.user.userId;
    const today = format(new Date(), "yyyy-MM-dd");
    const time = format(new Date(), "HH:mm");
    const idx = ATTENDANCE_DB.findIndex(r => r.userId === userId && r.date === today);
    if (idx === -1) return res.status(400).json({ message: "Need to check in first" });
    const rec = ATTENDANCE_DB[idx];
    rec.checkOutTime = time;
    rec.totalHours = 8;
    ATTENDANCE_DB[idx] = rec;
    res.json({ record: rec });
  });

  app.get("/api/compat/stats/team", (req: Request, res: Response) => {
    const auth = requireAuth(req);
    if (!auth.ok) return res.status(401).json({ message: auth.message });
    if (auth.user.role !== "manager") return res.status(403).json({ message: "Only managers" });
    const today = format(new Date(), "yyyy-MM-dd");
    const todayRecords = ATTENDANCE_DB.filter(r => r.date === today);
    const stats = {
      totalEmployees: USERS.filter(u => u.role === "employee").length,
      presentToday: todayRecords.filter(r => r.status === "present").length,
      absentToday: todayRecords.filter(r => r.status === "absent").length,
      lateToday: todayRecords.filter(r => r.status === "late").length,
    };
    res.json(stats);
  });
}
