import { useState } from "react";
import { Link, useLocation } from "wouter";
import { FlipchartLayout } from "@/components/flipchart-layout";
import { useGetProductRanking } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, ArrowLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function ProductRanking() {
  const [activePhase, setActivePhase] = useState<"employee" | "product">("product");
  const { data: rankings, isLoading } = useGetProductRanking();
  const [, setLocation] = useLocation();

  return (
    <FlipchartLayout activePhase={activePhase} onPhaseChange={setActivePhase}>
      <div className="space-y-6 pb-12">
        <header className="flex items-center gap-4">
          <button onClick={() => window.history.back()} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Global Ranking</h1>
            <p className="text-slate-500 text-sm font-medium">ML-driven hierarchy</p>
          </div>
        </header>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {rankings?.map((item, idx) => {
              const isTop3 = idx < 3;
              const rankColors = ["from-amber-400 to-yellow-600", "from-slate-300 to-slate-500", "from-orange-400 to-orange-700"];
              
              return (
                <Card 
                  key={item.productId} 
                  className="hover:border-primary/30 transition-all cursor-pointer group rounded-2xl overflow-hidden border-slate-100 shadow-sm relative"
                  onClick={() => setLocation(`/product-analysis/products/${item.productId}`)}
                >
                  {isTop3 && (
                    <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${rankColors[idx]}`} />
                  )}
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4 p-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-white shadow-sm transition-transform group-hover:scale-110 ${isTop3 ? `bg-gradient-to-br ${rankColors[idx]}` : "bg-slate-100 text-slate-400"}`}>
                        {item.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800 truncate">{item.productName}</h3>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score: {item.score.toFixed(1)}</span>
                           {item.trend === 'rising' ? <TrendingUp className="w-3 h-3 text-green-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900 tracking-tight">${item.revenue.toLocaleString()}</p>
                        <p className="text-[10px] font-black text-primary uppercase tracking-tighter">{item.recommendation}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </FlipchartLayout>
  );
}
