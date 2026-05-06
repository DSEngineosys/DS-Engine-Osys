import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Send,
  Mail,
  CheckCircle2,
  XCircle,
  Hourglass,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PublicLayout } from "@/components/layout";
import { useToast } from "@/hooks/use-toast";
import { api, RegistrationStatus } from "@/lib/api-extra";

const STORAGE_KEY = "dsengineosys.pendingRegistration";

type Stage = "form" | "waiting" | "set-password" | "denied";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [stage, setStage] = useState<Stage>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [isDsEngineer, setIsDsEngineer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [statusName, setStatusName] = useState<string>("");

  // Resume an in-progress request from a previous visit.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { email: string; name: string };
      if (parsed.email) {
        setEmail(parsed.email);
        setName(parsed.name);
        setStatusName(parsed.name);
        setStage("waiting");
      }
    } catch {
      // ignore
    }
  }, []);

  // Poll registration status while waiting / once approved.
  useEffect(() => {
    if (stage !== "waiting") return;
    let alive = true;

    async function tick() {
      try {
        const s = await api.registrationStatus(email);
        if (!alive) return;
        setStatusName(s.name);
        if (s.status === "approved") {
          setStage("set-password");
        } else if (s.status === "denied") {
          setStage("denied");
        }
      } catch {
        // ignore — keep polling
      }
    }

    void tick();
    const t = setInterval(tick, 4000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [stage, email]);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!isDsEngineer) {
      toast({
        variant: "destructive",
        title: "DS Engineer required",
        description: "Tick the DS Engineer checkbox to request access.",
      });
      return;
    }
    setSubmitting(true);
    try {
      const fullMobile = `${countryCode} ${mobile}`;
      await api.registerRequest({ name, email, mobile: fullMobile, isDsEngineer });
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ email, name }));
      setStage("waiting");
      setStatusName(name);
      toast({
        title: "Request sent to Admin",
        description: "Wait for Admin Access. We'll let you know here as soon as they decide.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Request failed",
        description: err instanceof Error ? err.message : "Could not send request.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    const isStrong = 
      password.length >= 8 && 
      password.length <= 15 && 
      /[0-9]/.test(password) && 
      /[A-Z]/.test(password) && 
      /[a-z]/.test(password) && 
      /[@#$%]/.test(password);

    if (!isStrong) {
      toast({
        variant: "destructive",
        title: "Weak password",
        description: "Password must satisfy all requirements (8-15 chars, number, uppercase, lowercase, and special character).",
      });
      return;
    }
    if (password !== confirm) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please re-enter the same password.",
      });
      return;
    }
    setSubmitting(true);
    try {
      await api.setPassword({ email, password });
      localStorage.removeItem(STORAGE_KEY);
      toast({
        title: "Account ready",
        description: "Password generated. You can now sign in.",
      });
      setLocation("/login");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not set password",
        description: err instanceof Error ? err.message : "Try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    setStage("form");
    setName("");
    setEmail("");
    setMobile("");
    setIsDsEngineer(false);
    setPassword("");
    setConfirm("");
  }

  return (
    <PublicLayout>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-blue-100">
          <AnimatePresence mode="wait">
            {stage === "form" && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <div>
                  <h2 className="text-center text-3xl font-extrabold text-gray-900">
                    Create your account
                  </h2>
                  <p className="mt-2 text-center text-sm text-muted-foreground">
                    Join the DS Engineosys platform — Admin approval required.
                  </p>
                </div>

                <form onSubmit={handleRequest} className="mt-8 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      data-testid="input-register-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      data-testid="input-register-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="engineer@company.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile No.</Label>
                    <div className="flex gap-2">
                      <div className="w-24">
                        <Select value={countryCode} onValueChange={setCountryCode}>
                          <SelectTrigger className="rounded-xl border-slate-200">
                            <SelectValue placeholder="Code" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="+91">🇮🇳 +91</SelectItem>
                            <SelectItem value="+1">🇺🇸 +1</SelectItem>
                            <SelectItem value="+44">🇬🇧 +44</SelectItem>
                            <SelectItem value="+971">🇦🇪 +971</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        id="mobile"
                        className="flex-1"
                        data-testid="input-register-mobile"
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="9876543210"
                        required
                      />
                    </div>
                  </div>

                  <label className="flex items-start gap-3 rounded-lg border bg-blue-50/40 p-3 cursor-pointer">
                    <Checkbox
                      checked={isDsEngineer}
                      onCheckedChange={(v) => setIsDsEngineer(Boolean(v))}
                      data-testid="checkbox-ds-engineer"
                      className="mt-0.5"
                    />
                    <div className="text-sm">
                      <p className="font-semibold text-gray-900">DS Engineer</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        I am applying for DS Engineer access. The Admin will review my request.
                      </p>
                    </div>
                  </label>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base"
                    disabled={submitting}
                    data-testid="button-send-mail-register"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending…
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" /> Send Mail to REGISTER
                      </>
                    )}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary hover:underline font-medium">
                      Sign in
                    </Link>
                  </p>
                </form>
              </motion.div>
            )}

            {stage === "waiting" && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="text-center py-6"
              >
                <div className="mx-auto w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-5">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  >
                    <Hourglass className="w-9 h-9 text-amber-500" />
                  </motion.div>
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900">Wait for Admin Access</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Hi <span className="font-semibold text-gray-900">{statusName || name}</span>, your
                  request was delivered to the Admin's inbox. We'll automatically unlock the next step
                  the moment they Allow you.
                </p>
                <div className="mt-6 rounded-xl border bg-blue-50/40 p-4 text-left text-sm">
                  <p className="flex items-center gap-2 text-blue-800 font-medium">
                    <Mail className="w-4 h-4" /> Request sent
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{email}</p>
                </div>
                <Button
                  variant="outline"
                  className="mt-6 w-full"
                  onClick={reset}
                  data-testid="button-cancel-waiting"
                >
                  Cancel & start over
                </Button>
              </motion.div>
            )}

            {stage === "set-password" && (
              <motion.div
                key="set-password"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <div className="text-center mb-6">
                  <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900">Admin Allowed You</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Generate your password to activate your DS Engineer account.
                  </p>
                </div>

                <form onSubmit={handleSetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-readonly">Email</Label>
                    <Input id="email-readonly" value={email} readOnly className="bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      data-testid="input-new-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter strong password"
                      required
                    />
                  </div>
                  
                  {/* Password Conditions */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Requirements</p>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { label: "8-15 Characters", valid: password.length >= 8 && password.length <= 15 },
                        { label: "At least one Number (0-9)", valid: /[0-9]/.test(password) },
                        { label: "Uppercase & Lowercase Letter", valid: /[A-Z]/.test(password) && /[a-z]/.test(password) },
                        { label: "One Special Character (@, #, $, %)", valid: /[@#$%]/.test(password) },
                      ].map((cond, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${cond.valid ? "bg-green-500 border-green-500" : "bg-white border-slate-300"}`}>
                            {cond.valid && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <span className={`text-xs font-medium ${cond.valid ? "text-green-600" : "text-slate-500"}`}>{cond.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      data-testid="input-confirm-password"
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repeat password"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 text-base bg-gradient-to-r from-primary to-pink-500 hover:opacity-90"
                    disabled={submitting}
                    data-testid="button-generate-password"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving…
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="mr-2 h-5 w-5" /> Generate password & continue
                      </>
                    )}
                  </Button>
                </form>
              </motion.div>
            )}

            {stage === "denied" && (
              <motion.div
                key="denied"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="text-center py-6"
              >
                <div className="mx-auto w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-5">
                  <XCircle className="w-10 h-10 text-rose-500" />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900">Admin DENIED your request</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Unfortunately the Admin did not approve your DS Engineer access at this time. You'll
                  receive a notification if the decision changes.
                </p>
                <Button
                  variant="outline"
                  className="mt-6 w-full"
                  onClick={reset}
                  data-testid="button-restart-after-deny"
                >
                  Start a new request
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PublicLayout>
  );
}

// satisfy unused-import linter when Stage is read
export type RegisterStage = RegistrationStatus;
