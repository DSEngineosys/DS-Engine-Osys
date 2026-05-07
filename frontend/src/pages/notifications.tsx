import { useState, useEffect } from "react";
import { FlipchartLayout } from "@/components/flipchart-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, Megaphone, Clock, CheckCircle2, ArrowLeft, Check, X, Loader2 } from "lucide-react";
import { api } from "@/lib/api-extra";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function NotificationsPage() {
  const [activePhase, setActivePhase] = useState<"employee" | "product">("employee");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { toast } = useToast();

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

  const handleAction = async (id: string, userId: string, action: "allow" | "deny") => {
    setBusyId(id);
    try {
      if (action === "allow") {
        await api.allowRequest(userId);
        toast({ title: "Access granted", description: "DS Engineer has been approved." });
      } else {
        await api.denyRequest(userId);
        toast({ title: "Access denied", description: "DS Engineer has been rejected." });
      }
      // After action, mark notification as read and maybe remove or update locally
      await handleMarkAsRead(id);
      fetchNotifications(); // Refresh to get latest statuses
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setBusyId(null);
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
                    onClick={() => !n.isRead && n.type !== "registration_request" && handleMarkAsRead(n._id)}
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

                          {n.type === "registration_request" && !n.isRead && (
                            <div className="flex gap-2 mt-4">
                              <Button 
                                size="sm" 
                                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-4 h-9 font-bold text-[10px] uppercase tracking-wider"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction(n._id, n.data?.userId, "allow");
                                }}
                                disabled={busyId === n._id}
                              >
                                {busyId === n._id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
                                Allow
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-rose-200 text-rose-600 hover:bg-rose-50 rounded-full px-4 h-9 font-bold text-[10px] uppercase tracking-wider"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction(n._id, n.data?.userId, "deny");
                                }}
                                disabled={busyId === n._id}
                              >
                                {busyId === n._id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <X className="w-3 h-3 mr-1" />}
                                Deny
                              </Button>
                            </div>
                          )}

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
