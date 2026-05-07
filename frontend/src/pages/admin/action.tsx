import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { api } from "@/lib/api-extra";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/lib/admin";
import { Loader2, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminActionPage() {
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const { admin, isLoading } = useAdmin();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "unauthorized">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    const params = new URLSearchParams(search);
    const id = params.get("id");
    const action = params.get("action");

    if (!admin) {
      setStatus("unauthorized");
      return;
    }

    if (!id || !action || (action !== "allow" && action !== "deny")) {
      setStatus("error");
      setError("Invalid parameters");
      return;
    }

    const processAction = async () => {
      try {
        if (action === "allow") {
          await api.allowRequest(id);
        } else {
          await api.denyRequest(id);
        }
        setStatus("success");
        toast({ title: `Action successful: ${action.toUpperCase()}` });
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => setLocation("/admin/dashboard"), 2000);
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to process action");
      }
    };

    void processAction();
  }, [admin, isLoading, search, setLocation, toast]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-slate-600 font-medium">Processing Quick Action...</p>
      </div>
    );
  }

  if (status === "unauthorized") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-6 bg-slate-50 p-4 text-center">
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Admin Authentication Required</h1>
          <p className="text-slate-600 max-w-sm">Please log in to your administrator account to approve or deny this registration request.</p>
        </div>
        <Button onClick={() => setLocation("/admin/login")} className="w-full max-w-xs h-12 text-lg">
          Go to Admin Login
        </Button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-6 bg-slate-50 p-4 text-center">
        <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
          <XCircle className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Action Failed</h1>
          <p className="text-rose-600 font-medium">{error}</p>
        </div>
        <Button onClick={() => setLocation("/admin/dashboard")} variant="outline" className="w-full max-w-xs">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-6 bg-slate-50 p-4 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 animate-bounce">
        <CheckCircle2 className="w-10 h-10" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">Action Completed!</h1>
        <p className="text-slate-600">Redirecting you to the dashboard...</p>
      </div>
    </div>
  );
}
