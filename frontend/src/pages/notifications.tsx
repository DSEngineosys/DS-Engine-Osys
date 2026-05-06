import { useState, useEffect } from "react";
import { FlipchartLayout } from "@/components/flipchart-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, Megaphone, Clock, CheckCircle2, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api-extra";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationsPage() {
  const [activePhase, setActivePhase] = useState<"employee" | "product">("employee");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <FlipchartLayout activePhase={activePhase} onPhaseChange={setActivePhase}>
      <div className="space-y-6 pb-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button onClick={() => window.history.back()} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
               <ArrowLeft className="w-5 h-5 text-slate-600" />
             </button>
             <div>
                <h1 className="text-2xl font-black text-slate-900">Notifications</h1>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                  {unreadCount > 0 ? `${unreadCount} New Messages` : "Stay Updated"}
                </p>
             </div>
          </div>
          {unreadCount > 0 && (
             <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Bell className="w-5 h-5 text-primary" />
             </div>
          )}
        </header>

        <section className="space-y-3">
          {loading ? (
            [1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
               <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                  <BellOff className="w-10 h-10" />
               </div>
               <p className="text-slate-400 font-bold">No notifications yet.</p>
            </div>
          ) : (
            <AnimatePresence>
              {notifications.map((n, idx) => (
                <motion.div
                  key={n._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card 
                    className={`rounded-[2rem] border-none shadow-sm transition-all overflow-hidden relative ${
                      n.isRead ? "bg-white opacity-80" : "bg-gradient-to-r from-blue-50 to-white ring-2 ring-primary/5"
                    }`}
                    onClick={() => !n.isRead && handleMarkAsRead(n._id)}
                  >
                    {!n.isRead && (
                       <div className="absolute top-4 right-4 w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/40" />
                    )}
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-2xl ${n.isRead ? "bg-slate-100 text-slate-400" : "bg-primary text-white shadow-lg"}`}>
                          <Megaphone className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                             <h3 className={`font-black text-lg leading-tight ${n.isRead ? "text-slate-600" : "text-slate-900"}`}>
                               {n.title}
                             </h3>
                          </div>
                          <p className={`text-sm mt-2 font-medium leading-relaxed ${n.isRead ? "text-slate-400" : "text-slate-600"}`}>
                            {n.message}
                          </p>
                          <div className="flex items-center gap-3 mt-4">
                             <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <Clock className="w-3 h-3" />
                                {new Date(n.createdAt).toLocaleDateString()}
                             </div>
                             {n.isRead && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                                   <CheckCircle2 className="w-3 h-3" /> Read
                                </div>
                             )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </section>
      </div>
    </FlipchartLayout>
  );
}
