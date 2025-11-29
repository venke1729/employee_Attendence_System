import { cn } from "@/lib/utils";
import { AttendanceStatus } from "@/lib/mockData";

interface StatusBadgeProps {
  status: AttendanceStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants: Record<string, string> = {
    present: "bg-success/15 text-success hover:bg-success/25 border-success/20",
    absent: "bg-destructive/15 text-destructive hover:bg-destructive/25 border-destructive/20",
    late: "bg-warning/15 text-warning-foreground hover:bg-warning/25 border-warning/20",
    "half-day": "bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border-blue-500/20",
  };

  const labels: Record<string, string> = {
    present: "Present",
    absent: "Absent",
    late: "Late Arrival",
    "half-day": "Half Day",
  };

  const variantClass = variants[status] || "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
      variantClass,
      className
    )}>
      {labels[status] || status}
    </span>
  );
}
