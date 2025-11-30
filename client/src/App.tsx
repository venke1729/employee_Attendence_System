import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

import Login from "@/pages/auth/Login";
import ChangePasswordRequired from "@/pages/ChangePasswordRequired";
import EmployeeDashboard from "@/pages/employee/Dashboard";
import EmployeeHistory from "@/pages/employee/History";
import ManagerDashboard from "@/pages/manager/Dashboard";
import ManagerTeam from "@/pages/manager/Team";
import ManagerReports from "@/pages/manager/Reports";
import ManagerEmployees from "@/pages/manager/Employees";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

// Protected Route Wrapper
function ProtectedRoute({ component: Component, role }: { component: React.ComponentType<any>, role?: "employee" | "manager" }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  
  if (!user) return <Redirect to="/login" />;
  
  if (role && user.role !== role) {
    // Redirect based on role if trying to access unauthorized page
    return <Redirect to={user.role === "manager" ? "/manager/dashboard" : "/dashboard"} />;
  }

  return <Component />;
}

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      {/* Force password change on first login */}
      <Route path="/change-password-required">
        <ChangePasswordRequired />
      </Route>
      
      {/* Employee Routes */}
      <Route path="/dashboard">
        <ProtectedRoute component={EmployeeDashboard} role="employee" />
      </Route>
      <Route path="/history">
        <ProtectedRoute component={EmployeeHistory} role="employee" />
      </Route>

      {/* Manager Routes */}
      <Route path="/manager/dashboard">
        <ProtectedRoute component={ManagerDashboard} role="manager" />
      </Route>
      <Route path="/manager/team">
        <ProtectedRoute component={ManagerTeam} role="manager" />
      </Route>
      <Route path="/manager/reports">
        <ProtectedRoute component={ManagerReports} role="manager" />
      </Route>
      <Route path="/manager/employees">
        <ProtectedRoute component={ManagerEmployees} role="manager" />
      </Route>

      {/* Settings Route */}
      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>

      {/* Root Redirect */}
      <Route path="/">
        {user ? (
          // If user hasn't changed password on first login, redirect to change password
          !(user as any).hasChangedPassword ? (
            <Redirect to="/change-password-required" />
          ) : (
            <Redirect to={user.role === "manager" ? "/manager/dashboard" : "/dashboard"} />
          )
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
