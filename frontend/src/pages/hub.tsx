import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { FlipchartLayout } from "@/components/flipchart-layout";
import { useGetProducts, useGetEmployees, useGetDashboardSummary } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api-extra";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Hub() {
  const [activePhase, setActivePhase] = useState<"employee" | "product">("employee");
  const [settings, setSettings] = useState<any>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const { data: products, isLoading: loadingProducts } = useGetProducts();
  const { data: employees, isLoading: loadingEmployees } = useGetEmployees();
  const { data: summary } = useGetDashboardSummary();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    api.getSettings().then(setSettings);
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [settings.promotionalVideo]);

  const offers = products?.filter(p => p.offerPercentage && p.offerPercentage > 0) || [];
  const dsEngineers = employees?.filter(e => e.designation.toLowerCase().includes("engineer")) || [];


  return (
    <FlipchartLayout activePhase={activePhase} onPhaseChange={setActivePhase}>
      {activePhase === "employee" ? (
        <EmployeePhase 
          settings={settings} 
          offers={offers} 
          dsEngineers={dsEngineers} 
          videoRef={videoRef}
        />
      ) : (
        <ProductPhase 
          settings={settings} 
          products={products} 
          loading={loadingProducts}
        />
      )}
    </FlipchartLayout>
  );
}

function OfferCarousel({ offers }: { offers: any[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (offers.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % offers.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [offers.length]);

  if (offers.length === 0) {
    return (
      <Card className="w-full bg-slate-100 h-40 flex items-center justify-center border-dashed rounded-3xl">
        <p className="text-slate-400 font-medium">No active offers today</p>
      </Card>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={offers[index].id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <Card className="bg-gradient-to-br from-pink-500 to-rose-600 text-white overflow-hidden border-none shadow-lg h-40">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div>
                <span className="bg-white/20 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest">Limited Offer</span>
                <h3 className="text-xl font-black mt-2 leading-tight">{offers[index].name}</h3>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-black">{offers[index].offerPercentage}% OFF</span>
                <button className="bg-white text-rose-600 text-[10px] font-black px-4 py-2 rounded-xl shadow-md uppercase tracking-widest">Claim Now</button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
      <div className="flex gap-1.5 justify-center mt-3">
        {offers.map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === index ? "w-6 bg-primary" : "w-2 bg-slate-200"}`} />
        ))}
      </div>
    </div>
  );
}

function EngineerCarousel({ engineers }: { engineers: any[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (engineers.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % engineers.length);
    }, 7000); // 7 seconds for engineers to let users read details
    return () => clearInterval(interval);
  }, [engineers.length]);

  if (engineers.length === 0) return null;

  const eng = engineers[index];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-100 shadow-sm p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={eng.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-6"
        >
          <div className="relative">
            <Avatar className="w-24 h-24 ring-4 ring-primary/10 shadow-lg">
              <AvatarImage src={eng.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${eng.name}`} />
              <AvatarFallback className="bg-primary text-white font-black text-2xl">
                {eng.name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-white shadow-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-black text-slate-800 leading-tight truncate">{eng.name}</h3>
            <p className="text-sm font-black text-primary uppercase tracking-widest mt-1">{eng.designation}</p>
            <div className="flex items-center gap-4 mt-3">
               <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Tasks</p>
                  <p className="text-lg font-black text-slate-700">24</p>
               </div>
               <div className="text-center border-l border-slate-100 pl-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Score</p>
                  <p className="text-lg font-black text-slate-700">9.8</p>
               </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="flex gap-1 justify-center mt-4">
        {engineers.map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all duration-700 ${i === index ? "w-8 bg-primary" : "w-2 bg-slate-100"}`} />
        ))}
      </div>
    </div>
  );
}

function EmployeePhase({ settings, offers, dsEngineers, videoRef }: any) {
  return (
    <div className="space-y-8 pb-12">
      {/* Product Offers Slider */}
      <section>
        <OfferCarousel offers={offers} />
      </section>

      {/* Company Name Section */}
      <section className="text-center py-6">
        <motion.h1 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tight"
          style={{ fontFamily: "'EB Garamond', serif" }}
        >
          {settings.companyName || "DS Engineosys"}
        </motion.h1>
        <div className="h-1 w-24 bg-primary/20 mx-auto mt-2 rounded-full" />
      </section>

      {/* Advertisements Section */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Featured Spotlight</h2>
        {settings.promotionalVideo ? (
          <div className="rounded-[2.5rem] overflow-hidden shadow-2xl bg-black aspect-video relative group border-4 border-white">
            <video 
              ref={videoRef}
              key={settings.promotionalVideo}
              src={settings.promotionalVideo} 
              autoPlay 
              muted 
              loop 
              playsInline 
              crossOrigin="anonymous"
              preload="auto"
              onError={(e) => console.error("Video Playback Error:", e)}
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent p-6 flex flex-col justify-end">
              <h3 className="text-white text-2xl font-black italic tracking-tight" style={{ fontFamily: "'EB Garamond', serif" }}>
                {settings.companyName || "DS Engineosys"}
              </h3>
              <p className="text-white/80 text-xs font-bold uppercase tracking-widest">Premium Collection</p>
            </div>
          </div>
        ) : (
          <div className="rounded-[2.5rem] bg-slate-100 aspect-video flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200">
             <p className="text-slate-400 font-bold italic">No promotional video set by Admin</p>
          </div>
        )}
      </section>

      {/* DS-Engineers Details Slider */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Spotlight: DS Engineers</h2>
        <EngineerCarousel engineers={dsEngineers} />
      </section>
    </div>
  );
}

function ProductPhase({ settings, products, loading }: any) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products?.filter((p: any) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a: any, b: any) => (b.revenue || 0) - (a.revenue || 0));

  return (
    <div className="space-y-6 pb-12">
      <header className="space-y-4">
        <div>
          <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-1">
            {settings.mainProductCategory || "Categories"}
          </h2>
          <h1 className="text-3xl font-black text-slate-900">Product Ranking</h1>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search SKU or Product Name..." 
            className="pl-10 h-12 bg-white border-slate-200 rounded-2xl shadow-sm focus:ring-primary/20"
          />
        </div>
      </header>

      <section className="space-y-3">
        {loading ? (
          [1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
        ) : (
          filteredProducts?.map((p: any, idx: number) => {
            const isTop3 = idx < 3;
            const rankColors = ["from-amber-400 to-yellow-600", "from-slate-300 to-slate-500", "from-orange-400 to-orange-700"];
            
            return (
              <Link key={p.id} href={`/product-analysis/products/${p.id}`}>
                <Card className="hover:border-primary/30 transition-all cursor-pointer group rounded-2xl overflow-hidden border-slate-100 shadow-sm mb-3 relative">
                  {isTop3 && (
                    <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${rankColors[idx]}`} />
                  )}
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4 p-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-white shadow-sm transition-transform group-hover:scale-110 ${isTop3 ? `bg-gradient-to-br ${rankColors[idx]}` : "bg-slate-100 text-slate-400"}`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800 truncate">{p.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">{p.category}</span>
                          <p className="text-xs text-slate-400 font-medium truncate">SKU: {p.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900 tracking-tight">${p.revenue?.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Revenue</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </section>
    </div>
  );
}
