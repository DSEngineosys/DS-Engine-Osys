import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { FlipchartLayout } from "@/components/flipchart-layout";
import { useGetEmployees } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronRight, UserCircle, LineChart, ArrowLeft, Building2, Layers } from "lucide-react";

export default function EmployeesList() {
  const [activePhase, setActivePhase] = useState<"employee" | "product">("employee");
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();
  const searchString = useSearch();

  // Parse departmentId and subDepartmentId from URL query params
  const params = new URLSearchParams(searchString);
  const departmentId = params.get("departmentId") || undefined;
  const subDepartmentId = params.get("subDepartmentId") || undefined;

  const { data: employees, isLoading } = useGetEmployees({
    departmentId,
    subDepartmentId,
    search: search || undefined,
  } as any);

  // Get context label from first employee (or from API data)
  const deptName = employees?.[0]?.departmentName;
  const subDeptName = employees?.[0]?.subDepartmentName;

  const contextLabel = subDepartmentId && subDeptName
    ? `${deptName} → ${subDeptName}`
    : departmentId && deptName
    ? deptName
    : "All Employees";

  return (
    <FlipchartLayout activePhase={activePhase} onPhaseChange={setActivePhase}>
      <div className="space-y-6">
        <header>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => window.history.back()}
              className="p-2 bg-white rounded-xl shadow-sm border border-slate-100"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Employees</h1>
              {(departmentId || subDepartmentId) && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  {subDepartmentId ? (
                    <Layers className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                  )}
                  <span className="text-xs font-bold text-primary">{contextLabel}</span>
                </div>
              )}
            </div>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 bg-white border-slate-200 rounded-2xl shadow-sm focus:ring-primary/20"
            />
          </div>
        </header>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        ) : employees && employees.length > 0 ? (
          <div className="space-y-4">
            {employees.map((employee: any) => (
              <Card key={employee.id} className="border-slate-100 shadow-sm overflow-hidden rounded-3xl group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-14 w-14 ring-2 ring-primary/10">
                      <AvatarImage src={employee.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-black">
                        {employee.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-black text-slate-800 leading-tight truncate">
                        {employee.name}
                      </h3>
                      <p className="text-sm text-slate-500 font-bold">{employee.designation}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {employee.departmentName && (
                          <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-100">
                            {employee.departmentName}
                          </Badge>
                        )}
                        {employee.subDepartmentName && (
                          <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-100">
                            {employee.subDepartmentName}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setLocation(`/employee-analysis/employees/${employee.id}`)}
                      className="flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-primary hover:text-white transition-all rounded-2xl text-slate-600 font-bold text-sm shadow-sm"
                    >
                      <UserCircle className="w-4 h-4" />
                      Details
                    </button>
                    <button
                      onClick={() => setLocation(`/employee-analysis/performance?id=${employee.id}`)}
                      className="flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-primary hover:text-white transition-all rounded-2xl text-slate-600 font-bold text-sm shadow-sm"
                    >
                      <LineChart className="w-4 h-4" />
                      Prediction
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <UserCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-lg font-bold text-slate-600">No Employees Found</h3>
            <p className="text-slate-400 text-sm mt-1">
              {subDepartmentId
                ? "No active employees in this sub-department yet."
                : departmentId
                ? "No active employees in this department yet."
                : "No employees match your search."}
            </p>
          </div>
        )}
      </div>
    </FlipchartLayout>
  );
}
