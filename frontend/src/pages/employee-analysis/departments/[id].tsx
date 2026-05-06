import { useRoute } from "wouter";
import { AuthenticatedLayout } from "@/components/layout";
import { useGetDepartment, useGetEmployees } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Building2, Users } from "lucide-react";
import { Link } from "wouter";

export default function DepartmentDetail() {
  const [, params] = useRoute("/employee-analysis/departments/:id");
  const id = parseInt(params?.id || "0", 10);

  const { data: department, isLoading: isLoadingDept } = useGetDepartment(id);

  const { data: employees, isLoading: isLoadingEmployees } = useGetEmployees(
    { departmentId: id }
  );

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              {isLoadingDept ? (
                <Skeleton className="h-8 w-48 mb-2" />
              ) : (
                <h1 className="text-3xl font-bold tracking-tight">{department?.name}</h1>
              )}
              {isLoadingDept ? (
                <Skeleton className="h-4 w-64" />
              ) : (
                <p className="text-muted-foreground">{department?.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Department Members</CardTitle>
                <CardDescription>Employees assigned to this unit.</CardDescription>
              </div>
              <Badge variant="secondary" className="px-3 py-1 text-sm">
                <Users className="w-4 h-4 mr-2 inline-block" />
                {employees?.length || 0} Members
              </Badge>
            </CardHeader>
            <CardContent>
              {isLoadingEmployees ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : employees && employees.length > 0 ? (
                <div className="rounded-md border overflow-hidden">
                  <div className="grid grid-cols-12 gap-4 p-4 font-medium bg-slate-50 border-b text-sm text-muted-foreground">
                    <div className="col-span-5 md:col-span-4">Employee</div>
                    <div className="col-span-4 md:col-span-3">Role</div>
                    <div className="col-span-3 md:col-span-2 text-right">Status</div>
                    <div className="hidden md:block col-span-3 text-right">Performance Score</div>
                  </div>
                  <div className="divide-y">
                    {employees.map(employee => (
                      <Link key={employee.id} href={`/employee-analysis/employees/${employee.id}`}>
                        <div className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 transition-colors cursor-pointer group">
                          <div className="col-span-5 md:col-span-4 flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={employee.avatarUrl || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {employee.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium group-hover:text-primary transition-colors">{employee.name}</p>
                              <p className="text-xs text-muted-foreground">{employee.email}</p>
                            </div>
                          </div>
                          <div className="col-span-4 md:col-span-3 text-sm text-slate-600 truncate">
                            {employee.designation}
                          </div>
                          <div className="col-span-3 md:col-span-2 text-right">
                            <Badge 
                              variant={employee.status === "active" ? "default" : "secondary"}
                              className={employee.status === "active" ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}
                            >
                              {employee.status}
                            </Badge>
                          </div>
                          <div className="hidden md:flex col-span-3 justify-end items-center">
                            {employee.performanceScore ? (
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-16 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary" 
                                    style={{ width: `${employee.performanceScore}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">{employee.performanceScore}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">N/A</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No employees found in this department.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
