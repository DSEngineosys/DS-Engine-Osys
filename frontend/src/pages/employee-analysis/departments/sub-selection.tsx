import { useLocation, useRoute } from "wouter";
import { FlipchartLayout } from "@/components/flipchart-layout";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useGetDepartments } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SubDepartmentSelection() {
  const [activePhase, setActivePhase] = useState<"employee" | "product">("employee");
  const [, params] = useRoute("/employee-analysis/departments/:deptId/sub");
  const [, setLocation] = useLocation();
  const { data: departments, isLoading } = useGetDepartments();
  const [currentDept, setCurrentDept] = useState<any>(null);

  useEffect(() => {
    if (departments && params?.deptId) {
      const found = departments.find(d => (d.id as any) === params.deptId || String(d.id) === params.deptId);
      setCurrentDept(found);
    }
  }, [departments, params?.deptId]);

  // Use real sub-departments from the API
  const subDepartments = currentDept?.subDepartments ?? [];

  return (
    <FlipchartLayout activePhase={activePhase} onPhaseChange={setActivePhase}>
      <div className="space-y-6">
        <header className="flex items-center gap-4">
          <button onClick={() => window.history.back()} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 capitalize">{currentDept?.name || "Loading..."}</h1>
            <p className="text-slate-500 text-sm font-medium">Select a sub-department to view employees</p>
          </div>
        </header>

        {isLoading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid gap-3">
            {/* "All" option to see all employees in the department */}
            <Card
              className="overflow-hidden border-primary/20 shadow-sm hover:shadow-md transition-all cursor-pointer group rounded-2xl"
              onClick={() => setLocation(`/employee-analysis/employees?departmentId=${params?.deptId}`)}
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">All Sub-Departments</h3>
                  <p className="text-xs text-slate-500 font-medium">View all employees in {currentDept?.name}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ChevronRight className="w-5 h-5 text-primary" />
                </div>
              </CardContent>
            </Card>

            {subDepartments.length > 0 ? subDepartments.map((sub: any) => (
              <Card
                key={sub.id}
                className="overflow-hidden border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group rounded-2xl"
                onClick={() => setLocation(`/employee-analysis/employees?departmentId=${params?.deptId}&subDepartmentId=${sub.id}`)}
              >
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{sub.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">View employees in this sub-department</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="text-center py-12">
                <p className="text-slate-400 font-medium">No sub-departments found for this department.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </FlipchartLayout>
  );
}
