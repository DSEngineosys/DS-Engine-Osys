import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Trash2,
  Package,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LogOut,
  Mail,
  Phone,
  Settings,
  Layout,
  Save,
  Send,
  Megaphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  api,
  AdminDashboardData,
  RegistrationRequest,
} from "@/lib/api-extra";
import { useAdmin } from "@/lib/admin";
import { Gift, Timer } from "lucide-react";
import { CountdownTimer } from "@/components/countdown-timer";

const SLIDES = ["DS Engineer Details", "Company Improvement Progress", "Branding & Security", "Communication Hub", "BONUS"] as const;

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { admin, isLoading, logout } = useAdmin();
  const { toast } = useToast();
  const [requests, setRequests] = useState<RegistrationRequest[] | null>(null);
  const [stats, setStats] = useState<AdminDashboardData | null>(null);
  const [slide, setSlide] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !admin) {
      setLocation("/admin/login");
    }
  }, [admin, isLoading, setLocation]);

  async function refreshData() {
    try {
      const [reqs, dash] = await Promise.all([api.registrationRequests(), api.adminDashboard()]);
      setRequests(reqs);
      setStats(dash);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to load",
        description: err instanceof Error ? err.message : "Could not load admin data.",
      });
    }
  }

  useEffect(() => {
    if (admin) void refreshData();
  }, [admin]);


  async function handleAllow(id: string) {
    setBusyId(id);
    try {
      await api.allowRequest(id);
      toast({ title: "Access granted", description: "DS Engineer can now sign in." });
      await refreshData();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed",
        description: err instanceof Error ? err.message : "Try again.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeny(id: string) {
    setBusyId(id);
    try {
      await api.denyRequest(id);
      toast({ title: "Access denied", description: "DS Engineer was rejected." });
      await refreshData();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed",
        description: err instanceof Error ? err.message : "Try again.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to PERMANENTLY delete this request?")) return;
    setBusyId(id);
    try {
      await api.deleteRegistrationRequest(id);
      toast({ title: "Request deleted permanently" });
      await refreshData();
    } catch (err) {
      toast({ variant: "destructive", title: "Delete failed" });
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingCount = stats?.engineers.pending ?? 0;
  const approvedCount = stats?.engineers.approved ?? 0;
  const deniedCount = stats?.engineers.denied ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/40 via-white to-pink-50/30">
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full" 
              onClick={() => window.history.back()}
              aria-label="Back"
            >
              <ChevronLeft className="h-5 w-5 text-slate-500" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-pink-400 text-white flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">Admin Console</p>
                <p className="text-xs text-muted-foreground">DS Engineosys</p>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => void logout()} data-testid="button-admin-logout">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 lg:px-6 py-8 space-y-8">
        {/* Admin Details — upper card */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-pink-100 shadow-md bg-gradient-to-r from-blue-50/60 via-white to-pink-50/60">
            <CardContent className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-pink-400 text-white flex items-center justify-center text-3xl font-bold shadow">
                A
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-primary/70 font-semibold">
                  Logged in as
                </p>
                <h1 className="text-2xl md:text-3xl font-extrabold mt-1">{admin.name}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Username: <span className="font-mono">{admin.username}</span> · Role: System Administrator
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                    {approvedCount} Approved Engineers
                  </Badge>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                    {pendingCount} Pending Requests
                  </Badge>
                  <Badge variant="secondary" className="bg-pink-100 text-pink-700 hover:bg-pink-100">
                    {deniedCount} Denied
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Two slides — DS Engineer Details / Company Improvement Progress */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm">
              {SLIDES.map((label, i) => (
                <button
                  key={label}
                  onClick={() => setSlide(i)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    slide === i
                      ? "bg-primary text-white shadow"
                      : "bg-white border text-muted-foreground hover:bg-slate-50"
                  }`}
                  data-testid={`tab-admin-slide-${i}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSlide((s) => (s - 1 + SLIDES.length) % SLIDES.length)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSlide((s) => (s + 1) % SLIDES.length)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {slide === 0 ? (
              <motion.div
                key="engineers"
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -30, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" /> DS Engineer Details
                    </CardTitle>
                    <CardDescription>
                      Approve or deny DS Engineer registration requests. Approved engineers can sign in
                      and use the platform; denied users are blocked.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {requests === null ? (
                      <div className="flex items-center justify-center py-10 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
                      </div>
                    ) : requests.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground text-sm">
                        No DS Engineer registrations yet.
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {requests.map((r) => (
                          <div
                            key={r.id}
                            className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 border rounded-xl p-4 bg-white hover:border-primary/40 transition-colors"
                            data-testid={`row-request-${r.id}`}
                          >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-pink-100 flex items-center justify-center text-primary font-bold">
                              {r.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold truncate">{r.name}</p>
                                <StatusBadge status={r.status} />
                              </div>
                              <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" /> {r.email}
                                </span>
                                {r.mobile && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> {r.mobile}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(r.createdAt).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2 md:justify-end">
                              <Button
                                size="sm"
                                onClick={() => handleAllow(r.id)}
                                disabled={busyId === r.id || r.status === "approved"}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                                data-testid={`button-allow-${r.id}`}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" /> Allow
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeny(r.id)}
                                disabled={busyId === r.id || r.status === "denied"}
                                className="border-rose-200 text-rose-600 hover:bg-rose-50"
                                data-testid={`button-deny-${r.id}`}
                              >
                                <XCircle className="w-4 h-4 mr-1" /> Deny
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(r.id)}
                                disabled={busyId === r.id}
                                className="text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : slide === 1 ? (
              <motion.div
                key="progress"
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -30, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" /> Company Improvement Progress
                    </CardTitle>
                    <CardDescription>
                      Live snapshot of platform-wide activity managed by your DS Engineers.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3 mb-6">
                      <StatTile
                        label="Employees Tracked"
                        value={stats?.company.employees ?? 0}
                        Icon={Users}
                        color="text-blue-600"
                        bg="bg-blue-50"
                      />
                      <StatTile
                        label="Products Listed"
                        value={stats?.company.products ?? 0}
                        Icon={Package}
                        color="text-pink-600"
                        bg="bg-pink-50"
                      />
                      <StatTile
                        label="Tasks Completed"
                        value={`${stats?.company.tasksCompleted ?? 0} / ${stats?.company.tasksTotal ?? 0}`}
                        Icon={CheckSquare}
                        color="text-emerald-600"
                        bg="bg-emerald-50"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2 text-sm">
                        <span className="font-medium">Overall Task Completion</span>
                        <span className="font-bold text-primary">
                          {stats?.company.progressPercent ?? 0}%
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stats?.company.progressPercent ?? 0}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-primary to-pink-400"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        Improvement reflects how much work the company has shipped against the planned
                        task load. Encourage engineers to drive this up.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : slide === 2 ? (
              <BrandingSettings />
            ) : slide === 3 ? (
              <CommunicationHub />
            ) : (
              <BonusManagement />
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}

function CommunicationHub() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSend() {
    if (!title.trim() || !message.trim()) return;
    setBusy(true);
    try {
      await api.sendBroadcastNotification({ title, message });
      toast({ title: "Broadcast sent!", description: "All engineers will see this message." });
      setTitle("");
      setMessage("");
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to send", description: "Try again later." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      key="comm"
      initial={{ x: 30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -30, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-blue-100 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" /> System Broadcast
          </CardTitle>
          <CardDescription>
            Send a message to all DS-Engineers. This will appear in their "Notification" tab instantly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notif-title">Announcement Title</Label>
            <Input 
              id="notif-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. System Maintenance"
              className="font-bold"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notif-msg">Message Body</Label>
            <textarea 
              id="notif-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="w-full min-h-[120px] rounded-xl bg-slate-50 border-slate-200 p-3 text-sm focus:ring-primary/20 transition-all outline-none border"
            />
          </div>
          <Button 
            className="w-full h-12 rounded-xl font-bold gap-2"
            onClick={handleSend}
            disabled={busy || !title.trim() || !message.trim()}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Broadcast
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function BrandingSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    api.getSettings().then(data => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  async function handleSave(key: string, value: string) {
    setSaving(true);
    try {
      await api.updateSetting(key, value);
      toast({ title: "Settings updated", description: `${key} has been saved.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Save failed", description: "Try again." });
    } finally {
      setSaving(false);
    }
  }


  if (loading) return (
    <div className="flex items-center justify-center py-20 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading platform settings…
    </div>
  );

  return (
    <motion.div
      key="branding"
      initial={{ x: 30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -30, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-primary" /> Branding & Layout
          </CardTitle>
          <CardDescription>
            Customize the platform identity. Changes reflect instantly on the DS Hub.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase">Contact Settings</h3>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Notification Email</Label>
                <div className="flex gap-2">
                  <Input 
                    id="adminEmail"
                    value={settings.adminEmail || ""}
                    onChange={(e) => setSettings(s => ({ ...s, adminEmail: e.target.value }))}
                    placeholder="admin@gmail.com"
                  />
                  <Button onClick={() => handleSave("adminEmail", settings.adminEmail)} disabled={saving}><Save className="h-4 w-4" /></Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminContact">Admin Contact No.</Label>
                <div className="flex gap-2">
                  <Input 
                    id="adminContact"
                    value={settings.adminContact || ""}
                    onChange={(e) => setSettings(s => ({ ...s, adminContact: e.target.value }))}
                    placeholder="+91 9876543210"
                  />
                  <Button onClick={() => handleSave("adminContact", settings.adminContact)} disabled={saving}><Save className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase">SMTP Configuration</h3>
              <div className="space-y-2">
                <Label htmlFor="smtpUser">Sender Email (Gmail / Custom SMTP)</Label>
                <Input 
                  id="smtpUser"
                  value={settings.smtpUser || ""}
                  onChange={(e) => setSettings(s => ({ ...s, smtpUser: e.target.value }))}
                  placeholder="your-email@gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPass">App Password (16 characters)</Label>
                <div className="flex gap-2">
                  <Input 
                    id="smtpPass"
                    type="password"
                    value={settings.smtpPass || ""}
                    onChange={(e) => setSettings(s => ({ ...s, smtpPass: e.target.value }))}
                    placeholder="abcd efgh ijkl mnop"
                  />
                  <Button onClick={() => {
                    handleSave("smtpUser", settings.smtpUser);
                    handleSave("smtpPass", settings.smtpPass);
                  }} disabled={saving}><Save className="h-4 w-4" /></Button>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <p className="text-[11px] font-bold text-slate-700">How to get a Gmail App Password:</p>
                <ol className="text-[10px] text-slate-500 list-decimal list-inside space-y-0.5 font-medium">
                  <li>Go to your Google Account (myaccount.google.com)</li>
                  <li>Enable <strong>2-Step Verification</strong> under Security</li>
                  <li>Search for <strong>App passwords</strong> and create one named "DS Engineosys"</li>
                  <li>Paste the 16-letter code here and click <strong>Save</strong></li>
                </ol>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 grid gap-4 max-w-md">
            <h3 className="text-sm font-bold text-slate-500 uppercase">Branding</h3>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <div className="flex gap-2">
                <Input 
                  id="companyName"
                  value={settings.companyName || ""}
                  onChange={(e) => setSettings(s => ({ ...s, companyName: e.target.value }))}
                  placeholder="e.g. Cosmetic's A1"
                  className="font-bold"
                />
                <Button 
                  onClick={() => handleSave("companyName", settings.companyName)}
                  disabled={saving}
                  className="shrink-0"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">This appears as the main title in the Hub's animated section.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mainProductCategory">Main Product Category</Label>
              <div className="flex gap-2">
                <Input 
                  id="mainProductCategory"
                  value={settings.mainProductCategory || ""}
                  onChange={(e) => setSettings(s => ({ ...s, mainProductCategory: e.target.value }))}
                  placeholder="e.g. Skin Care"
                />
                <Button 
                  onClick={() => handleSave("mainProductCategory", settings.mainProductCategory)}
                  disabled={saving}
                >
                   <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="promotionalVideo">Promotional Video</Label>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <Input 
                    id="promotionalVideo"
                    value={settings.promotionalVideo || ""}
                    onChange={(e) => setSettings(s => ({ ...s, promotionalVideo: e.target.value }))}
                    placeholder="Video URL or Uploaded Data (MP4/WebM)"
                    className="text-[10px] font-mono"
                  />
                  <Button 
                    onClick={() => handleSave("promotionalVideo", settings.promotionalVideo)}
                    disabled={saving}
                    variant="outline"
                  >
                     <Save className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/*"
                    id="video-upload"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      // Check size (20MB limit for Base64 storage)
                      if (file.size > 20 * 1024 * 1024) {
                         toast({ variant: "destructive", title: "Video too large", description: "Please pick a video under 20MB." });
                         return;
                      }

                      setSaving(true);
                      const reader = new FileReader();
                      reader.onload = async () => {
                        const base64 = reader.result as string;
                        try {
                          await api.updateSetting("promotionalVideo", base64);
                          setSettings(s => ({ ...s, promotionalVideo: base64 }));
                          toast({ title: "Video Uploaded Successfully" });
                        } catch (err) {
                          toast({ variant: "destructive", title: "Upload failed" });
                        } finally {
                          setSaving(false);
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <Button 
                    asChild 
                    variant="secondary" 
                    className="w-full gap-2 border-2 border-dashed border-primary/20 h-16 rounded-2xl hover:bg-primary/5"
                  >
                    <label htmlFor="video-upload" className="cursor-pointer">
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Settings className="w-5 h-5 text-primary" />}
                      <div className="text-left">
                         <p className="text-sm font-bold">Upload MP4 / WebM Video File</p>
                         <p className="text-[10px] text-muted-foreground font-medium font-mono">Supports .mp4, .webm (Max 20MB)</p>
                      </div>
                    </label>
                  </Button>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">Uploaded videos will play automatically on the DS Hub home page. <strong>Note:</strong> If using a URL, ensure it is a direct link to an MP4/WebM file.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function BonusManagement() {
  const { toast } = useToast();
  const [bonuses, setBonuses] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bonusAmount, setBonusAmount] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [subDepartment, setSubDepartment] = useState("");
  // Expiry duration state
  const [expiryHours, setExpiryHours] = useState(0);
  const [expiryMinutes, setExpiryMinutes] = useState(0);
  const [expirySeconds, setExpirySeconds] = useState(0);

  const loadData = async () => {
    try {
      const [bList, dList] = await Promise.all([
        api.adminGetBonuses(),
        fetch("/api/departments").then((r) => r.json()),
      ]);
      setBonuses(bList);
      setDepartments(dList);
    } catch (err) {
      console.error("Failed to load bonuses data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !bonusAmount.trim()) return;
    setBusy(true);
    try {
      await api.createBonus({
        title,
        description,
        bonusAmount,
        departmentId: selectedDeptId || undefined,
        subDepartment: subDepartment || undefined,
        expiryHours,
        expiryMinutes,
        expirySeconds,
      });
      toast({ title: "Bonus Offer Created!", description: "DS Engineers will see this offer with a live countdown timer." });
      setTitle("");
      setDescription("");
      setBonusAmount("");
      setSelectedDeptId("");
      setSubDepartment("");
      setExpiryHours(0);
      setExpiryMinutes(0);
      setExpirySeconds(0);
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to create bonus offer", description: err?.message });
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteBonus = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bonus offer?")) return;
    try {
      await api.deleteBonus(id);
      toast({ title: "Bonus Offer Deleted" });
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to delete bonus offer" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading bonus offers…
      </div>
    );
  }

  return (
    <motion.div
      key="bonus-mgmt"
      initial={{ x: 30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -30, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card className="border-pink-100 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-pink-600">
            <Gift className="w-5 h-5" /> Add Bonus Offer
          </CardTitle>
          <CardDescription>
            Create advertisement bonus offers for high-performing employees in specific departments or sub-departments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateBonus} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bonus-title">Bonus Title</Label>
                <Input
                  id="bonus-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q3 Top Performance Bonus"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bonus-amount">Bonus Amount / Reward</Label>
                <Input
                  id="bonus-amount"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(e.target.value)}
                  placeholder="e.g. $500 or 25% Incentive"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bonus-dept">Target Department / Branch</Label>
                <select
                  id="bonus-dept"
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-primary/20 outline-none"
                >
                  <option value="">All Departments</option>
                  {departments.map((d: any) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bonus-subdept">Specific Sub-Department (Optional)</Label>
                <Input
                  id="bonus-subdept"
                  value={subDepartment}
                  onChange={(e) => setSubDepartment(e.target.value)}
                  placeholder="e.g. Software Testing or Quality Assurance"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bonus-desc">Bonus Details & Description</Label>
              <textarea
                id="bonus-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the qualifications, reward criteria, and details..."
                className="w-full min-h-[90px] rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm focus:ring-primary/20 outline-none"
                required
              />
            </div>

            {/* HH:MM:SS Expiry Picker */}
            <div className="space-y-2 bg-blue-50/60 rounded-2xl p-4 border border-blue-100">
              <Label className="flex items-center gap-1.5 text-blue-700 font-bold">
                <Timer className="w-4 h-4" />
                Offer Validity Period (HH : MM : SS)
              </Label>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    max={99}
                    value={expiryHours}
                    onChange={(e) => setExpiryHours(Math.max(0, Math.min(99, Number(e.target.value))))}
                    className="w-20 text-center font-mono font-bold text-lg h-12 rounded-xl bg-white"
                    placeholder="HH"
                  />
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Hours</span>
                </div>
                <span className="text-2xl font-black text-slate-400 pb-4">:</span>
                <div className="flex flex-col items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={expiryMinutes}
                    onChange={(e) => setExpiryMinutes(Math.max(0, Math.min(59, Number(e.target.value))))}
                    className="w-20 text-center font-mono font-bold text-lg h-12 rounded-xl bg-white"
                    placeholder="MM"
                  />
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Minutes</span>
                </div>
                <span className="text-2xl font-black text-slate-400 pb-4">:</span>
                <div className="flex flex-col items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={expirySeconds}
                    onChange={(e) => setExpirySeconds(Math.max(0, Math.min(59, Number(e.target.value))))}
                    className="w-20 text-center font-mono font-bold text-lg h-12 rounded-xl bg-white"
                    placeholder="SS"
                  />
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Seconds</span>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-[11px] text-blue-600 font-medium leading-relaxed">
                    Set the time limit for this offer. When the timer reaches <strong>00:00:00</strong>, the bonus is automatically removed from both the Admin Dashboard and DS Engineer Home Page.
                    Leave all fields at <strong>0</strong> for a permanent offer.
                  </p>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 font-bold gap-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white" disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
              Publish Bonus Offer
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Active Bonus Offers</CardTitle>
        </CardHeader>
        <CardContent>
          {bonuses.length === 0 ? (
            <p className="text-center py-6 text-sm text-slate-400 font-medium">No bonus offers created yet.</p>
          ) : (
            <div className="grid gap-3">
              {bonuses.map((b: any) => (
                <BonusRow key={b._id} bonus={b} onDelete={handleDeleteBonus} onExpire={loadData} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function BonusRow({
  bonus,
  onDelete,
  onExpire,
}: {
  bonus: any;
  onDelete: (id: string) => void;
  onExpire: () => void;
}) {
  return (
    <div className="p-4 border rounded-2xl bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-pink-200 transition-colors">
      <div className="space-y-1 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-extrabold text-slate-900 text-base">{bonus.title}</span>
          <Badge className="bg-pink-100 text-pink-700 font-bold">{bonus.bonusAmount}</Badge>
          <Badge variant="outline" className="text-xs">
            {bonus.departmentName || "All Departments"} {bonus.subDepartment ? `(${bonus.subDepartment})` : ""}
          </Badge>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">{bonus.description}</p>
        <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-2 mt-1">
          <span>Assigned: <strong className="text-slate-600">{bonus.assignedEmployees?.length || 0}</strong></span>
          <span className="w-1 h-1 bg-slate-300 rounded-full" />
          <span className="text-emerald-600">Claimed: <strong>{bonus.assignedEmployees?.filter((a: any) => a.status === "claimed").length || 0}</strong></span>
        </p>
      </div>

      {/* Countdown timer on the right */}
      <div className="flex items-center gap-3 shrink-0">
        <CountdownTimer expiry={bonus.expiry} onExpire={onExpire} />
        <Button
          variant="outline"
          size="sm"
          className="border-rose-200 text-rose-600 hover:bg-rose-50 font-bold"
          onClick={() => onDelete(bonus._id)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") {
    return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Approved</Badge>;
  }
  if (status === "denied") {
    return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">Denied</Badge>;
  }
  return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending</Badge>;
}


function StatTile({
  label,
  value,
  Icon,
  color,
  bg,
}: {
  label: string;
  value: string | number;
  Icon: any;
  color: string;
  bg: string;
}) {
  return (
    <div className={`rounded-xl p-4 ${bg}`}>
      <div className={`w-10 h-10 rounded-lg bg-white flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
