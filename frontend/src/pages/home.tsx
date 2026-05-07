import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/layout";
import { motion } from "framer-motion";
import { BarChart3, Users, Target, Shield, ArrowRight, PlayCircle, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api-extra";

export default function Home() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
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
              Intelligence for <br/>
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
          <div className="aspect-[4/3] rounded-[3rem] bg-[#020617] border border-white/5 shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)] flex items-center justify-center overflow-hidden relative group">
            {/* Bottom-to-top gradient shadow */}
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 via-transparent to-transparent opacity-60" />
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
            
            {videoUrl ? (
              <video 
                src={videoUrl} 
                className="w-full h-full object-cover"
                autoPlay 
                loop 
                muted 
                playsInline
              />
            ) : (
              <div className="relative z-10 w-full h-full p-10 flex flex-col justify-between">
                <div>
                  <h3 className="text-white font-black text-2xl tracking-tight">Business Growth Projection</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                     <p className="text-red-400 font-bold text-[10px] uppercase tracking-[0.2em]">Real-time Optimization</p>
                  </div>
                </div>

                <div className="flex-1 relative mt-8 mb-4">
                  {/* Background Bars (Subtle) */}
                  <div className="absolute inset-0 flex items-end justify-between gap-4 px-2 opacity-10">
                    {[30, 45, 35, 60, 50, 80, 70, 95].map((val, i) => (
                      <div key={i} className="flex-1 bg-blue-500 rounded-t-lg" style={{ height: `${val}%` }} />
                    ))}
                  </div>

                  {/* Animated Red Growth Line */}
                  <svg viewBox="0 0 400 200" className="w-full h-full overflow-visible">
                    <defs>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    <motion.path
                      d="M 0 180 Q 50 170 80 140 T 160 120 T 240 80 T 320 60 T 400 20"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="4"
                      strokeLinecap="round"
                      filter="url(#glow)"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 2.5, ease: "easeOut" }}
                    />
                    {/* Pulsing endpoint */}
                    <motion.circle
                      cx="400"
                      cy="20"
                      r="6"
                      fill="#ef4444"
                      initial={{ scale: 0 }}
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ delay: 2.5, repeat: Infinity, duration: 1.5 }}
                    />
                  </svg>
                </div>
                
                <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-10">
                    <div className="space-y-1">
                      <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Market Advantage</p>
                      <div className="flex items-center gap-2">
                         <p className="text-white font-black text-2xl tracking-tighter">+48.2%</p>
                         <TrendingUp className="w-4 h-4 text-red-500" />
                      </div>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="space-y-1">
                      <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Efficiency Lift</p>
                      <p className="text-white font-black text-2xl tracking-tighter">x2.4</p>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                     <div className="px-4 py-2 bg-red-500/10 rounded-2xl border border-red-500/20 backdrop-blur-md">
                        <p className="text-red-400 font-black text-[10px] uppercase tracking-widest">Accelerated Scale</p>
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
    </PublicLayout>
  );
}
