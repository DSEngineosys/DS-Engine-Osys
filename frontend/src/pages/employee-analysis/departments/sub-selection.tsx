import { useLocation, useRoute } from "wouter";
import { FlipchartLayout } from "@/components/flipchart-layout";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useGetDepartments } from "@workspace/api-client-react";

export default function SubDepartmentSelection() {
  const [activePhase, setActivePhase] = useState<"employee" | "product">("employee");
  const [, params] = useRoute("/employee-analysis/departments/:deptId/sub");
  const [, setLocation] = useLocation();
  const { data: departments } = useGetDepartments();
  const [currentDept, setCurrentDept] = useState<any>(null);

  useEffect(() => {
    if (departments && params?.deptId) {
      const found = departments.find(d => (d.id as any) === params.deptId);
      setCurrentDept(found);
    }
  }, [departments, params?.deptId]);

  const subDepartments: Record<string, any[]> = {
    marketing: [
      { id: "isr", name: "ISR", description: "Inside Sales Representative" },
      { id: "tso", name: "TSO", description: "Territory Sales Officer" },
      { id: "so", name: "SO", description: "Sales Officer" },
    ],
    production: [
      { id: "labour", name: "Labour Team", description: "Production line workforce" },
      { id: "packaging", name: "Packaging Team", description: "Final product packaging" },
      { id: "operator", name: "Machine Operator", description: "Specialized equipment management" },
    ],
    hr: [
      { id: "recruitment", name: "Recruitment", description: "Hiring and onboarding" },
      { id: "payroll", name: "Payroll", description: "Compensation and benefits" },
      { id: "relations", name: "Employee Relations", description: "Workplace culture" },
    ],
  };

  const nameKey = currentDept?.name.toLowerCase().split(" ")[0] || ""; // "marketing", "production", "hr"
  const subs = subDepartments[nameKey] || [];

  return (
    <FlipchartLayout activePhase={activePhase} onPhaseChange={setActivePhase}>
      <div className="space-y-6">
        <header className="flex items-center gap-4">
          <button onClick={() => window.history.back()} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 capitalize">{currentDept?.name || "Loading..."}</h1>
            <p className="text-slate-500 text-sm font-medium">Select a sub-department</p>
          </div>
        </header>

        <div className="grid gap-3">
          {subs.length > 0 ? subs.map((sub) => (
            <Card 
              key={sub.id} 
              className="overflow-hidden border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group rounded-2xl"
              onClick={() => setLocation(`/employee-analysis/employees?sub=${sub.id}`)}
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{sub.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{sub.description}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="text-center py-12">
               <p className="text-slate-400 font-medium">No sub-departments defined for this category.</p>
            </div>
          )}
        </div>
      </div>
    </FlipchartLayout>
  );
}
