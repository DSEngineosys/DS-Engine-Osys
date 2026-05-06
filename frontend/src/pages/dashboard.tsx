import { Link } from "wouter";
import { AuthenticatedLayout } from "@/components/layout";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Package, CheckSquare, TrendingUp, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { ProfileCard } from "@/components/profile-card";

export default function Dashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of company intelligence and system metrics.</p>
        </div>

        <ProfileCard />

        {/* Top Stats Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-[100px]" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{summary?.totalEmployees || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {summary?.activeEmployees || 0} active currently
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-[100px]" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{summary?.totalTasks || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {summary?.completedTasks || 0} completed, {summary?.pendingTasks || 0} pending
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-[100px]" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{summary?.totalProducts || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {summary?.highDemandProducts || 0} high demand, {summary?.lowDemandProducts || 0} low demand
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-[100px]" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{summary?.avgPerformanceScore ? summary.avgPerformanceScore.toFixed(1) : 0}</div>
                  <p className="text-xs text-muted-foreground">
                    System-wide scoring average
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Two Phases Big Cards */}
        <motion.div 
          className="grid gap-6 md:grid-cols-2 mt-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={itemVariants}>
            <Link href="/employee-analysis">
              <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group bg-gradient-to-br from-white to-primary/5">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Employee Analysis Phase</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Monitor workforce efficiency, department performance, and track detailed task metrics across the organization.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center text-primary font-medium mt-4">
                  Enter Phase <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link href="/product-analysis">
              <Card className="h-full hover:border-secondary-foreground/50 transition-colors cursor-pointer group bg-gradient-to-br from-white to-secondary/30">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Package className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <CardTitle className="text-2xl">Product Analysis Phase</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Leverage predictive ML to analyze market demand, rank product viability, and optimize profit margins with targeted offers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center text-secondary-foreground font-medium mt-4">
                  Enter Phase <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </AuthenticatedLayout>
  );
}
