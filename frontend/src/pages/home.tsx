import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/layout";
import { motion } from "framer-motion";
import { BarChart3, Users, Target, Shield, ArrowRight } from "lucide-react";

export default function Home() {
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
          <div className="aspect-[4/3] rounded-xl bg-gradient-to-tr from-primary/5 to-secondary/30 border shadow-2xl flex items-center justify-center p-8 overflow-hidden relative">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl" />
            <div className="relative z-10 w-full max-w-md space-y-4">
              <div className="h-24 bg-white rounded-lg shadow-sm border p-4 flex gap-4 items-center">
                <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">87%</div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-100 rounded w-2/3" />
                  <div className="h-4 bg-slate-50 rounded w-full" />
                </div>
              </div>
              <div className="h-24 bg-white rounded-lg shadow-sm border p-4 flex gap-4 items-center">
                <div className="w-12 h-12 rounded bg-secondary/30 flex items-center justify-center text-secondary-foreground font-bold">12k</div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-4 bg-slate-50 rounded w-5/6" />
                </div>
              </div>
              <div className="h-24 bg-white rounded-lg shadow-sm border p-4 flex gap-4 items-center">
                <div className="w-12 h-12 rounded bg-accent/50 flex items-center justify-center text-accent-foreground font-bold">A+</div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                  <div className="h-4 bg-slate-50 rounded w-4/5" />
                </div>
              </div>
            </div>
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
