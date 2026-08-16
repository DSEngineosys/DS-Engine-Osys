import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff, UserCircle } from "lucide-react";
import { PublicLayout } from "@/components/layout";
import { useAuth } from "@/lib/auth";

export default function EmployeeLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId || !password) {
      toast({ variant: "destructive", title: "Error", description: "Please fill in all fields." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: employeeId, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      
      // Refresh user context to populate the session state
      await refreshUser();
      
      toast({ title: "Welcome back!", description: "Opening your workspace..." });
      setLocation("/employee/workspace");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Login failed", description: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicLayout>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary text-white rounded-xl flex items-center justify-center text-2xl font-bold shadow-md mb-6">
              <UserCircle className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">Employee Login</h1>
            <p className="mt-2 text-sm text-gray-500">Access your daily workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Employee ID</label>
              <Input
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                placeholder="e.g. EMP002"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Input
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 text-base font-bold shadow-md">
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Sign in
            </Button>
          </form>
          
          <div className="text-center">
            <p className="text-sm text-slate-500">
              Need help? <a href="/help" className="font-bold text-primary hover:underline">Contact HR</a>
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
