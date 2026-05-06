import { useLocation } from "wouter";
import { FlipchartLayout } from "@/components/flipchart-layout";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Factory, Megaphone, Users2, LayoutGrid } from "lucide-react";
import { useState } from "react";
import { useGetDepartments } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DepartmentSelection() {
  const [activePhase, setActivePhase] = useState<"employee" | "product">("employee");
  const [, setLocation] = useLocation();
  const { data: departments, isLoading } = useGetDepartments();

  const getIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("production")) return Factory;
    if (n.includes("marketing") || n.includes("sales")) return Megaphone;
    if (n.includes("hr") || n.includes("human")) return Users2;
    return LayoutGrid;
  };

  const getColor = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("production")) return "bg-blue-500";
    if (n.includes("marketing") || n.includes("sales")) return "bg-orange-500";
    if (n.includes("hr") || n.includes("human")) return "bg-purple-500";
    return "bg-slate-500";
  };

  return (
    <FlipchartLayout activePhase={activePhase} onPhaseChange={setActivePhase}>
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-black text-slate-900">Departments</h1>
          <p className="text-slate-500 font-medium">Select a department to view sub-divisions</p>
        </header>

        <div className="grid gap-4">
          {isLoading ? (
            [1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
          ) : (
            departments?.map((dept) => {
              const Icon = getIcon(dept.name);
              const colorClass = getColor(dept.name);
              return (
                <Card 
                  key={dept.id} 
                  className="overflow-hidden border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group rounded-2xl"
                  onClick={() => setLocation(`/employee-analysis/departments/${dept.id}/sub`)}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4 p-6">
                      <div className={`w-14 h-14 rounded-2xl ${colorClass} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-black text-slate-800">{dept.name}</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tap to explore</p>
                      </div>
                      <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </FlipchartLayout>
  );
}
