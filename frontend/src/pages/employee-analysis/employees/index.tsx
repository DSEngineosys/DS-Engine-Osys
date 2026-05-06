import { useState } from "react";
import { Link, useLocation } from "wouter";
import { FlipchartLayout } from "@/components/flipchart-layout";
import { useGetEmployees } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronRight, UserCircle, LineChart } from "lucide-react";

export default function EmployeesList() {
  const [activePhase, setActivePhase] = useState<"employee" | "product">("employee");
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();

  const { data: employees, isLoading } = useGetEmployees({ 
    search: search || undefined
  });

  return (
    <FlipchartLayout activePhase={activePhase} onPhaseChange={setActivePhase}>
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-black text-slate-900">Employees</h1>
          <div className="relative mt-4">
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
        ) : (
          <div className="space-y-6">
            {employees?.map(employee => (
              <Card key={employee.id} className="border-slate-100 shadow-sm overflow-hidden rounded-3xl group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="h-14 w-14 ring-2 ring-primary/10">
                      <AvatarImage src={employee.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-black">
                        {employee.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-slate-800 leading-tight">
                        {employee.name}
                      </h3>
                      <p className="text-sm text-slate-500 font-bold">{employee.designation}</p>
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
        )}
      </div>
    </FlipchartLayout>
  );
}
