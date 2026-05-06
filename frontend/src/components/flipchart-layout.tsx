import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  Building2, 
  Bell, 
  User, 
  TrendingUp, 
  Tag,
  LogOut,
  ChevronLeft
} from "lucide-react";
import { api } from "@/lib/api-extra";

interface FlipchartLayoutProps {
  children: ReactNode;
  activePhase: "employee" | "product";
  onPhaseChange: (phase: "employee" | "product") => void;
}

export function FlipchartLayout({ children, activePhase, onPhaseChange }: FlipchartLayoutProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    api.getSettings()
      .then(setSettings)
      .catch(err => console.error("Failed to load settings:", err));
  }, []);

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  const footerItems = [
    { id: "home", label: "Home", icon: Home, href: "/dashboard" },
    { id: "department", label: activePhase === "employee" ? "Department" : "Offer%", icon: activePhase === "employee" ? Building2 : Tag, href: activePhase === "employee" ? "/employee-analysis/departments" : "/product-analysis/offers" },
    { id: "notification", label: "Notification", icon: Bell, href: "/notifications" },
    { id: "account", label: "Account", icon: User, href: "/account" },
    { id: "growth", label: "Growth", icon: TrendingUp, href: "/growth" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-200 via-pink-50 to-white flex flex-col pb-24 overflow-x-hidden font-sans">
      {/* Top Toggle Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-pink-100/50 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center relative">
          {/* Back Button */}
          {location !== "/dashboard" && (
            <button 
              onClick={() => window.history.back()}
              className="absolute left-0 p-2 hover:bg-slate-100 rounded-full transition-colors group"
              aria-label="Go back"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600 group-hover:text-primary transition-colors" />
            </button>
          )}

          <div className="flex-1 flex justify-center">
          <div className="bg-slate-100 p-1 rounded-full flex items-center shadow-inner w-full max-w-[300px]">
            <button
              onClick={() => onPhaseChange("employee")}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-bold transition-all duration-300 ${
                activePhase === "employee" 
                  ? "bg-primary text-white shadow-md" 
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Employee
            </button>
            <button
              onClick={() => onPhaseChange("product")}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-bold transition-all duration-300 ${
                activePhase === "product" 
                  ? "bg-primary text-white shadow-md" 
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Product
            </button>
          </div>
        </div>
      </div>
    </header>

      {/* Main Content with Page Transitions */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={location + activePhase}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Footer */}
      <nav className="fixed bottom-6 left-4 right-4 z-50">
        <div className="max-w-md mx-auto bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-3xl px-2 py-2 flex items-center justify-around">
          {footerItems.map((item) => {
            const isActive = location === item.href;
            return (
              <button
                key={item.id}
                onClick={() => setLocation(item.href)}
                className="flex flex-col items-center gap-1 py-2 px-3 relative group"
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-tab"
                    className="absolute inset-0 bg-primary/10 rounded-2xl -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon className={`w-6 h-6 transition-colors ${isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600"}`} />
                <span className={`text-[10px] font-bold uppercase tracking-tight transition-colors ${isActive ? "text-primary" : "text-slate-400"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
