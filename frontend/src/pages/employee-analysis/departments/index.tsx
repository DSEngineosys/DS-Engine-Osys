import { Link } from "wouter";
import { AuthenticatedLayout } from "@/components/layout";
import { useGetDepartments } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Users } from "lucide-react";

export default function DepartmentsList() {
  const { data: departments, isLoading } = useGetDepartments();

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
            <p className="text-muted-foreground mt-1">View organizational structure and sub-departments.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments?.map(dept => (
              <Link key={dept.id} href={`/employee-analysis/departments/${dept.id}`}>
                <Card className="h-full hover:shadow-md transition-all cursor-pointer group">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">{dept.name}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">{dept.description || "No description provided."}</CardDescription>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mt-4 text-sm font-medium text-slate-600">
                      <Users className="h-4 w-4" />
                      <span>{dept.employeeCount} Employees</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            
            {departments?.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium text-foreground">No Departments Found</h3>
                <p className="text-muted-foreground">The organizational structure is empty.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
