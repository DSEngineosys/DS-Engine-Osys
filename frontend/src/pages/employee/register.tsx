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
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PublicLayout } from "@/components/layout";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-extra";

const STORAGE_KEY = "dsengineosys.pendingEmployeeRegistration";

type Stage = "form" | "waiting" | "set-password" | "denied";

export default function EmployeeRegister() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [stage, setStage] = useState<Stage>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [contactNumber, setContactNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [subDepartment, setSubDepartment] = useState("none");
  const [gender, setGender] = useState("");
  const [locationStr, setLocationStr] = useState("");
  const [employmentType, setEmploymentType] = useState("Fulltime");
  
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [statusName, setStatusName] = useState<string>("");
  const [hrError, setHrError] = useState<string>("");

  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/departments")
      .then((res) => res.json())
      .then(setDepartments)
      .catch(console.error);
  }, []);

  const selectedDeptObj = departments.find((d) => d.id === department);
  const availableSubDepts = selectedDeptObj?.subDepartments || [];

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
        const s = await api.employeeRegistrationStatus(email);
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
    if (!department) {
      toast({ variant: "destructive", title: "Error", description: "Please select a department" });
      return;
    }
    const selectedSubDeptName = availableSubDepts.find((sd: any) => sd.id === subDepartment)?.name || "";
    setSubmitting(true);
    setHrError("");
    try {
      await api.employeeRegisterRequest({
        name,
        email,
        contactNumber: `${countryCode}${contactNumber}`,
        department,
        subDepartmentId: subDepartment,
        gender,
        location: locationStr,
        employmentType
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ email, name }));
      setStage("waiting");
      setStatusName(name);
      toast({
        title: "Request sent to HR",
        description: "Wait for HR approval. We'll let you know here as soon as they decide.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Request failed",
        description: err instanceof Error ? err.message : "Could not send request.",
      });
      if (err instanceof Error && err.message.includes("No HR representative")) {
        setHrError(err.message);
      }
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
      await api.employeeSetPassword({ email, password });
      toast({ title: "Welcome!", description: "Employee password set successfully. You can now log in." });
      localStorage.removeItem(STORAGE_KEY);
      setLocation("/employee/login");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed",
        description: err instanceof Error ? err.message : "Could not set password.",
      });
      setSubmitting(false);
    }
  }

  function handleReset() {
    localStorage.removeItem(STORAGE_KEY);
    setStage("form");
    setEmail("");
    setName("");
    setContactNumber("");
    setDepartment("");
    setSubDepartment("");
    setGender("");
    setLocationStr("");
    setEmploymentType("Fulltime");
  }

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-10 px-4">
        <motion.div
          className="w-full max-w-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-blue-100/50">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg transform rotate-[-5deg] hover:rotate-0 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Employee Portal
              </h1>
              <p className="text-slate-500 mt-2 font-medium">Request HR Access</p>
            </div>

            <AnimatePresence mode="wait">
              {stage === "form" && (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-5"
                  onSubmit={handleRequest}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-slate-700 font-semibold ml-1">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        placeholder="e.g. John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={submitting}
                        className="rounded-xl h-12 bg-slate-50/50 border-slate-200 focus:bg-white transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-700 font-semibold ml-1">
                        Work Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={submitting}
                        className="rounded-xl h-12 bg-slate-50/50 border-slate-200 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold ml-1">Department</Label>
                      <Select 
                        value={department} 
                        onValueChange={(val) => {
                          setDepartment(val);
                          setSubDepartment("none");
                        }} 
                        disabled={submitting} 
                        required
                      >
                        <SelectTrigger className="w-full rounded-xl h-12 bg-slate-50/50 border-slate-200">
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.filter((d) => !d.parentId).map((d: any) => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold ml-1">Sub Department (Optional)</Label>
                      <Select value={subDepartment} onValueChange={setSubDepartment} disabled={submitting || availableSubDepts.length === 0}>
                        <SelectTrigger className="w-full rounded-xl h-12 bg-slate-50/50 border-slate-200">
                          <SelectValue placeholder="Select Sub Department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {availableSubDepts.map((sd: { id: string; name: string }) => (
                            <SelectItem key={sd.id} value={sd.id}>{sd.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="contact" className="text-slate-700 font-semibold ml-1">
                        Contact Number
                      </Label>
                      <div className="flex gap-2">
                        <Select
                          value={countryCode}
                          onValueChange={setCountryCode}
                          disabled={submitting}
                        >
                          <SelectTrigger className="w-[110px] rounded-xl h-12 bg-slate-50/50 border-slate-200">
                            <SelectValue placeholder="Code" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="+1">+1 (US)</SelectItem>
                            <SelectItem value="+44">+44 (UK)</SelectItem>
                            <SelectItem value="+91">+91 (IN)</SelectItem>
                            <SelectItem value="+61">+61 (AU)</SelectItem>
                            <SelectItem value="+971">+971 (AE)</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          id="contact"
                          type="tel"
                          placeholder="123 456 7890"
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          required
                          disabled={submitting}
                          className="flex-1 rounded-xl h-12 bg-slate-50/50 border-slate-200 focus:bg-white transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold ml-1">Gender</Label>
                      <Select value={gender} onValueChange={setGender} disabled={submitting}>
                        <SelectTrigger className="w-full rounded-xl h-12 bg-slate-50/50 border-slate-200">
                          <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-slate-700 font-semibold ml-1">
                        Location
                      </Label>
                      <Input
                        id="location"
                        placeholder="e.g. New York, USA"
                        value={locationStr}
                        onChange={(e) => setLocationStr(e.target.value)}
                        disabled={submitting}
                        className="rounded-xl h-12 bg-slate-50/50 border-slate-200 focus:bg-white transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold ml-1">Employment Type</Label>
                      <Select value={employmentType} onValueChange={setEmploymentType} disabled={submitting}>
                        <SelectTrigger className="w-full rounded-xl h-12 bg-slate-50/50 border-slate-200">
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Fulltime">Fulltime</SelectItem>
                          <SelectItem value="Part-time">Part-time</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                          <SelectItem value="Internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 mt-4 text-white"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Request Employee Access <Send className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </motion.form>
              )}

              {stage === "waiting" && (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6 py-6"
                >
                  <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto border-4 border-amber-100">
                    <Hourglass className="w-10 h-10 text-amber-500 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">Hang tight, {statusName}!</h3>
                    <p className="text-slate-500 mt-2 leading-relaxed">
                      Your request has been sent to your Department HR. This page will automatically update once they review it.
                    </p>
                  </div>
                  <div className="inline-flex items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100 w-full">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin mr-3" />
                    <span className="text-sm font-semibold text-slate-600">Polling for approval...</span>
                  </div>
                  <Button variant="link" onClick={handleReset} className="text-slate-400">
                    Cancel & Start Over
                  </Button>
                </motion.div>
              )}

              {stage === "denied" && (
                <motion.div
                  key="denied"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6 py-6"
                >
                  <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto border-4 border-rose-100">
                    <XCircle className="w-10 h-10 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">Access Denied</h3>
                    <p className="text-slate-500 mt-2 leading-relaxed">
                      Sorry {statusName}, your employee registration request was rejected by HR.
                    </p>
                  </div>
                  <Button onClick={handleReset} variant="outline" className="w-full h-12 rounded-xl font-bold">
                    Start a New Request
                  </Button>
                </motion.div>
              )}

              {stage === "set-password" && (
                <motion.form
                  key="set-password"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-5"
                  onSubmit={handleSetPassword}
                >
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-100">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">You're Approved!</h3>
                    <p className="text-slate-500 mt-1">Set a password to complete your Employee account setup.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold ml-1">Create Password</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={submitting}
                      className="rounded-xl h-12 bg-slate-50/50 border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold ml-1">Confirm Password</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      disabled={submitting}
                      className="rounded-xl h-12 bg-slate-50/50 border-slate-200"
                    />
                  </div>

                  <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-800 font-medium leading-relaxed">
                      Password must be 8-15 characters and include at least one number, one uppercase letter, one lowercase letter, and one special character (@, #, $, %).
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                    disabled={submitting}
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Setup & Login"}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <Link href="/employee/login" className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                ← Back to Employee login
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </PublicLayout>
  );
}
