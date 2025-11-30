import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, api } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Try token-based session first
    const token = localStorage.getItem("attendance_token");
    if (token) {
      api
        .getCurrentUser()
        .then((u) => {
          setUser(u);
          localStorage.setItem("attendance_user", JSON.stringify(u));
        })
        .catch(() => {
          // fallback to previously stored user
          const storedUser = localStorage.getItem("attendance_user");
          if (storedUser) setUser(JSON.parse(storedUser));
        })
        .finally(() => setIsLoading(false));
      return;
    }

    // fallback stored user
    const storedUser = localStorage.getItem("attendance_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const user = await api.login(email, password);
      setUser(user);
      localStorage.setItem("attendance_user", JSON.stringify(user));
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.name}`,
      });
      
      if (user.role === "manager") {
        setLocation("/manager/dashboard");
      } else {
        setLocation("/dashboard");
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("attendance_user");
    setLocation("/login");
    toast({
      title: "Logged out",
      description: "See you next time!",
    });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
