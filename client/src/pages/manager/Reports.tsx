import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, FileDown } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ManagerReports() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your report is being generated and will download shortly.",
    });
    // Mock download simulation
    setTimeout(() => {
      toast({
        title: "Download Complete",
        description: "attendance_report_nov_2025.csv saved to downloads.",
        className: "bg-success text-white border-none",
      });
    }, 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold font-heading tracking-tight">Reports</h2>
          <p className="text-muted-foreground">Generate and export detailed attendance reports.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t">
              <Button onClick={handleExport} className="w-full md:w-auto">
                <FileDown className="mr-2 h-4 w-4" />
                Generate CSV Report
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid gap-4 md:grid-cols-3">
           <Card className="bg-primary/5 border-primary/20">
             <CardContent className="pt-6">
               <div className="flex flex-col items-center text-center space-y-2">
                 <div className="p-3 rounded-full bg-primary/10">
                   <FileDown className="h-6 w-6 text-primary" />
                 </div>
                 <h3 className="font-semibold">Monthly Summary</h3>
                 <p className="text-sm text-muted-foreground">Complete attendance log for all employees for the current month.</p>
                 <Button variant="link" onClick={handleExport} className="text-primary">Download</Button>
               </div>
             </CardContent>
           </Card>
           <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/30">
             <CardContent className="pt-6">
               <div className="flex flex-col items-center text-center space-y-2">
                 <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/40">
                   <FileDown className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                 </div>
                 <h3 className="font-semibold">Late Arrivals Report</h3>
                 <p className="text-sm text-muted-foreground">Detailed report of late arrivals and overtime hours.</p>
                 <Button variant="link" onClick={handleExport} className="text-orange-600 dark:text-orange-400">Download</Button>
               </div>
             </CardContent>
           </Card>
           <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30">
             <CardContent className="pt-6">
               <div className="flex flex-col items-center text-center space-y-2">
                 <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/40">
                   <FileDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                 </div>
                 <h3 className="font-semibold">Absence Report</h3>
                 <p className="text-sm text-muted-foreground">List of employees with absences and leave requests.</p>
                 <Button variant="link" onClick={handleExport} className="text-red-600 dark:text-red-400">Download</Button>
               </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
