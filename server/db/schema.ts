import { pgTable, text, varchar, timestamp, boolean, integer, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users Table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(), // hashed
  role: varchar("role", { length: 50 }).notNull().default("employee"), // "employee" | "manager"
  department: varchar("department", { length: 255 }).notNull(),
  employeeId: varchar("employee_id", { length: 50 }).notNull().unique(),
  hasChangedPassword: boolean("has_changed_password").notNull().default(false),
  avatar: varchar("avatar", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Attendance Table
export const attendance = pgTable("attendance", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  checkInTime: varchar("check_in_time", { length: 5 }), // HH:mm
  checkOutTime: varchar("check_out_time", { length: 5 }), // HH:mm
  status: varchar("status", { length: 50 }).notNull().default("present"), // "present" | "absent" | "late" | "half-day"
  totalHours: integer("total_hours"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  attendance: many(attendance),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  user: one(users, {
    fields: [attendance.userId],
    references: [users.id],
  }),
}));

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;
