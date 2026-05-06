import { useState } from "react";
import { FlipchartLayout } from "@/components/flipchart-layout";
import { useGetTasks } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckSquare, Clock, AlertCircle, PlayCircle, ArrowLeft } from "lucide-react";

export default function Tasks() {
  const [activePhase, setActivePhase] = useState<"employee" | "product">("employee");
  const { data: tasks, isLoading } = useGetTasks();

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return <CheckSquare className="w-5 h-5 text-green-500" />;
      case 'in_progress': return <PlayCircle className="w-5 h-5 text-blue-500" />;
      default: return <Clock className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <FlipchartLayout activePhase={activePhase} onPhaseChange={setActivePhase}>
      <div className="space-y-6 pb-12">
        <header className="flex items-center gap-4">
          <button onClick={() => window.history.back()} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Task Hub</h1>
          </div>
        </header>

        {isLoading ? (
          <div className="space-y-4">
             {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {tasks?.map(task => (
              <Card key={task.id} className="rounded-3xl border-slate-100 shadow-sm overflow-hidden group">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="mt-1">{getStatusIcon(task.status)}</div>
                  <div className="flex-1 min-w-0">
                     <h3 className="font-bold text-slate-800 leading-tight mb-1 group-hover:text-primary transition-colors">{task.title}</h3>
                     <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary" className="text-[10px] font-black uppercase px-2 py-0 bg-slate-100 text-slate-500 border-none">{task.priority}</Badge>
                        <span className="text-[10px] font-bold text-slate-400">{task.employeeName}</span>
                     </div>
                     <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{task.description}</p>
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
