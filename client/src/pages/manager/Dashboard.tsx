import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/mockData";
import { StatCard } from "@/components/ui/stat-card";
import { Users, UserCheck, UserX, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function ManagerDashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["team-stats"],
    queryFn: api.getTeamStats,
  });

  const { data: allAttendance } = useQuery({
    queryKey: ["all-attendance"],
    queryFn: api.getAllAttendance,
  });

  // Mock chart data
  const weeklyData = [
    { name: 'Mon', present: 45, absent: 5, late: 2 },
    { name: 'Tue', present: 48, absent: 2, late: 1 },
    { name: 'Wed', present: 47, absent: 3, late: 4 },
    { name: 'Thu', present: 46, absent: 4, late: 2 },
    { name: 'Fri', present: 42, absent: 8, late: 5 },
  ];

  const deptData = [
    { name: 'Engineering', value: 25 },
    { name: 'Design', value: 15 },
    { name: 'Marketing', value: 20 },
    { name: 'Sales', value: 10 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold font-heading tracking-tight">Manager Dashboard</h2>
          <p className="text-muted-foreground">Overview of your team's performance today.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Employees"
            value={stats?.totalEmployees || 0}
            icon={Users}
            description="Active team members"
          />
          <StatCard
            title="Present Today"
            value={stats?.presentToday || 0}
            icon={UserCheck}
            description="On time or late"
            trend="up"
            trendValue="+4%"
          />
          <StatCard
            title="Absent Today"
            value={stats?.absentToday || 0}
            icon={UserX}
            description="Unscheduled absences"
            trend="down"
            trendValue="-2%"
          />
          <StatCard
            title="Late Arrivals"
            value={stats?.lateToday || 0}
            icon={Clock}
            description="Arrived after 9:30 AM"
            className="border-l-4 border-l-warning"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-7">
          <Card className="col-span-7 lg:col-span-4">
            <CardHeader>
              <CardTitle>Weekly Attendance Trend</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="present" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="absent" fill="var(--destructive)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="late" fill="var(--warning)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-7 lg:col-span-3">
            <CardHeader>
              <CardTitle>Department Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deptData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {deptData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-3xl font-bold font-heading">70</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-4 text-xs text-muted-foreground mt-4">
                {deptData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    {entry.name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
