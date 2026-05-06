import { useState } from "react";
import { FlipchartLayout } from "@/components/flipchart-layout";
import { useGetEmployeePerformanceSummary, useGetTaskCompletionStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Target, TrendingUp, Zap } from "lucide-react";
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
  Radar,
  Legend
} from "recharts";

export default function PerformanceAnalytics() {
  const [activePhase, setActivePhase] = useState<"employee" | "product">("employee");
  const { data: deptPerformance, isLoading: isLoadingDept } = useGetEmployeePerformanceSummary();
  const { data: taskStats, isLoading: isLoadingTasks } = useGetTaskCompletionStats();

  return (
    <FlipchartLayout activePhase={activePhase} onPhaseChange={setActivePhase}>
      <div className="space-y-6 pb-12">
        <header className="flex items-center gap-4">
          <button onClick={() => window.history.back()} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Performance AI</h1>
            <p className="text-slate-500 text-sm font-medium">Departmental efficiency analytics</p>
          </div>
        </header>

        <div className="grid gap-6">
          <Card className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden bg-white">
            <CardHeader className="pb-2 border-b border-slate-50">
               <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Dept. Accuracy
               </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoadingDept ? (
                <Skeleton className="h-64 w-full rounded-2xl" />
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptPerformance}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="departmentName" hide />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="avgScore" fill="#ec4899" radius={[12, 12, 12, 12]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
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
                <div className="h-64 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={deptPerformance}>
                         <PolarGrid stroke="#334155" />
                         <PolarAngleAxis dataKey="departmentName" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                         <Radar name="Efficiency" dataKey="efficiency" stroke="#ec4899" fill="#ec4899" fillOpacity={0.6} />
                      </RadarChart>
                   </ResponsiveContainer>
                </div>
             </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <Target className="w-6 h-6 text-blue-500 mb-2" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tasks Met</p>
                <p className="text-2xl font-black text-slate-800">92%</p>
             </div>
             <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <TrendingUp className="w-6 h-6 text-green-500 mb-2" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth</p>
                <p className="text-2xl font-black text-slate-800">+14%</p>
             </div>
          </div>
        </div>
      </div>
    </FlipchartLayout>
  );
}
