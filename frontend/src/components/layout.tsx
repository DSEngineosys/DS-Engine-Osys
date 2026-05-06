import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Building2, 
  CheckSquare, 
  TrendingUp, 
  Trophy, 
  Tag, 
  LogOut, 
  Menu,
  ChevronLeft
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { 
      label: "Employee Analysis", 
      isSection: true,
      items: [
        { href: "/employee-analysis", label: "Phase Hub", icon: Users },
        { href: "/employee-analysis/departments", label: "Departments", icon: Building2 },
        { href: "/employee-analysis/employees", label: "Employees", icon: Users },
        { href: "/employee-analysis/tasks", label: "Tasks", icon: CheckSquare },
        { href: "/employee-analysis/performance", label: "Performance", icon: TrendingUp },
      ]
    },
    { 
      label: "Product Analysis", 
      isSection: true,
      items: [
        { href: "/product-analysis", label: "Phase Hub", icon: Package },
        { href: "/product-analysis/ranking", label: "Ranking", icon: Trophy },
        { href: "/product-analysis/products", label: "Products", icon: Package },
        { href: "/product-analysis/offers", label: "Offers", icon: Tag },
      ]
    }
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex h-14 items-center px-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-primary">
          <span className="bg-primary text-white p-1 rounded">DS</span> Engineosys
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          {navItems.map((item, i) => {
            if (item.isSection) {
              return (
                <div key={i} className="mb-2">
                  <div className="px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                    {item.label}
                  </div>
                  <div className="grid gap-1">
                    {item.items?.map((subItem) => (
                      <Link key={subItem.href} href={subItem.href}>
                        <div
                          className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                            location === subItem.href || location.startsWith(subItem.href + "/")
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground"
                          }`}
                        >
                          <subItem.icon className="h-4 w-4" />
                          {subItem.label}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <Link key={item.href} href={item.href!}>
                <div
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                    location === item.href
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground"
                  }`}
                >
                  {(() => { const Icon = item.icon; return Icon ? <Icon className="h-4 w-4" /> : null; })()}
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground capitalize">{user.role.replace('_', ' ')}</span>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start text-destructive" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden md:block">
        <SidebarContent />
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[240px]">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          {location !== "/dashboard" && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full" 
              onClick={() => window.history.back()}
              aria-label="Back"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="w-full flex-1">
            {/* Search or breadcrumbs could go here */}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium hidden sm:inline-block">DS Engineosys Workspace</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 bg-gradient-to-b from-pink-100/30 via-white to-white">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-pink-200 via-pink-50 to-white">
      <header className="flex h-16 items-center border-b px-4 lg:px-6 gap-2">
        {useLocation()[0] !== "/home" && useLocation()[0] !== "/" && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full" 
            onClick={() => window.history.back()}
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <Link href="/home" className="flex items-center gap-2 font-bold text-primary text-xl">
          <span className="bg-primary text-white p-1 rounded">DS</span> Engineosys
        </Link>
        <nav className="ml-auto flex items-center gap-4 sm:gap-6">
          <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">
            About
          </Link>
          <Link href="/help" className="text-sm font-medium hover:text-primary transition-colors">
            Help
          </Link>
          <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
            Login
          </Link>
          <Link href="/admin/login" data-testid="link-admin-login">
            <Button variant="outline" size="sm" className="border-primary/40 text-primary hover:bg-primary/5">
              Admin Login
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Register</Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t py-6 px-4 md:px-6 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          © 2025 DS Engineosys. All rights reserved.
        </p>
        <div className="flex gap-4">
          <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link>
          <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link>
        </div>
      </footer>
    </div>
  );
}
