import { useState } from "react";
import { Link } from "wouter";
import { AuthenticatedLayout } from "@/components/layout";
import { useGetEmployees, useGetDepartments } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, Filter, ArrowUpRight } from "lucide-react";

export default function EmployeesList() {
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("all");

  const { data: departments } = useGetDepartments();
  const { data: employees, isLoading } = useGetEmployees({ 
    search: search || undefined,
    departmentId: departmentId !== "all" ? parseInt(departmentId, 10) : undefined
  });

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground mt-1">Directory of workforce profiles and performance summaries.</p>
        </div>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-slate-50/50"
                  data-testid="input-search-employees"
                />
              </div>
              <div className="w-full sm:w-[240px] flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger className="bg-slate-50/50">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments?.map(d => (
                      <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : employees && employees.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {employees.map(employee => (
              <Link key={employee.id} href={`/employee-analysis/employees/${employee.id}`}>
                <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                        <AvatarImage src={employee.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {employee.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <Badge 
                        variant={employee.status === "active" ? "default" : "secondary"}
                        className={`text-xs ${employee.status === "active" ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}`}
                      >
                        {employee.status}
                      </Badge>
                    </div>
                    
                    <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                      {employee.name}
                    </h3>
                    <p className="text-sm text-slate-500 mb-1">{employee.designation}</p>
                    <p className="text-xs text-muted-foreground truncate mb-4">{employee.departmentName}</p>
                    
                    <div className="pt-4 border-t flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Performance</span>
                        <span className="text-sm font-medium">
                          {employee.performanceScore ? `${employee.performanceScore}/100` : 'N/A'}
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed">
            <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No Employees Found</h3>
            <p className="text-muted-foreground">Adjust your search or filter criteria.</p>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
