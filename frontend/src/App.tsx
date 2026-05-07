import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { AdminProvider } from "@/lib/admin";

import NotFound from "@/pages/not-found";
import Splash from "@/pages/splash";
import Terms from "@/pages/terms";
import Onboarding from "@/pages/onboarding";
import Home from "@/pages/home";
import About from "@/pages/about";
import Help from "@/pages/help";
import Login from "@/pages/login";
import Register from "@/pages/register";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminAction from "@/pages/admin/action";
import Hub from "@/pages/hub";
import DepartmentSelection from "@/pages/employee-analysis/departments/selection";
import SubDepartmentSelection from "@/pages/employee-analysis/departments/sub-selection";
import GrowthPage from "@/pages/growth";
import AccountPage from "@/pages/account";
import NotificationsPage from "@/pages/notifications";
import ProductRanking from "@/pages/product-analysis/ranking";
import ProductsList from "@/pages/product-analysis/products/index";
import ProductDetail from "@/pages/product-analysis/products/[id]";
import Offers from "@/pages/product-analysis/offers";
import EmployeeDetail from "@/pages/employee-analysis/employees/[id]";
import EmployeesList from "@/pages/employee-analysis/employees/index";
import Tasks from "@/pages/employee-analysis/tasks";
import PerformanceAnalytics from "@/pages/employee-analysis/performance";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* Public / Onboarding */}
      <Route path="/" component={Splash} />
      <Route path="/terms" component={Terms} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/home" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/help" component={Help} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Admin */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/action" component={AdminAction} />

      {/* Main App Hub */}
      <Route path="/dashboard" component={Hub} />
      <Route path="/growth" component={GrowthPage} />
      <Route path="/account" component={AccountPage} />
      <Route path="/notifications" component={NotificationsPage} />
      
      {/* Employee Analysis Phase Flow */}
      <Route path="/employee-analysis" component={Hub} />
      <Route path="/employee-analysis/departments" component={DepartmentSelection} />
      <Route path="/employee-analysis/departments/:deptId/sub" component={SubDepartmentSelection} />
      <Route path="/employee-analysis/employees" component={EmployeesList} />
      <Route path="/employee-analysis/employees/:id" component={EmployeeDetail} />
      <Route path="/employee-analysis/tasks" component={Tasks} />
      <Route path="/employee-analysis/performance" component={PerformanceAnalytics} />

      {/* Product Analysis Phase Flow */}
      <Route path="/product-analysis" component={Hub} />
      <Route path="/product-analysis/ranking" component={ProductRanking} />
      <Route path="/product-analysis/products" component={ProductsList} />
      <Route path="/product-analysis/products/:id" component={ProductDetail} />
      <Route path="/product-analysis/offers" component={Offers} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AdminProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
        </AdminProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
