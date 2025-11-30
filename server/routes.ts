import type { Express } from "express";
import { createServer, type Server } from "http";
import { db, schema } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { hashPassword, comparePassword, generateToken, verifyToken, extractToken } from "./auth";
import { log } from "./index";
import { format } from "date-fns";
import type { Request, Response, NextFunction } from "express";

// Middleware to verify JWT token
export async function authMiddleware(req: Request & { user?: any }, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ============================================
  // AUTH ROUTES
  // ============================================

  // POST /api/auth/login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);

      if (user.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isPasswordValid = await comparePassword(password, user[0].password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate token
      const token = generateToken({
        userId: user[0].id,
        email: user[0].email,
        role: user[0].role,
      });

      const { password: _, ...userWithoutPassword } = user[0];

      res.json({
        message: "Login successful",
        token,
        user: {
          ...userWithoutPassword,
          hasChangedPassword: user[0].hasChangedPassword || false,
        },
      });
    } catch (error: any) {
      log(`Login error: ${error.message}`, "error");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/auth/change-password
  app.post("/api/auth/change-password", authMiddleware, async (req: Request & { user?: any }, res: Response) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user.userId;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: "Old and new passwords are required" });
      }

      const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);

      if (user.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const isPasswordValid = await comparePassword(oldPassword, user[0].password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Old password is incorrect" });
      }

      const hashedPassword = await hashPassword(newPassword);

      await db
        .update(schema.users)
        .set({ password: hashedPassword, hasChangedPassword: true })
        .where(eq(schema.users.id, userId));

      res.json({ message: "Password changed successfully" });
    } catch (error: any) {
      log(`Change password error: ${error.message}`, "error");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // EMPLOYEE ROUTES
  // ============================================

  // GET /api/employees
  app.get("/api/employees", authMiddleware, async (req: Request & { user?: any }, res: Response) => {
    try {
      const employees = await db.select().from(schema.users).where(eq(schema.users.role, "employee"));

      const withoutPasswords = employees.map(({ password, ...user }) => user);
      res.json(withoutPasswords);
    } catch (error: any) {
      log(`Get employees error: ${error.message}`, "error");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/employees
  app.post("/api/employees", authMiddleware, async (req: Request & { user?: any }, res: Response) => {
    try {
      // Only managers can add employees
      if (req.user.role !== "manager") {
        return res.status(403).json({ message: "Only managers can add employees" });
      }

      const { name, email, department, password } = req.body;

      if (!name || !email || !department || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Check if email already exists
      const existingUser = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
      if (existingUser.length > 0) {
        return res.status(409).json({ message: "Email already exists" });
      }

      // Generate employee ID
      const employeeCount = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.role, "employee"));
      const employeeId = `EMP${String(employeeCount.length + 1).padStart(3, "0")}`;

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const newUser = await db
        .insert(schema.users)
        .values({
          name,
          email,
          password: hashedPassword,
          role: "employee",
          department,
          employeeId,
          hasChangedPassword: false,
        })
        .returning();

      const { password: _, ...userWithoutPassword } = newUser[0];

      res.status(201).json({
        message: "Employee created successfully",
        user: userWithoutPassword,
      });
    } catch (error: any) {
      log(`Create employee error: ${error.message}`, "error");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // DELETE /api/employees/:id
  app.delete("/api/employees/:id", authMiddleware, async (req: Request & { user?: any }, res: Response) => {
    try {
      // Only managers can delete employees
      if (req.user.role !== "manager") {
        return res.status(403).json({ message: "Only managers can delete employees" });
      }

      const { id } = req.params;

      await db.delete(schema.users).where(eq(schema.users.id, id));

      res.json({ message: "Employee deleted successfully" });
    } catch (error: any) {
      log(`Delete employee error: ${error.message}`, "error");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // ATTENDANCE ROUTES
  // ============================================

  // GET /api/attendance
  app.get("/api/attendance", authMiddleware, async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.query.userId as string;

      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }

      const records = await db
        .select()
        .from(schema.attendance)
        .where(eq(schema.attendance.userId, userId))
        .orderBy(desc(schema.attendance.date));

      res.json(records);
    } catch (error: any) {
      log(`Get attendance error: ${error.message}`, "error");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/attendance/all
  app.get("/api/attendance/all", authMiddleware, async (req: Request & { user?: any }, res: Response) => {
    try {
      // Only managers can view all attendance
      if (req.user.role !== "manager") {
        return res.status(403).json({ message: "Only managers can view all attendance" });
      }

      const records = await db
        .select({
          id: schema.attendance.id,
          userId: schema.attendance.userId,
          date: schema.attendance.date,
          checkInTime: schema.attendance.checkInTime,
          checkOutTime: schema.attendance.checkOutTime,
          status: schema.attendance.status,
          totalHours: schema.attendance.totalHours,
          user: {
            id: schema.users.id,
            name: schema.users.name,
            email: schema.users.email,
            role: schema.users.role,
            department: schema.users.department,
            employeeId: schema.users.employeeId,
          },
        })
        .from(schema.attendance)
        .leftJoin(schema.users, eq(schema.attendance.userId, schema.users.id))
        .orderBy(desc(schema.attendance.date));

      res.json(records);
    } catch (error: any) {
      log(`Get all attendance error: ${error.message}`, "error");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/attendance/check-in
  app.post("/api/attendance/check-in", authMiddleware, async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user.userId;
      const today = format(new Date(), "yyyy-MM-dd");
      const time = format(new Date(), "HH:mm");

      // Check if already checked in today
      const existing = await db
        .select()
        .from(schema.attendance)
        .where(and(eq(schema.attendance.userId, userId), eq(schema.attendance.date, today)))
        .limit(1);

      if (existing.length > 0 && existing[0].checkInTime) {
        return res.status(400).json({ message: "Already checked in today" });
      }

      const record = await db
        .insert(schema.attendance)
        .values({
          userId,
          date: today,
          checkInTime: time,
          status: "present",
        })
        .returning();

      res.status(201).json({
        message: "Checked in successfully",
        record: record[0],
      });
    } catch (error: any) {
      log(`Check-in error: ${error.message}`, "error");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/attendance/check-out
  app.post("/api/attendance/check-out", authMiddleware, async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user.userId;
      const today = format(new Date(), "yyyy-MM-dd");
      const time = format(new Date(), "HH:mm");

      const existing = await db
        .select()
        .from(schema.attendance)
        .where(and(eq(schema.attendance.userId, userId), eq(schema.attendance.date, today)))
        .limit(1);

      if (existing.length === 0) {
        return res.status(400).json({ message: "Need to check in first" });
      }

      // Calculate total hours
      const checkInTime = existing[0].checkInTime;
      let totalHours = 0;
      if (checkInTime) {
        const [inHour, inMin] = checkInTime.split(":").map(Number);
        const [outHour, outMin] = time.split(":").map(Number);
        totalHours = outHour - inHour + (outMin - inMin) / 60;
      }

      const record = await db
        .update(schema.attendance)
        .set({ checkOutTime: time, totalHours: Math.round(totalHours * 100) / 100 })
        .where(eq(schema.attendance.id, existing[0].id))
        .returning();

      res.json({
        message: "Checked out successfully",
        record: record[0],
      });
    } catch (error: any) {
      log(`Check-out error: ${error.message}`, "error");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // STATS ROUTES
  // ============================================

  // GET /api/stats/team
  app.get("/api/stats/team", authMiddleware, async (req: Request & { user?: any }, res: Response) => {
    try {
      if (req.user.role !== "manager") {
        return res.status(403).json({ message: "Only managers can view team stats" });
      }

      const today = format(new Date(), "yyyy-MM-dd");

      const todayRecords = await db
        .select()
        .from(schema.attendance)
        .where(eq(schema.attendance.date, today));

      const totalEmployees = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.role, "employee"));

      const stats = {
        totalEmployees: totalEmployees.length,
        presentToday: todayRecords.filter((r) => r.status === "present").length,
        absentToday: todayRecords.filter((r) => r.status === "absent").length,
        lateToday: todayRecords.filter((r) => r.status === "late").length,
      };

      res.json(stats);
    } catch (error: any) {
      log(`Get team stats error: ${error.message}`, "error");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
