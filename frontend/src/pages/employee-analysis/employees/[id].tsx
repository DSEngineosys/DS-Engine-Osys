import { useRoute } from "wouter";
import { AuthenticatedLayout } from "@/components/layout";
import { useGetEmployee, useGetTasks, useGetPerformanceRecords } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, Calendar, Hash, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function EmployeeDetail() {
  const [, params] = useRoute("/employee-analysis/employees/:id");
  const id = params?.id || "";

  const { data: employee, isLoading: isLoadingEmp } = useGetEmployee(id);

  const { data: tasks, isLoading: isLoadingTasks } = useGetTasks(
    { employeeId: id }
  );

  const { data: performance, isLoading: isLoadingPerf } = useGetPerformanceRecords(
    { employeeId: id }
  );

  const pendingTasks = tasks?.filter(t => t.status === "pending" || t.status === "in_progress") || [];
  const completedTasks = tasks?.filter(t => t.status === "completed") || [];

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {isLoadingEmp ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : employee ? (
          <Card className="overflow-hidden border-none shadow-md bg-white">
            <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/5 to-secondary/10" />
            <div className="px-6 sm:px-10 pb-8 relative">
              <div className="flex flex-col sm:flex-row gap-6 sm:items-end -mt-16 mb-6">
                <Avatar className="h-32 w-32 border-4 border-white shadow-lg bg-white">
                  <AvatarImage src={employee.avatarUrl || undefined} />
                  <AvatarFallback className="text-4xl bg-slate-100 text-slate-600 font-bold">
                    {employee.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">{employee.name}</h1>
                      <p className="text-lg text-slate-600 font-medium">{employee.designation}</p>
                    </div>
                    <Badge 
                      className={`text-sm px-4 py-1.5 ${employee.status === "active" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}`}
                    >
                      {employee.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-500"><Building2 className="w-4 h-4" /></div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</p>
                    <p className="text-sm font-medium">{employee.departmentName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-500"><Mail className="w-4 h-4" /></div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</p>
                    <p className="text-sm font-medium truncate">{employee.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-500"><Calendar className="w-4 h-4" /></div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Joined</p>
                    <p className="text-sm font-medium">{new Date(employee.joiningDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-500"><Hash className="w-4 h-4" /></div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employee ID</p>
                    <p className="text-sm font-medium">{employee.employeeId}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trend</CardTitle>
                <CardDescription>Historical scoring over time.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPerf ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : performance && performance.length > 0 ? (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                        <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{fontSize: 12}} />
                        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{fontSize: 12}} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="score" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorScore)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground bg-slate-50/50 rounded-xl border border-dashed">
                    No performance records available.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Tasks</CardTitle>
                  <CardDescription>Latest assigned items.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingTasks ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : tasks && tasks.length > 0 ? (
                  <div className="space-y-3">
                    {tasks.slice(0, 5).map(task => (
                      <div key={task.id} className="flex items-start justify-between p-3 rounded-lg border bg-slate-50/50">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{task.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                        </div>
                        <Badge variant="outline" className={`shrink-0 ml-4
                          ${task.status === 'completed' ? 'border-green-200 text-green-700 bg-green-50' : 
                            task.status === 'in_progress' ? 'border-blue-200 text-blue-700 bg-blue-50' : 
                            task.status === 'failed' ? 'border-red-200 text-red-700 bg-red-50' : ''}
                        `}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No tasks assigned.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                      <circle 
                        cx="50" cy="50" r="45" 
                        fill="none" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth="8" 
                        strokeDasharray={`${(employee?.performanceScore || 0) * 2.83} 283`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-3xl font-bold">{employee?.performanceScore || 0}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Overall performance score out of 100
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Task Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-md text-slate-500 shadow-sm"><CheckCircle2 className="w-4 h-4 text-green-500" /></div>
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                  <span className="text-lg font-bold">{completedTasks.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-md text-slate-500 shadow-sm"><Clock className="w-4 h-4 text-blue-500" /></div>
                    <span className="text-sm font-medium">Pending/Active</span>
                  </div>
                  <span className="text-lg font-bold">{pendingTasks.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-md text-slate-500 shadow-sm"><AlertCircle className="w-4 h-4 text-red-500" /></div>
                    <span className="text-sm font-medium">Failed</span>
                  </div>
                  <span className="text-lg font-bold">{tasks?.filter(t => t.status === "failed").length || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
