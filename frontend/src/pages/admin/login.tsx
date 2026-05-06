import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublicLayout } from "@/components/layout";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-extra";
import { useAdmin } from "@/lib/admin";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { refresh } = useAdmin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.adminLogin({ username, password });
      await refresh();
      toast({ title: "Welcome, Admin", description: "Redirecting to your dashboard." });
      setLocation("/admin/dashboard");
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: err instanceof Error ? err.message : "Invalid admin credentials.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PublicLayout>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-pink-100"
        >
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-pink-400 text-white rounded-2xl flex items-center justify-center shadow-md mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-center text-2xl font-extrabold text-gray-900">Admin Sign In</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Restricted access — System Administrator only.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="admin-username">Username</Label>
              <Input
                id="admin-username"
                data-testid="input-admin-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                data-testid="input-admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={submitting}
              data-testid="button-admin-login"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in as Admin"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Hint for the demo: <span className="font-mono">admin</span> / <span className="font-mono">admin@123</span>
          </p>
        </motion.div>
      </div>
    </PublicLayout>
  );
}
