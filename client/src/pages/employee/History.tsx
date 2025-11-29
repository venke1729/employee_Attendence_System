import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { StatusBadge } from "@/components/ui/status-badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Hourglass } from "lucide-react";

export default function EmployeeHistory() {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());

  const { data: attendance } = useQuery({
    queryKey: ["attendance", user?.id],
    queryFn: () => api.getEmployeeAttendance(user!.id),
    enabled: !!user,
  });

  // Function to get status for a specific date to style the calendar
  const getDayStatus = (day: Date) => {
    if (!attendance) return null;
    const record = attendance.find(r => isSameDay(parseISO(r.date), day));
    return record?.status;
  };

  const selectedRecord = attendance?.find(r => date && isSameDay(parseISO(r.date), date));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold font-heading tracking-tight">Attendance History</h2>
          <p className="text-muted-foreground">View your past attendance records and performance.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-12">
          <Card className="md:col-span-5 lg:col-span-4">
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border shadow-sm"
                modifiers={{
                  present: (date) => getDayStatus(date) === "present",
                  absent: (date) => getDayStatus(date) === "absent",
                  late: (date) => getDayStatus(date) === "late",
                  halfday: (date) => getDayStatus(date) === "half-day",
                }}
                modifiersStyles={{
                  present: { color: "var(--success)", fontWeight: "bold" },
                  absent: { color: "var(--destructive)", fontWeight: "bold" },
                  late: { color: "var(--warning)", fontWeight: "bold" },
                  halfday: { color: "blue", fontWeight: "bold" },
                }}
              />
            </CardContent>
            <div className="px-6 pb-6">
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-success"></div> Present</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-destructive"></div> Absent</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-warning"></div> Late</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Half Day</div>
              </div>
            </div>
          </Card>

          <Card className="md:col-span-7 lg:col-span-8">
            <CardHeader>
              <CardTitle>
                {date ? format(date, "MMMM do, yyyy") : "Select a date"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {date && selectedRecord ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-accent/30 rounded-lg border border-border/50">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground font-medium">Status</p>
                      <StatusBadge status={selectedRecord.status} className="text-base px-3 py-1" />
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm text-muted-foreground font-medium">Total Hours</p>
                      <p className="text-2xl font-bold font-mono">{selectedRecord.totalHours}h</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-border flex flex-col items-center justify-center space-y-2">
                      <Clock className="h-6 w-6 text-muted-foreground" />
                      <p className="text-sm font-medium text-muted-foreground">Check In</p>
                      <p className="text-xl font-bold">{selectedRecord.checkInTime || "--:--"}</p>
                    </div>
                    <div className="p-4 rounded-lg border border-border flex flex-col items-center justify-center space-y-2">
                      <Hourglass className="h-6 w-6 text-muted-foreground" />
                      <p className="text-sm font-medium text-muted-foreground">Check Out</p>
                      <p className="text-xl font-bold">{selectedRecord.checkOutTime || "--:--"}</p>
                    </div>
                  </div>
                </div>
              ) : date ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <p>No attendance record found for this date.</p>
                  <p className="text-sm">This might be a weekend or holiday.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <p>Please select a date from the calendar.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {attendance?.slice(0, 10).map((record) => (
                <div key={record.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="w-16 text-sm font-medium text-muted-foreground">
                      {format(parseISO(record.date), "MMM dd")}
                    </div>
                    <div>
                      <p className="font-medium">{format(parseISO(record.date), "EEEE")}</p>
                      <p className="text-xs text-muted-foreground">
                        {record.checkInTime} - {record.checkOutTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-mono text-muted-foreground hidden sm:inline-block">
                      {record.totalHours} hrs
                    </span>
                    <StatusBadge status={record.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
