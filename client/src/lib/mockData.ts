import { addDays, format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWeekend } from "date-fns";

// Types
export type UserRole = "employee" | "manager";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatar?: string;
  employeeId: string;
}

export type AttendanceStatus = "present" | "absent" | "late" | "half-day";

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string; // ISO Date string YYYY-MM-DD
  checkInTime?: string; // HH:mm
  checkOutTime?: string; // HH:mm
  status: AttendanceStatus;
  totalHours?: number;
}

// Mock Data Store
const USERS: User[] = [
  {
    id: "1",
    name: "Sarah Jenkins",
    email: "sarah@company.com",
    role: "employee",
    department: "Engineering",
    employeeId: "EMP001",
    avatar: "https://i.pravatar.cc/150?u=sarah"
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "michael@company.com",
    role: "manager",
    department: "Engineering",
    employeeId: "MGR001",
    avatar: "https://i.pravatar.cc/150?u=michael"
  },
  {
    id: "3",
    name: "David Ross",
    email: "david@company.com",
    role: "employee",
    department: "Design",
    employeeId: "EMP002",
    avatar: "https://i.pravatar.cc/150?u=david"
  },
  {
    id: "4",
    name: "Emma Wilson",
    email: "emma@company.com",
    role: "employee",
    department: "Marketing",
    employeeId: "EMP003",
    avatar: "https://i.pravatar.cc/150?u=emma"
  }
];

// Generate mock attendance for the last 2 months
const generateMockAttendance = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  const startDate = subMonths(today, 2);
  const endDate = today;
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  USERS.forEach(user => {
    days.forEach(day => {
      if (isWeekend(day)) return; // Skip weekends

      const dateStr = format(day, "yyyy-MM-dd");
      
      // Randomize attendance
      const rand = Math.random();
      let status: AttendanceStatus = "present";
      let checkIn: string | undefined = "09:00";
      let checkOut: string | undefined = "17:00";
      let hours = 8;

      if (rand > 0.95) {
        status = "absent";
        checkIn = undefined;
        checkOut = undefined;
        hours = 0;
      } else if (rand > 0.85) {
        status = "late";
        checkIn = "09:45";
        hours = 7.25;
      } else if (rand > 0.80) {
        status = "half-day";
        checkIn = "09:00";
        checkOut = "13:00";
        hours = 4;
      }

      // Make today empty for current user to simulate "Not Checked In"
      if (isSameDay(day, today)) {
        return; 
      }

      records.push({
        id: `${user.id}-${dateStr}`,
        userId: user.id,
        date: dateStr,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        status,
        totalHours: hours
      });
    });
  });

  return records;
};

let ATTENDANCE_DB = generateMockAttendance();

// API Simulation
export const api = {
  login: async (email: string): Promise<User> => {
    await new Promise(r => setTimeout(r, 800));
    const user = USERS.find(u => u.email === email);
    if (!user) throw new Error("Invalid credentials");
    return user;
  },

  getCurrentUser: async (id: string): Promise<User> => {
    await new Promise(r => setTimeout(r, 400));
    const user = USERS.find(u => u.id === id);
    if (!user) throw new Error("User not found");
    return user;
  },

  getEmployeeAttendance: async (userId: string): Promise<AttendanceRecord[]> => {
    await new Promise(r => setTimeout(r, 600));
    return ATTENDANCE_DB.filter(r => r.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getAllAttendance: async (): Promise<(AttendanceRecord & { user: User })[]> => {
    await new Promise(r => setTimeout(r, 800));
    return ATTENDANCE_DB.map(record => ({
      ...record,
      user: USERS.find(u => u.id === record.userId)!
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  checkIn: async (userId: string): Promise<AttendanceRecord> => {
    await new Promise(r => setTimeout(r, 1000));
    const today = format(new Date(), "yyyy-MM-dd");
    const time = format(new Date(), "HH:mm");
    
    const newRecord: AttendanceRecord = {
      id: `${userId}-${today}`,
      userId,
      date: today,
      checkInTime: time,
      status: "present", // Default, logic could be smarter for "late"
      totalHours: 0
    };
    
    ATTENDANCE_DB.push(newRecord);
    return newRecord;
  },

  checkOut: async (userId: string): Promise<AttendanceRecord> => {
    await new Promise(r => setTimeout(r, 1000));
    const today = format(new Date(), "yyyy-MM-dd");
    const time = format(new Date(), "HH:mm");
    
    const recordIndex = ATTENDANCE_DB.findIndex(r => r.userId === userId && r.date === today);
    if (recordIndex === -1) throw new Error("Need to check in first");
    
    const updatedRecord = {
      ...ATTENDANCE_DB[recordIndex],
      checkOutTime: time,
      totalHours: 8 // Mock calculation
    };
    
    ATTENDANCE_DB[recordIndex] = updatedRecord;
    return updatedRecord;
  },

  getTeamStats: async () => {
    await new Promise(r => setTimeout(r, 500));
    const today = format(new Date(), "yyyy-MM-dd");
    const todayRecords = ATTENDANCE_DB.filter(r => r.date === today);
    
    return {
      totalEmployees: USERS.filter(u => u.role === "employee").length,
      presentToday: todayRecords.filter(r => r.status === "present").length,
      absentToday: todayRecords.filter(r => r.status === "absent").length,
      lateToday: todayRecords.filter(r => r.status === "late").length,
    };
  }
};
