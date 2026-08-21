import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { FlipchartLayout } from "@/components/flipchart-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Target, TrendingUp, Zap, Calendar, PlayCircle, Loader2 } from "lucide-react";
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
  
  // New Task Form
  const [taskForm, setTaskForm] = useState({ title: "", description: "", dueDate: "", priority: "medium" });
  const [assigning, setAssigning] = useState(false);

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
      // Fetch Tasks
      const fetchedTasks = await api.getEmployeeTasks(employeeId!);
      setTasks(fetchedTasks);
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

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title) return;
    
    setAssigning(true);
    try {
      await api.assignTask({
        employeeId: employeeId!,
        title: taskForm.title,
        description: taskForm.description,
        dueDate: taskForm.dueDate,
        priority: taskForm.priority,
        status: "pending"
      });
      toast({ title: "Task Assigned", description: "The task was successfully assigned to the employee." });
      setTaskForm({ title: "", description: "", dueDate: "", priority: "medium" });
      fetchEmployeeAndTasks(); // Refresh tasks
    } catch (err: any) {
      toast({ variant: "destructive", title: "Assignment Failed", description: err.message });
    } finally {
      setAssigning(false);
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

        {activeTab === "workspace" && (
          <div className="grid lg:grid-cols-2 gap-6">
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
                      <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center mb-2">
                        <PlayCircle className="w-10 h-10 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">ML Prediction Engine</h3>
                        <p className="text-slate-500 mt-2 text-sm max-w-xs mx-auto">
                          Run the Naive Bayes algorithm on the employee's historical and current data to predict efficiency.
                        </p>
                      </div>
                      <Button onClick={handlePredict} disabled={predicting} size="lg" className="rounded-full w-full max-w-xs h-14 text-base font-bold shadow-lg shadow-indigo-200">
                        {predicting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing Data...</> : "Run Prediction"}
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
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Future<br/>Classification</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Task Assignment */}
              <Card className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden bg-white">
                <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                  <CardTitle className="text-base font-bold text-slate-800">Assign New Task</CardTitle>
                  <CardDescription>Max 3 active tasks allowed per employee.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {activeTasks.length >= 3 ? (
                    <div className="p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-100 text-sm font-medium text-center">
                      Task limit reached. This employee already has 3 active tasks.
                    </div>
                  ) : (
                    <form onSubmit={handleAssignTask} className="space-y-4">
                      <Input 
                        placeholder="Task Title" 
                        value={taskForm.title} 
                        onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                        required
                        className="bg-slate-50 border-slate-100 h-12 rounded-xl"
                      />
                      <Textarea 
                        placeholder="Task details and instructions..." 
                        value={taskForm.description}
                        onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                        className="bg-slate-50 border-slate-100 rounded-xl resize-none h-24"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input 
                          type="date" 
                          value={taskForm.dueDate}
                          onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})}
                          className="bg-slate-50 border-slate-100 h-12 rounded-xl"
                        />
                        <Select value={taskForm.priority} onValueChange={v => setTaskForm({...taskForm, priority: v})}>
                          <SelectTrigger className="bg-slate-50 border-slate-100 h-12 rounded-xl">
                            <SelectValue placeholder="Priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low Priority</SelectItem>
                            <SelectItem value="medium">Medium Priority</SelectItem>
                            <SelectItem value="high">High Priority</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" disabled={assigning} className="w-full h-12 rounded-xl font-bold">
                        {assigning ? "Assigning..." : "Assign Task"}
                      </Button>
                    </form>
                  )}
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

      {/* Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40 md:pl-64 transition-all">
        <div className="max-w-4xl mx-auto flex">
          <button 
            onClick={() => setActiveTab("workspace")}
            className={`flex-1 py-5 text-sm font-bold flex flex-col items-center gap-1 transition-colors ${activeTab === 'workspace' ? 'text-primary border-t-2 border-primary' : 'text-slate-400 hover:text-slate-600 border-t-2 border-transparent'}`}
          >
            Workspace
          </button>
          <button 
            onClick={() => setActiveTab("task-status")}
            className={`flex-1 py-5 text-sm font-bold flex flex-col items-center gap-1 transition-colors ${activeTab === 'task-status' ? 'text-primary border-t-2 border-primary' : 'text-slate-400 hover:text-slate-600 border-t-2 border-transparent'}`}
          >
            Task Status
          </button>
          <button 
            onClick={() => setActiveTab("current-work")}
            className={`flex-1 py-5 text-sm font-bold flex flex-col items-center gap-1 transition-colors ${activeTab === 'current-work' ? 'text-primary border-t-2 border-primary' : 'text-slate-400 hover:text-slate-600 border-t-2 border-transparent'}`}
          >
            Current Work
          </button>
        </div>
      </div>
    </FlipchartLayout>
  );
}
