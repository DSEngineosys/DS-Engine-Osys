import { Link } from "wouter";
import { AuthenticatedLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building2, CheckSquare, TrendingUp, ArrowRight } from "lucide-react";

export default function EmployeeAnalysisHub() {
  const sections = [
    {
      title: "Departments",
      description: "View structure and top-level performance.",
      icon: Building2,
      href: "/employee-analysis/departments",
      color: "text-blue-600",
      bg: "bg-blue-100"
    },
    {
      title: "Employees",
      description: "Search, filter, and analyze individual profiles.",
      icon: Users,
      href: "/employee-analysis/employees",
      color: "text-indigo-600",
      bg: "bg-indigo-100"
    },
    {
      title: "Tasks & Tracking",
      description: "Monitor workflows and task completion states.",
      icon: CheckSquare,
      href: "/employee-analysis/tasks",
      color: "text-sky-600",
      bg: "bg-sky-100"
    },
    {
      title: "Performance Analytics",
      description: "Deep dive into charts and comparative metrics.",
      icon: TrendingUp,
      href: "/employee-analysis/performance",
      color: "text-cyan-600",
      bg: "bg-cyan-100"
    }
  ];

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Employee Analysis Phase</h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Command center for workforce intelligence. Monitor efficiency, track task execution, and evaluate department performance.
            </p>
          </div>
          <Link href="/employee-analysis/employees">
            <Button size="lg" className="shrink-0" data-testid="btn-analyze-work">
              Analyze Work
            </Button>
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          {sections.map((section, idx) => (
            <Link key={idx} href={section.href}>
              <Card className="h-full hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer border-slate-200">
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 rounded-lg ${section.bg} flex items-center justify-center mb-4`}>
                    <section.icon className={`w-6 h-6 ${section.color}`} />
                  </div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-2">
                    {section.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center text-sm font-medium text-primary mt-2">
                    Open <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-12 bg-white border rounded-2xl p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="relative z-10 max-w-3xl">
            <h2 className="text-2xl font-semibold mb-4">Phase Objective</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              The Employee Analysis Phase is designed to abstract away the noise of daily operations and surface actionable efficiency metrics. By correlating task completion rates with historical performance records, DS Engineers can identify organizational bottlenecks before they impact the bottom line.
            </p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> Live Data Sync
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Predictive Scoring Active
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
