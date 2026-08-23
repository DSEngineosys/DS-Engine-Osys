import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Home, BarChart2, Package, User, LogOut, Camera, Send, Clock, Target, Gift, ClipboardList, CheckCircle2, XCircle, Check, HelpCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RoleBasedWorkspace } from "@/components/workspace/RoleWorkspaces";
import { EmployeeHelpModal } from "@/components/workspace/EmployeeHelpModal";
import { api } from "@/lib/api-extra";

// Fetchers
const fetcher = (url: string) => fetch(url).then(r => r.json());

import React from "react";
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-red-500 font-mono">
          <h1 className="text-2xl font-bold mb-4">React Error</h1>
          <pre className="bg-red-50 p-4 rounded-xl whitespace-pre-wrap">{this.state.error?.stack || this.state.error?.message}</pre>
        </div>
      );
    }
    return this.props.children; 
  }
}

function TaskCountdown({ dueDate }: { dueDate: string }) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(dueDate).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        return "Time over";
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      
      let res = "";
      if (days > 0) res += `${days}d `;
      res += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      return res;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [dueDate]);

  return (
    <span className="bg-red-50 border border-red-100 text-red-600 px-2 py-1 rounded flex items-center gap-1.5 font-mono font-bold">
      <Clock className="w-3.5 h-3.5"/> 
      {timeLeft}
    </span>
  );
}

export default function EmployeeWorkspaceWrapper() {
  return <ErrorBoundary><EmployeeWorkspace /></ErrorBoundary>;
}

function EmployeeWorkspace() {
  const { user, isLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("home");
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [loginTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    // Only redirect if the session check has finished (not loading) and no user is found
    if (!isLoading && !user) {
      setLocation("/employee/login");
    }
  }, [user, isLoading, setLocation]);



  // Login timer
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.floor((new Date().getTime() - loginTime.getTime()) / 1000);
      const h = String(Math.floor(diff / 3600)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const s = String(diff % 60).padStart(2, '0');
      setElapsedTime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [loginTime]);

  const { data: profile } = useQuery({ queryKey: ["emp-me"], queryFn: () => fetcher("/api/employee/me") });
  const { data: company } = useQuery({ queryKey: ["emp-company"], queryFn: () => fetcher("/api/employee/company") });
  const { data: tasks } = useQuery({ queryKey: ["emp-tasks"], queryFn: () => fetcher("/api/employee/tasks") });
  const { data: products } = useQuery({ queryKey: ["emp-products"], queryFn: () => fetcher("/api/employee/products") });
  const { data: performance } = useQuery({ queryKey: ["emp-performance"], queryFn: () => fetcher("/api/employee/performance") });
  const { data: bonuses } = useQuery({ queryKey: ["emp-bonuses"], queryFn: () => fetcher("/api/employee/bonuses") });

  const queryClient = useQueryClient();

  const updateTaskStatusMutation = useMutation({
    mutationFn: (data: { taskId: string; status: string }) => api.updateTaskStatus(data.taskId, data.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emp-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["emp-performance"] });
      toast({ title: "Task status updated" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to update task" });
    }
  });

  const [feedbackForm, setFeedbackForm] = useState({ customerName: "", feedback: "", rating: 5 });
  const [proofImageUrl, setProofImageUrl] = useState("");

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Avatar upload state
  const avatarInputRef = useRef<HTMLInputElement>(null);



  // Camera functions
  const openCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      toast({ variant: "destructive", title: "Camera Error", description: "Could not access camera. Please allow camera permissions." });
    }
  }, [toast]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setProofImageUrl(dataUrl);
    stopCamera();
    toast({ title: "Proof Captured", description: "Proof photo saved successfully." });
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Avatar upload
  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch("/api/employee/avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatarUrl: base64 })
        });
        if (!res.ok) throw new Error("Upload failed");
        toast({ title: "Profile Photo Updated" });
        queryClient.invalidateQueries({ queryKey: ["emp-me"] });
      } catch (err: any) {
        toast({ variant: "destructive", title: "Error", description: err.message });
      }
    };
    reader.readAsDataURL(file);
  }, [toast, queryClient]);

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/employee/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackForm)
      });
      if (!res.ok) throw new Error((await res.json()).error || "Feedback failed");
      toast({ title: "Feedback Sent to HR" });
      setFeedbackForm({ customerName: "", feedback: "", rating: 5 });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  if (isLoading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500 font-bold">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans relative">
      
      {/* Top Header */}
      <div className="bg-white px-4 py-3 shadow-sm flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowHelpModal(true)} className="w-8 h-8 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">DS</div>
            <span className="font-bold text-slate-800">Workspace</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-sm font-medium text-slate-700">
          <Clock className="w-4 h-4 text-blue-600" /> {elapsedTime}
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        {/* --- HOME TAB --- */}
        {activeTab === "home" && (() => {
          const activeOrPendingTasks = (Array.isArray(tasks) ? tasks : []).filter((t: any) => ["in_progress", "accepted", "pending"].includes(t.status));
          const displayTask = activeOrPendingTasks.find((t: any) => t._id === selectedTaskId) || activeOrPendingTasks[0];
          const isWorkspaceLocked = !displayTask || displayTask.status === "pending";

          return (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center py-4">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{company?.companyName || "Company"}</h2>
              <p className="text-sm text-slate-500">Employee Workspace</p>
            </div>

            {/* Task Selector */}
            {activeOrPendingTasks.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
                {activeOrPendingTasks.map((t: any) => (
                  <button
                    key={t._id}
                    onClick={() => setSelectedTaskId(t._id)}
                    className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold snap-start transition-colors border ${
                      (selectedTaskId === t._id) || (!selectedTaskId && displayTask?._id === t._id)
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200" 
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            )}

            <Card className="border-blue-100 shadow-blue-100/50">
              <CardHeader className="bg-blue-50/50 pb-3"><CardTitle className="text-base flex items-center gap-2"><Target className="w-4 h-4 text-blue-600"/> Selected Assigned Task</CardTitle></CardHeader>
              <CardContent className="pt-4">
                {displayTask ? (
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold">{displayTask.title}</h3>
                      <p className="text-sm text-slate-600 my-1">{displayTask.description}</p>
                      {displayTask.quantity && <p className="text-xs font-bold text-slate-500">Quantity: {displayTask.quantity}</p>}
                    </div>
                    <div className="flex justify-between items-center text-xs font-medium">
                      {displayTask.dueDate ? (
                        <TaskCountdown dueDate={displayTask.dueDate} />
                      ) : (
                        <span className="bg-slate-100 px-2 py-1 rounded">No Deadline</span>
                      )}
                      <span className={`px-2 py-1 rounded uppercase tracking-wider ${displayTask.status === 'completed' ? 'bg-green-100 text-green-700' : displayTask.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{displayTask.status.replace("_", " ")}</span>
                    </div>
                    
                    {displayTask.status === "pending" && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                        <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => updateTaskStatusMutation.mutate({ taskId: displayTask._id, status: "accepted" })} disabled={updateTaskStatusMutation.isPending}>Accept Task</Button>
                        <Button size="sm" variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => updateTaskStatusMutation.mutate({ taskId: displayTask._id, status: "rejected" })} disabled={updateTaskStatusMutation.isPending}>Reject Task</Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-2">No active tasks assigned.</p>
                )}
              </CardContent>
            </Card>

            <Card className={isWorkspaceLocked ? "opacity-60 pointer-events-none relative" : ""}>
              <CardHeader className="pb-3"><CardTitle className="text-base">Role-Specific Workspace</CardTitle></CardHeader>
              <CardContent>
                {isWorkspaceLocked && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl z-10 flex flex-col items-center justify-center">
                    <Target className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm font-bold text-slate-500">{displayTask?.status === "pending" ? "Accept Task to Unlock" : "No Task Assigned"}</p>
                    <p className="text-xs text-slate-400 mt-1 px-6 text-center">{displayTask?.status === "pending" ? "You must accept the selected task above to unlock data entry." : "Workspace data entry is available only when a task is active."}</p>
                  </div>
                )}
                
                <RoleBasedWorkspace 
                  profile={profile} 
                  tasks={displayTask ? [displayTask] : []} 
                  products={products} 
                  openCamera={openCamera}
                  proofImageUrl={proofImageUrl}
                  setProofImageUrl={setProofImageUrl}
                />
              </CardContent>
            </Card>
          </div>
        )})()}

        {/* --- PERFORMANCE TAB --- */}
        {activeTab === "performance" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xl font-bold mb-4">Performance Metrics</h2>
            
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-1">
                      <span>Task Completion</span>
                      <span>{performance?.taskPercent || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${performance?.taskPercent || 0}%` }} />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-1">
                      <span>Performance Points</span>
                      <span>{performance?.performancePoints || 0} / 100</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.min(performance?.performancePoints || 0, 100)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm font-bold mb-1">
                      <span>Bonus Points</span>
                      <span>{performance?.bonusPoints || 0} pts</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div className="bg-pink-500 h-full rounded-full" style={{ width: `${Math.min((performance?.bonusPoints || 0), 100)}%` }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-pink-100 shadow-pink-100/50">
              <CardHeader className="bg-pink-50/50 pb-3"><CardTitle className="text-base flex items-center gap-2"><Gift className="w-4 h-4 text-pink-500"/> Assigned Bonuses</CardTitle></CardHeader>
              <CardContent className="pt-4 space-y-3">
                {bonuses && bonuses.length > 0 ? bonuses.map((b: any) => (
                  <div key={b._id} className="bg-white border rounded p-3 text-sm">
                    <div className="font-bold text-pink-700">{b.title}</div>
                    <div className="text-slate-600 mt-1">{b.description}</div>
                    <div className="mt-2 text-xs font-bold bg-pink-50 inline-block px-2 py-1 rounded">Reward: {b.bonusAmount}</div>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500 text-center">No active bonuses assigned.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Customer Feedback</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleFeedback} className="space-y-3">
                  <Input placeholder="Customer Name (Optional)" value={feedbackForm.customerName} onChange={e => setFeedbackForm({...feedbackForm, customerName: e.target.value})} />
                  <textarea 
                    className="w-full border rounded p-2 text-sm" 
                    rows={3} 
                    placeholder="Enter customer feedback here..."
                    required
                    value={feedbackForm.feedback}
                    onChange={e => setFeedbackForm({...feedbackForm, feedback: e.target.value})}
                  />
                  <Button type="submit" className="w-full" variant="secondary"><Send className="w-4 h-4 mr-2"/> Submit to HR</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* --- PRODUCTS TAB --- */}
        {activeTab === "products" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xl font-bold mb-4">Product Catalog</h2>
            <div className="grid grid-cols-2 gap-3">
              {products?.map((p: any) => (
                <div key={p._id} className="bg-white border rounded-xl p-3 shadow-sm">

                  <h3 className="font-bold text-sm leading-tight mb-1">{p.name}</h3>
                  <div className="text-xs text-slate-500 mb-2">{p.category}</div>
                  <div className="flex justify-between items-center mt-auto pt-2 border-t">
                    <span className="font-black text-slate-800">{p.price}₹</span>
                    <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">Stock: {p.stock}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}



        {/* --- TASKS TAB --- */}
        {activeTab === "tasks" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h2 className="text-xl font-bold text-slate-800">My Tasks</h2>
              <p className="text-sm text-slate-500">Manage and track your assigned work.</p>
            </div>
            
            {/* Pending Tasks */}
            {(Array.isArray(tasks) ? tasks : []).filter((t: any) => t.status === "pending").length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 uppercase">Action Required</h3>
                {(Array.isArray(tasks) ? tasks : []).filter((t: any) => t.status === "pending").map((task: any) => (
                  <Card key={task._id} className="border-l-4 border-l-yellow-400">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{task.title}</h4>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1">{task.description}</p>
                        </div>
                        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">Pending</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => updateTaskStatusMutation.mutate({ taskId: task._id, status: "accepted" })} disabled={updateTaskStatusMutation.isPending}>Accept</Button>
                        <Button size="sm" variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => updateTaskStatusMutation.mutate({ taskId: task._id, status: "rejected" })} disabled={updateTaskStatusMutation.isPending}>Reject</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Active/Accepted Tasks */}
            {(Array.isArray(tasks) ? tasks : []).filter((t: any) => t.status === "accepted").length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 uppercase">In Progress</h3>
                {(Array.isArray(tasks) ? tasks : []).filter((t: any) => t.status === "accepted").map((task: any) => (
                  <Card key={task._id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h4 className="font-semibold">{task.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> Started: {new Date(task.createdAt).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Task History */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 uppercase">Task History</h3>
              {(Array.isArray(tasks) ? tasks : []).filter((t: any) => t.status === "completed" || t.status === "rejected").length === 0 ? (
                <p className="text-sm text-slate-500 italic">No historical tasks.</p>
              ) : (
                <div className="space-y-2">
                  {(Array.isArray(tasks) ? tasks : []).filter((t: any) => t.status === "completed" || t.status === "rejected").map((task: any) => (
                    <div key={task._id} className="bg-white border rounded-xl p-3 shadow-sm text-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">{task.title}</span>
                        {task.status === "completed" ? (
                          <span className="flex items-center text-xs font-bold text-green-600"><CheckCircle2 className="w-3 h-3 mr-1"/> Completed</span>
                        ) : (
                          <span className="flex items-center text-xs font-bold text-red-500"><XCircle className="w-3 h-3 mr-1"/> Rejected</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 space-y-1">
                        <p><strong>Start Date:</strong> {new Date(task.createdAt).toLocaleString()}</p>
                        {task.dueDate && <p><strong>End Date (Due):</strong> {new Date(task.dueDate).toLocaleString()}</p>}
                        {task.completedAt && <p className="text-green-600 font-medium"><strong>Completed:</strong> {new Date(task.completedAt).toLocaleString()}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- PROFILE TAB --- */}
        {activeTab === "profile" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card>
              <CardContent className="pt-6 text-center">
                <div 
                  className="w-20 h-20 bg-slate-200 rounded-full mx-auto mb-4 overflow-hidden relative group cursor-pointer"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <img src={profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`} alt="avatar" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                <p className="text-xs text-blue-500 font-medium mb-2 cursor-pointer" onClick={() => avatarInputRef.current?.click()}>Tap photo to change</p>
                <h2 className="text-xl font-black">{profile.name}</h2>
                <p className="text-sm text-slate-500 font-medium">{profile.designation}</p>
                <div className="inline-block bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded mt-2">{profile.employeeId}</div>
              </CardContent>
            </Card>

            <div className="bg-white border rounded-xl overflow-hidden">
              <div className="p-3 border-b flex justify-between text-sm"><span className="text-slate-500">Department</span><span className="font-semibold">{profile.departmentName} {profile.subDepartment ? `(${profile.subDepartment})` : ""}</span></div>
              <div className="p-3 border-b flex justify-between text-sm"><span className="text-slate-500">Contact</span><span className="font-semibold">{profile.contactNumber || profile.email}</span></div>
              <div className="p-3 border-b flex justify-between text-sm"><span className="text-slate-500">Shift</span><span className="font-semibold">{profile.shift || "Standard"}</span></div>
              <div className="p-3 flex justify-between text-sm"><span className="text-slate-500">Joined</span><span className="font-semibold">{new Date(profile.joiningDate).toLocaleDateString()}</span></div>
            </div>

            <Button onClick={() => { logout(); setLocation("/"); }} variant="destructive" className="w-full h-12 font-bold"><LogOut className="w-4 h-4 mr-2"/> Logout</Button>
          </div>
        )}
      </div>

      {/* Camera Overlay (Google Pay QR-scanner style) */}
      {cameraActive && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-md px-4">
            <p className="text-white text-center text-sm font-bold mb-4">Position the bill in the frame and capture</p>
            <div className="relative rounded-2xl overflow-hidden border-4 border-white/30 shadow-2xl">
              <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-[4/3] object-cover bg-black" />
              {/* Scanner corners */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />
              {/* Scanning line animation */}
              <div className="absolute left-4 right-4 h-0.5 bg-blue-400/60 animate-pulse" style={{ top: "50%" }} />
            </div>
            <div className="flex items-center justify-center gap-6 mt-6">
              <button onClick={stopCamera} className="w-14 h-14 rounded-full bg-white/20 text-white font-bold text-xs flex items-center justify-center border-2 border-white/40 hover:bg-white/30 transition-colors">
                Cancel
              </button>
              <button onClick={capturePhoto} className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-xl shadow-white/20 hover:scale-105 transition-transform">
                <div className="w-16 h-16 rounded-full border-4 border-blue-500 flex items-center justify-center">
                  <Camera className="w-7 h-7 text-blue-600" />
                </div>
              </button>
              <div className="w-14 h-14" /> {/* Spacer for alignment */}
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Floating Bottom Nav */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg bg-slate-900 text-slate-400 rounded-2xl p-2 flex justify-between shadow-xl shadow-slate-900/20">
        {[
          { id: "home", icon: Home, label: "Home" },
          { id: "performance", icon: BarChart2, label: "Performance" },
          { id: "products", icon: Package, label: "Products" },
          { id: "tasks", icon: ClipboardList, label: "Tasks" },
          { id: "profile", icon: User, label: "Profile" }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all ${activeTab === item.id ? "bg-slate-800 text-white" : "hover:text-slate-200 hover:bg-slate-800/50"}`}
          >
            <item.icon className={`w-5 h-5 ${activeTab === item.id ? "scale-110" : ""}`} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      <EmployeeHelpModal open={showHelpModal} onOpenChange={setShowHelpModal} />
    </div>
  );
}
