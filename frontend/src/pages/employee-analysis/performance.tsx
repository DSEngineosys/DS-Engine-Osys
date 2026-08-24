import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { FlipchartLayout } from "@/components/flipchart-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Target, TrendingUp, Zap, Calendar, PlayCircle, Loader2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api-extra";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { DynamicTaskSelector } from "./DynamicTaskSelector";

type TabType = "workspace" | "task-status" | "current-work";

export default function PerformanceAnalytics() {
  const [activePhase, setActivePhase] = useState<"employee" | "product">("employee");
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const employeeId = searchParams.get("id");
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>("workspace");
  const [employee, setEmployee] = useState<any>(null);
  
  // Prediction State
  const [predicting, setPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState<any>(null);
  
  // Tasks State
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!employeeId) {
      toast({ variant: "destructive", title: "Error", description: "No employee selected." });
      window.history.back();
      return;
    }
    fetchEmployeeAndTasks();
  }, [employeeId]);

  const fetchEmployeeAndTasks = async () => {
    try {
      setLoadingTasks(true);
      
      const fullEmployee = await api.getEmployeeById(employeeId!);
      setEmployee(fullEmployee);

      const fetchedTasks = await api.getEmployeeTasks(employeeId!);
      setTasks(fetchedTasks);
      
      // If it's a marketing employee, we might need products
      if (fullEmployee.departmentName === "Marketing Department") {
        try {
          const prods = await api.getProducts();
          setProducts(prods);
        } catch (e) {
          console.error("Failed to fetch products:", e);
        }
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error loading data", description: err.message });
    } finally {
      setLoadingTasks(false);
    }
  };

  const handlePredict = async () => {
    setPredicting(true);
    try {
      const result = await api.predictPerformance(employeeId!);
      setPredictionResult(result);
      setEmployee({ id: result.employeeId, name: result.name });
      toast({ title: "Prediction Complete", description: "ML model successfully analyzed the data." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Prediction Failed", description: err.message });
    } finally {
      setPredicting(false);
    }
  };



  const completedTasks = tasks.filter(t => t.status === "completed" || t.status === "failed"); // history
  const activeTasks = tasks.filter(t => t.status === "pending" || t.status === "in_progress"); // current

  // Mock data for charts
  const barData = [
    { name: 'Mon', score: 85 }, { name: 'Tue', score: 90 },
    { name: 'Wed', score: 75 }, { name: 'Thu', score: 88 },
    { name: 'Fri', score: 92 }
  ];
  
  const radarData = [
    { subject: 'Speed', A: 120, fullMark: 150 },
    { subject: 'Quality', A: 98, fullMark: 150 },
    { subject: 'Comm', A: 86, fullMark: 150 },
    { subject: 'Punctuality', A: 99, fullMark: 150 },
    { subject: 'Teamwork', A: 85, fullMark: 150 },
  ];

  return (
    <FlipchartLayout activePhase={activePhase} onPhaseChange={setActivePhase}>
      <div className="space-y-6 pb-24">
        <header className="flex items-center gap-4">
          <button onClick={() => window.history.back()} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              {employee ? `${employee.name}'s Prediction` : "Employee Prediction"}
            </h1>
            <p className="text-slate-500 text-sm font-medium">AI-driven analysis and task assignment</p>
          </div>
        </header>

        {/* Top Tab Bar */}
        <div className="flex bg-white rounded-2xl border border-slate-100 p-1 shadow-sm overflow-x-auto">
          <button 
            onClick={() => setActiveTab("workspace")}
            className={`flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-colors whitespace-nowrap ${activeTab === 'workspace' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
          >
            Workspace
          </button>
          <button 
            onClick={() => setActiveTab("task-status")}
            className={`flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-colors whitespace-nowrap ${activeTab === 'task-status' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
          >
            Task Status
          </button>
          <button 
            onClick={() => setActiveTab("current-work")}
            className={`flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-colors whitespace-nowrap ${activeTab === 'current-work' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
          >
            Current Work
          </button>
        </div>

        {activeTab === "workspace" && (
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-6">
              <Card className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden bg-white">
                <CardHeader className="pb-2 border-b border-slate-50">
                   <CardTitle className="text-sm font-black text-slate-400 uppercase flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" /> Daily Performance Comparison
                   </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <YAxis hide />
                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="score" fill="#3b82f6" radius={[6, 6, 6, 6]} barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-2xl bg-slate-900 text-white overflow-hidden">
                 <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                       <Zap className="w-5 h-5 text-primary" />
                       <CardTitle className="text-lg font-black">Efficiency Radar</CardTitle>
                    </div>
                 </CardHeader>
                 <CardContent>
                    <div className="h-48 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                             <PolarGrid stroke="#334155" />
                             <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                             <Radar name="Employee" dataKey="A" stroke="#ec4899" fill="#ec4899" fillOpacity={0.6} />
                          </RadarChart>
                       </ResponsiveContainer>
                    </div>
                 </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden bg-gradient-to-br from-indigo-50 to-white">
                <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-6">
                  {!predictionResult ? (
                    <>
                      <style dangerouslySetInnerHTML={{__html: `
                        @keyframes flowLiquid {
                          0% { stroke-dashoffset: 100; }
                          100% { stroke-dashoffset: 0; }
                        }
                        @keyframes blinkWhite {
                          0%, 100% { filter: drop-shadow(0 0 0 rgba(255,255,255,0)); color: #6366f1; }
                          50% { filter: drop-shadow(0 0 15px rgba(255,255,255,0.8)); color: #ffffff; }
                        }
                        .animate-liquid {
                          stroke-dasharray: 20 100;
                          animation: flowLiquid 2s linear infinite;
                        }
                        .animate-brain-blink {
                          animation: blinkWhite 2s ease-in-out infinite;
                        }
                      `}} />
                      <div className="relative w-32 h-32 mb-4 flex items-center justify-center p-4">
                        {/* Custom Animated Brain Chip SVG */}
                        <svg className="absolute inset-0 w-full h-full p-2" viewBox="0 0 100 100" fill="none" stroke="#3b82f6" strokeWidth="2">
                          {/* Traces / Wires */}
                          <path className="animate-liquid" d="M10 20 L30 20 L30 30" />
                          <path className="animate-liquid" d="M10 50 L30 50" />
                          <path className="animate-liquid" d="M10 80 L30 80 L30 70" />
                          <path className="animate-liquid" d="M90 20 L70 20 L70 30" />
                          <path className="animate-liquid" d="M90 50 L70 50" />
                          <path className="animate-liquid" d="M90 80 L70 80 L70 70" />
                          <path className="animate-liquid" d="M50 10 L50 30" />
                          <path className="animate-liquid" d="M50 90 L50 70" />
                          {/* CPU Body */}
                          <rect x="30" y="30" width="40" height="40" rx="4" stroke="#4f46e5" strokeWidth="3" fill="transparent" />
                        </svg>
                        <Brain className="w-12 h-12 relative z-10 animate-brain-blink text-indigo-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">Employee Performance Analysis</h3>
                      </div>
                      <Button onClick={handlePredict} disabled={predicting} size="lg" className="rounded-full w-full max-w-xs h-14 text-base font-bold shadow-lg shadow-indigo-200 mt-4">
                        {predicting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing Data...</> : "Measure"}
                      </Button>
                    </>
                  ) : (
                    <div className="w-full grid grid-cols-2 gap-6 animate-in fade-in zoom-in duration-300">
                      <div className="flex flex-col items-center justify-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <div className="relative w-24 h-24 mb-4">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="none" />
                            <circle cx="50" cy="50" r="40" stroke="#3b82f6" strokeWidth="8" fill="none" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * predictionResult.currentPerformancePercentage) / 100} className="transition-all duration-1000 ease-out" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl font-black text-slate-800">{predictionResult.currentPerformancePercentage}%</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Perf.</span>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center bg-slate-900 p-6 rounded-3xl shadow-lg">
                        <div className={`text-4xl font-black mb-2 ${predictionResult.futurePerformanceClassification === 'High' ? 'text-green-400' : predictionResult.futurePerformanceClassification === 'Medium' ? 'text-yellow-400' : 'text-red-400'}`}>
                          {predictionResult.futurePerformanceClassification}
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Future<br/>Performance</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Task Assignment */}
              <Card className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden bg-white">
                <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                  <CardTitle className="text-base font-bold text-slate-800">Assign New Task</CardTitle>
                  <CardDescription>Select a predefined task based on the employee's department.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                   <DynamicTaskSelector 
                     employee={employee} 
                     products={products} 
                     onTaskAssigned={fetchEmployeeAndTasks} 
                     activeTasksCount={activeTasks.length} 
                   />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "task-status" && (
          <div className="grid gap-4">
            <h2 className="text-xl font-black text-slate-800 mb-2">Task History (Accepted/Rejected)</h2>
            {completedTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-white rounded-3xl border border-slate-100">No task history found.</div>
            ) : (
              completedTasks.map(task => (
                <Card key={task.id} className="rounded-2xl border-slate-100 shadow-sm">
                  <CardContent className="p-5 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-800">{task.title}</h4>
                      <p className="text-sm text-slate-500">{task.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${task.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {task.status.toUpperCase()}
                    </span>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === "current-work" && (
          <div className="grid gap-4">
            <h2 className="text-xl font-black text-slate-800 mb-2">Current Active Work</h2>
            {activeTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-white rounded-3xl border border-slate-100">No active tasks currently.</div>
            ) : (
              activeTasks.map(task => (
                <Card key={task.id} className="rounded-2xl border-slate-100 shadow-sm border-l-4 border-l-primary">
                  <CardContent className="p-5 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-800">{task.title}</h4>
                      <p className="text-sm text-slate-500 line-clamp-1">{task.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs font-medium text-slate-400">
                        {task.dueDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                        <span className="capitalize">Priority: {task.priority}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {task.status === 'in_progress' ? 'IN PROGRESS' : 'PENDING'}
                    </span>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>


    </FlipchartLayout>
  );
}
