import { useRoute } from "wouter";
import { FlipchartLayout } from "@/components/flipchart-layout";
import { useGetEmployee, useGetTasks, useGetPerformanceRecords } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, Calendar, Hash, CheckCircle2, Clock, AlertCircle, ArrowLeft } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";

export default function EmployeeDetail() {
  const [, params] = useRoute("/employee-analysis/employees/:id");
  const id = params?.id || "";
  const [activePhase, setActivePhase] = useState<"employee" | "product">("employee");

  const { data: employee, isLoading: isLoadingEmp } = useGetEmployee(id as any);
  const { data: tasks, isLoading: isLoadingTasks } = useGetTasks({ employeeId: id as any });
  const { data: performance, isLoading: isLoadingPerf } = useGetPerformanceRecords({ employeeId: id as any });

  const pendingTasks = tasks?.filter(t => t.status === "pending" || t.status === "in_progress") || [];
  const completedTasks = tasks?.filter(t => t.status === "completed") || [];

  return (
    <FlipchartLayout activePhase={activePhase} onPhaseChange={setActivePhase}>
      <div className="space-y-6 pb-12">
        <header className="flex items-center gap-4">
          <button onClick={() => window.history.back()} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Employee Details</h1>
          </div>
        </header>

        {isLoadingEmp ? (
          <Skeleton className="h-64 w-full rounded-3xl" />
        ) : employee ? (
          <div className="space-y-6">
            <Card className="overflow-hidden border-none shadow-xl bg-white rounded-[2.5rem]">
              <div className="h-24 bg-gradient-to-r from-primary/10 to-pink-100" />
              <div className="px-6 pb-6 relative">
                <div className="flex flex-col items-center -mt-12 mb-4">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-lg bg-white">
                    <AvatarImage src={employee.avatarUrl || undefined} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
                      {employee.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center mt-3">
                    <h2 className="text-2xl font-black text-slate-900 leading-tight">{employee.name}</h2>
                    <p className="text-sm text-slate-500 font-bold tracking-tight">{employee.designation}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-50">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee ID</span>
                      <span className="text-sm font-bold text-slate-700">{employee.employeeId}</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                      <Badge variant="outline" className="w-fit text-[10px] bg-green-50 text-green-700 border-green-100">{employee.status}</Badge>
                   </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-3xl border-slate-100 shadow-sm">
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <Clock className="w-4 h-4" /> Performance History
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performance} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="period" hide />
                        <YAxis domain={[0, 100]} hide />
                        <Tooltip 
                           contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />
                        <Area type="monotone" dataKey="score" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
               </CardContent>
            </Card>

            <div className="grid gap-4">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Recent Tasks</h3>
               {tasks?.slice(0, 3).map(task => (
                 <div key={task.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                       <p className="text-sm font-bold text-slate-800 truncate">{task.title}</p>
                       <p className="text-[10px] text-slate-400 font-medium truncate">{task.description}</p>
                    </div>
                    <Badge className={task.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'}>{task.status}</Badge>
                 </div>
               ))}
            </div>
          </div>
        ) : null}
      </div>
    </FlipchartLayout>
  );
}
