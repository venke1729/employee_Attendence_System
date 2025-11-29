import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { api, AttendanceRecord } from "@/lib/mockData";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CalendarCheck, AlertCircle, Timer, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: attendance, isLoading } = useQuery({
    queryKey: ["attendance", user?.id],
    queryFn: () => api.getEmployeeAttendance(user!.id),
    enabled: !!user,
  });

  const checkInMutation = useMutation({
    mutationFn: () => api.checkIn(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast({ title: "Checked In", description: "You have successfully checked in for today." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const checkOutMutation = useMutation({
    mutationFn: () => api.checkOut(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast({ title: "Checked Out", description: "Have a great evening!" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Compute stats
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayRecord = attendance?.find(r => r.date === todayStr);
  
  // Safe access to checkInTime
  const isCheckedIn = !!todayRecord?.checkInTime && !todayRecord?.checkOutTime;
  const isCheckedOut = !!todayRecord?.checkOutTime;
  
  // Count stats for current month
  const currentMonth = new Date().getMonth();
  const monthRecords = attendance?.filter(r => new Date(r.date).getMonth() === currentMonth) || [];
  
  const presentCount = monthRecords.filter(r => r.status === "present" || r.status === "half-day").length;
  const absentCount = monthRecords.filter(r => r.status === "absent").length;
  const lateCount = monthRecords.filter(r => r.status === "late").length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold font-heading tracking-tight">Good Morning, {user?.name.split(' ')[0]}</h2>
            <p className="text-muted-foreground mt-1">{format(new Date(), "EEEE, MMMM do, yyyy")}</p>
          </div>
          
          <div className="flex items-center gap-4">
            {!isCheckedOut ? (
              !isCheckedIn ? (
                <Button 
                  size="lg" 
                  className="bg-success hover:bg-success/90 text-white shadow-lg shadow-success/20 transition-all hover:-translate-y-0.5"
                  onClick={() => checkInMutation.mutate()}
                  disabled={checkInMutation.isPending}
                >
                  {checkInMutation.isPending ? "Checking in..." : "Check In Now"}
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  variant="destructive"
                  className="shadow-lg shadow-destructive/20 transition-all hover:-translate-y-0.5"
                  onClick={() => checkOutMutation.mutate()}
                  disabled={checkOutMutation.isPending}
                >
                  {checkOutMutation.isPending ? "Checking out..." : "Check Out Now"}
                </Button>
              )
            ) : (
              <Button size="lg" variant="outline" disabled className="opacity-75">
                Day Completed
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Present Days"
            value={presentCount}
            icon={CheckCircle2}
            description="This month"
            className="border-l-4 border-l-success"
          />
          <StatCard
            title="Absent Days"
            value={absentCount}
            icon={XCircle}
            description="This month"
            className="border-l-4 border-l-destructive"
          />
          <StatCard
            title="Late Arrivals"
            value={lateCount}
            icon={AlertCircle}
            description="This month"
            className="border-l-4 border-l-warning"
          />
          <StatCard
            title="Working Hours"
            value="142h"
            icon={Timer}
            description="Avg 7.8h / day"
            className="border-l-4 border-l-primary"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-7">
          <Card className="col-span-7 lg:col-span-4 shadow-sm">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading history...</div>
                ) : (
                  attendance?.slice(0, 5).map((record) => (
                    <div key={record.id} className="flex items-center">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {format(new Date(record.date), "MMMM do, yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {record.checkInTime ? `${record.checkInTime} - ${record.checkOutTime || '...'}` : 'No attendance record'}
                        </p>
                      </div>
                      <div className="ml-auto font-medium">
                        <StatusBadge status={record.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-7 lg:col-span-3 shadow-sm bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
            <CardHeader>
              <CardTitle>Today's Status</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8 space-y-6">
              <div className="relative">
                <div className="h-40 w-40 rounded-full border-8 border-background bg-card shadow-xl flex items-center justify-center relative z-10">
                   <div className="text-center">
                     <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Current Time</p>
                     <p className="text-3xl font-bold font-mono text-primary">
                       {format(new Date(), "HH:mm")}
                     </p>
                   </div>
                </div>
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">
                  {isCheckedIn 
                    ? "You are currently working" 
                    : isCheckedOut 
                      ? "You have checked out" 
                      : "You haven't checked in yet"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">
                  {isCheckedIn 
                    ? `Checked in at ${todayRecord?.checkInTime}. Don't forget to take a break!` 
                    : "Your shift starts at 09:00 AM. Please mark your attendance on time."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
