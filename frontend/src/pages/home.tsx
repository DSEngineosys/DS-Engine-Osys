import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/layout";
import { motion } from "framer-motion";
import { BarChart3, Users, Target, Shield, ArrowRight, PlayCircle, TrendingUp, Gift } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api-extra";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { CountdownTimer } from "@/components/countdown-timer";

export default function Home() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [bonuses, setBonuses] = useState<any[]>([]);
  const { data: stats } = useGetDashboardSummary();

  const fetchBonuses = async () => {
    try {
      const data = await api.getBonuses();
      setBonuses(data);
    } catch (err) {
      console.error("Failed to fetch bonuses:", err);
    }
  };

  useEffect(() => {
    fetchBonuses();
    api.getSettings().then(settings => {
      if (settings.promotionalVideo) {
        setVideoUrl(settings.promotionalVideo);
      }
    }).catch(console.error);
  }, []);

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="py-20 md:py-32 px-4 lg:px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
              Intelligence for <br />
              <span className="text-primary">Data Science</span> Engineers
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
              DS Engineosys is the premier command center for monitoring employee efficiency and predicting product market performance in real-time.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8" data-testid="link-register-hero">
                  Start Building <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg h-14 px-8" data-testid="link-login-hero">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1 w-full relative"
        >
          <div className="aspect-[4/3] min-h-[320px] rounded-[3rem] bg-[#020617] border border-white/10 shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)] flex items-center justify-center overflow-hidden relative group">
            {/* Bottom-to-top gradient shadow */}
            <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-slate-950/40 to-transparent opacity-90" />
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:32px_32px]" />

            {videoUrl ? (
              <video
                src={videoUrl}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                onError={() => setVideoUrl(null)}
              />
            ) : (
              <div className="relative z-10 w-full h-full p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-black text-2xl tracking-tight flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-pink-500" /> Business Growth Analytics
                    </h3>
                    <span className="px-3 py-1 bg-pink-500/20 text-pink-400 font-mono font-bold text-[10px] rounded-full border border-pink-500/30 uppercase tracking-widest">
                      ML Active
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-emerald-400 font-bold text-[10px] uppercase tracking-[0.2em]">Real-time Performance Optimization</p>
                  </div>
                </div>

                <div className="flex-1 relative my-6 min-h-[160px] flex items-end">
                  {/* Background Bar Chart */}
                  <div className="w-full h-full flex items-end justify-between gap-3 px-2">
                    {[40, 55, 45, 70, 60, 85, 75, 98].map((val, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${val}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className="w-full bg-gradient-to-t from-blue-600/30 to-pink-500/60 rounded-t-lg group-hover/bar:to-pink-400 transition-colors shadow-lg" 
                        />
                        <span className="text-[9px] font-mono text-slate-500">M{i+1}</span>
                      </div>
                    ))}
                  </div>

                  {/* Overlay Glowing Trend Line */}
                  <svg viewBox="0 0 400 160" className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
                    <defs>
                      <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="50%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#f43f5e" />
                      </linearGradient>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    <motion.path
                      d="M 10 140 Q 60 120 100 110 T 200 70 T 300 40 T 390 15"
                      fill="none"
                      stroke="url(#lineGrad)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      filter="url(#glow)"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 2, ease: "easeOut" }}
                    />
                    <motion.circle
                      cx="390"
                      cy="15"
                      r="6"
                      fill="#f43f5e"
                      initial={{ scale: 0 }}
                      animate={{ scale: [1, 1.6, 1] }}
                      transition={{ delay: 2, repeat: Infinity, duration: 1.5 }}
                    />
                  </svg>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-8">
                    <div className="space-y-0.5">
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Growth Velocity</p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-white font-black text-xl tracking-tight">+34.8%</p>
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      </div>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="space-y-0.5">
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">System Score</p>
                      <p className="text-white font-black text-xl tracking-tight">98.4 / 100</p>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="px-3 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 backdrop-blur-md">
                      <p className="text-emerald-400 font-black text-[10px] uppercase tracking-widest">
                        High Yield Active
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Two Phases. One Platform.</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Modeled after leading enterprise structures, we divide operations into two specialized phases for maximum analytical depth.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <div className="bg-white p-8 rounded-2xl border shadow-sm">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Employee Analysis Phase</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Track performance across Production, Marketing, and HR. Monitor task completion rates, identify efficiency bottlenecks, and maintain a high-performing workforce with detailed analytics.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-sm font-medium">Department-level scoring</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-sm font-medium">Individual task tracking</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-sm font-medium">Historical performance records</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-2xl border shadow-sm">
              <div className="w-14 h-14 rounded-xl bg-secondary/30 flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-secondary-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Product Analysis Phase</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Utilize machine learning predictions to rank products by market viability. Identify low-demand inventory, suggest optimal offer percentages, and maximize profit margins.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary-foreground" />
                  <span className="text-sm font-medium">ML-driven demand prediction</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary-foreground" />
                  <span className="text-sm font-medium">Automated product ranking</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary-foreground" />
                  <span className="text-sm font-medium">Targeted discount application</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Active Bonus Offers Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
              <Gift className="w-8 h-8 text-pink-500" /> Active Bonus Offers
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Exclusive performance incentives for DS Engineers. Keep an eye on the countdown!
            </p>
          </div>

          {bonuses.length === 0 ? (
            <div className="text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-500 font-medium">No active bonus offers at the moment.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bonuses.map((bonus: any) => (
                <div key={bonus._id} className="bg-white rounded-3xl p-6 border shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100 mb-2">
                        {bonus.departmentName || "All Departments"} {bonus.subDepartment ? `(${bonus.subDepartment})` : ""}
                      </Badge>
                      <h3 className="text-xl font-bold">{bonus.title}</h3>
                    </div>
                    <div className="bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-xl whitespace-nowrap">
                      {bonus.bonusAmount}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 flex-1">{bonus.description}</p>
                  
                  <div className="pt-4 border-t flex items-center justify-between mt-auto">
                    <CountdownTimer expiry={bonus.expiry} onExpire={fetchBonuses} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
