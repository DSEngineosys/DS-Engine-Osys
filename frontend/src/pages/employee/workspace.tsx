import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Home, BarChart2, Package, User, LogOut, Camera, Send, Clock, Target, Gift } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Fetchers
const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function EmployeeWorkspace() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("home");
  const [loginTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState("00:00:00");

  useEffect(() => {
    if (!user) {
      setLocation("/employee/login");
    }
  }, [user, setLocation]);

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

  // Sale form state
  const [sellForm, setSellForm] = useState({ productId: "", quantity: 1, customerDetails: "", proofImageUrl: "" });
  const [feedbackForm, setFeedbackForm] = useState({ customerName: "", feedback: "", rating: 5 });

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellForm.proofImageUrl) {
      toast({ variant: "destructive", title: "Proof Required", description: "Please capture or upload the bill proof." });
      return;
    }
    
    try {
      const res = await fetch("/api/employee/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...sellForm, taskId: tasks?.[0]?._id })
      });
      if (!res.ok) throw new Error((await res.json()).error || "Sale failed");
      toast({ title: "Sale Recorded Successfuly" });
      setSellForm({ productId: "", quantity: 1, customerDetails: "", proofImageUrl: "" });
      queryClient.invalidateQueries({ queryKey: ["emp-products"] });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

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

  const handleProofUpload = () => {
    // Mocking camera/upload
    toast({ title: "Camera Activated", description: "Bill captured successfully." });
    setSellForm({ ...sellForm, proofImageUrl: "captured_bill_proof.jpg" });
  };

  if (!user || !profile) return <div className="min-h-screen bg-slate-50 flex justify-center items-center">Loading Workspace...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans relative">
      
      {/* Top Header */}
      <div className="bg-white px-4 py-3 shadow-sm flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">DS</div>
          <span className="font-bold text-slate-800">Workspace</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-sm font-medium text-slate-700">
          <Clock className="w-4 h-4 text-blue-600" /> {elapsedTime}
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        {/* --- HOME TAB --- */}
        {activeTab === "home" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center py-4">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{company?.companyName || "Company"}</h2>
              <p className="text-sm text-slate-500">Employee Workspace</p>
            </div>

            <Card className="border-blue-100 shadow-blue-100/50">
              <CardHeader className="bg-blue-50/50 pb-3"><CardTitle className="text-base flex items-center gap-2"><Target className="w-4 h-4 text-blue-600"/> Current Assigned Task</CardTitle></CardHeader>
              <CardContent className="pt-4">
                {tasks && tasks.length > 0 ? (
                  <div>
                    <h3 className="font-bold">{tasks[0].title}</h3>
                    <p className="text-sm text-slate-600 my-2">{tasks[0].description}</p>
                    <div className="flex justify-between items-center text-xs font-medium">
                      <span className="bg-slate-100 px-2 py-1 rounded">Due: {new Date(tasks[0].dueDate).toLocaleDateString()}</span>
                      <span className={`px-2 py-1 rounded ${tasks[0].status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{tasks[0].status}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-2">No active tasks assigned.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Product Selling Workspace</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSell} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Select Product</label>
                    <select 
                      className="w-full text-sm border p-2 rounded" 
                      value={sellForm.productId} 
                      onChange={e => setSellForm({...sellForm, productId: e.target.value})}
                      required
                    >
                      <option value="">-- Choose Product --</option>
                      {products?.map((p: any) => (
                        <option key={p._id} value={p._id}>{p.name} (Stock: {p.stock} | {p.price}₹)</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-semibold mb-1 block">Quantity</label>
                      <Input type="number" min="1" value={sellForm.quantity} onChange={e => setSellForm({...sellForm, quantity: Number(e.target.value)})} required />
                    </div>
                    <div className="flex-[2]">
                      <label className="text-xs font-semibold mb-1 block">Customer Details</label>
                      <Input type="text" placeholder="Name / Phone" value={sellForm.customerDetails} onChange={e => setSellForm({...sellForm, customerDetails: e.target.value})} required />
                    </div>
                  </div>
                  
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors" onClick={handleProofUpload}>
                    {sellForm.proofImageUrl ? (
                      <div className="text-green-600 font-bold flex items-center justify-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"/> Proof Captured</div>
                    ) : (
                      <div className="text-slate-500 flex flex-col items-center gap-1">
                        <Camera className="w-6 h-6 mb-1"/>
                        <span className="text-sm font-semibold">Tap to Scan/Capture Bill Proof</span>
                        <span className="text-xs">Required for sale</span>
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base font-bold">Complete Sale</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

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

        {/* --- PROFILE TAB --- */}
        {activeTab === "profile" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto mb-4 overflow-hidden">
                  <img src={profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`} alt="avatar" />
                </div>
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

      {/* Floating Bottom Nav */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg bg-slate-900 text-slate-400 rounded-2xl p-2 flex justify-between shadow-xl shadow-slate-900/20">
        {[
          { id: "home", icon: Home, label: "Home" },
          { id: "performance", icon: BarChart2, label: "Performance" },
          { id: "products", icon: Package, label: "Products" },
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
    </div>
  );
}
