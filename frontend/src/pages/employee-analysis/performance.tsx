import { AuthenticatedLayout } from "@/components/layout";
import { useGetEmployeePerformanceSummary, useGetTaskCompletionStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function PerformanceAnalytics() {
  const { data: deptPerformance, isLoading: isLoadingDept } = useGetEmployeePerformanceSummary();
  const { data: taskStats, isLoading: isLoadingTasks } = useGetTaskCompletionStats();

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary-foreground))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Analytics</h1>
          <p className="text-muted-foreground mt-1">Cross-department efficiency and scoring metrics.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Average Scores</CardTitle>
              <CardDescription>Mean performance score by department</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDept ? (
                <Skeleton className="h-[300px] w-full" />
              ) : deptPerformance && deptPerformance.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptPerformance} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                      <XAxis dataKey="departmentName" tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                      <Tooltip 
                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="avgScore" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
                  No department data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Efficiency Radar</CardTitle>
              <CardDescription>Departmental efficiency comparison</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDept ? (
                <Skeleton className="h-[300px] w-full" />
              ) : deptPerformance && deptPerformance.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={deptPerformance}>
                      <PolarGrid stroke="hsl(var(--muted))" />
                      <PolarAngleAxis dataKey="departmentName" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Radar name="Efficiency" dataKey="efficiency" stroke="hsl(var(--secondary-foreground))" fill="hsl(var(--secondary-foreground))" fillOpacity={0.5} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
                  No efficiency data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Task Completion by Department</CardTitle>
              <CardDescription>Volume of completed vs total tasks</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTasks ? (
                <Skeleton className="h-[350px] w-full" />
              ) : taskStats?.byDepartment && taskStats.byDepartment.length > 0 ? (
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={taskStats.byDepartment} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                      <XAxis dataKey="departmentName" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <Tooltip 
                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Legend iconType="circle" />
                      <Bar name="Total Tasks" dataKey="total" fill="hsl(var(--muted-foreground))" fillOpacity={0.3} radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Bar name="Completed Tasks" dataKey="completed" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
                  No task data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
