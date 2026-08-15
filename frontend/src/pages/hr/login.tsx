import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff, Shield } from "lucide-react";
import { PublicLayout } from "@/components/layout";

export default function HRLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [hrId, setHrId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hrId || !password) {
      toast({ variant: "destructive", title: "Error", description: "Please fill in all fields." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: hrId, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      if (data.user?.role !== "hr") throw new Error("This portal is for HR users only.");
      toast({ title: "Welcome, HR Manager!", description: "Redirecting to your dashboard..." });
      setLocation("/hr/dashboard");
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
            <div className="mx-auto w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">HR Portal</h1>
            <p className="mt-2 text-sm text-gray-500">Sign in to the HR Management Dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">HR ID</label>
              <Input
                value={hrId}
                onChange={e => setHrId(e.target.value)}
                placeholder="EMP1001HR"
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
            <Button type="submit" disabled={loading} className="w-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-700">
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Sign in to HR Portal
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-4">
            HR credentials are managed by the system administrator.
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
