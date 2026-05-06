import { useState } from "react";
import { AuthenticatedLayout } from "@/components/layout";
import { useGetTasks, useGetEmployees } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckSquare, Clock, AlertCircle, PlayCircle, Filter } from "lucide-react";
import { format } from "date-fns";

export default function Tasks() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data: tasks, isLoading } = useGetTasks({
    status: statusFilter !== "all" ? statusFilter as any : undefined
  });

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return <CheckSquare className="w-4 h-4 text-green-500" />;
      case 'in_progress': return <PlayCircle className="w-4 h-4 text-blue-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'critical': return "bg-red-100 text-red-800 border-red-200";
      case 'high': return "bg-orange-100 text-orange-800 border-orange-200";
      case 'medium': return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Task Management</h1>
            <p className="text-muted-foreground mt-1">Track assignments and completion status across the organization.</p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-[200px]">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="border-none shadow-sm">
          <div className="rounded-md border overflow-hidden bg-white">
            <div className="grid grid-cols-12 gap-4 p-4 font-medium bg-slate-50/80 border-b text-sm text-slate-500">
              <div className="col-span-12 md:col-span-5">Task Details</div>
              <div className="col-span-6 md:col-span-3">Assigned To</div>
              <div className="col-span-6 md:col-span-2 text-center">Status</div>
              <div className="hidden md:block col-span-2 text-right">Created</div>
            </div>
            
            {isLoading ? (
              <div className="divide-y">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="p-4 grid grid-cols-12 gap-4">
                    <Skeleton className="col-span-5 h-10" />
                    <Skeleton className="col-span-3 h-10" />
                    <Skeleton className="col-span-2 h-10" />
                    <Skeleton className="col-span-2 h-10" />
                  </div>
                ))}
              </div>
            ) : tasks && tasks.length > 0 ? (
              <div className="divide-y">
                {tasks.map(task => (
                  <div key={task.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 transition-colors group">
                    <div className="col-span-12 md:col-span-5">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getStatusIcon(task.status)}</div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 group-hover:text-primary transition-colors line-clamp-1">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </Badge>
                            {task.dueDate && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-6 md:col-span-3 flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {task.employeeName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-slate-700 truncate">{task.employeeName}</span>
                    </div>
                    
                    <div className="col-span-6 md:col-span-2 text-center">
                      <Badge variant="secondary" className="capitalize">
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="hidden md:flex col-span-2 justify-end text-sm text-slate-500">
                      {format(new Date(task.createdAt), 'MMM d')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <CheckSquare className="mx-auto h-10 w-10 opacity-20 mb-3" />
                <p>No tasks found matching criteria.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
