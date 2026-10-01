import { useState } from "react";
import { useLocation } from "wouter";
import { FlipchartLayout } from "@/components/flipchart-layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ChevronRight, TrendingUp, TrendingDown, Sparkles, Cpu, Award } from "lucide-react";

interface ProductRankingItem {
  productId: string;
  productName: string;
  category: string;
  subCategory?: string;
  rank: number;
  score: number;
  performanceLevel: "HIGH" | "MID" | "LOW";
  avgSellingTimePeriod: number;
  avgProfit: number;
  totalProfit: number;
  avgOfferDiscount: number;
  salesCount: number;
  mrp: number;
  sellingPrice: number;
  imageUrl?: string;
  recommendation: string;
}

interface ProductRankingResponse {
  totalProducts: number;
  featureAttributes: string[];
  rankings: ProductRankingItem[];
}

export default function ProductRanking() {
  const [activePhase, setActivePhase] = useState<"employee" | "product">("product");
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useQuery<ProductRankingResponse>({
    queryKey: ["/api/ml/product-rankings"],
    queryFn: async () => {
      const res = await fetch("/api/ml/product-rankings");
      if (!res.ok) throw new Error("Failed to fetch ML product rankings");
      return res.json();
    }
  });

  const rankings = data?.rankings || [];

  return (
    <FlipchartLayout activePhase={activePhase} onPhaseChange={setActivePhase}>
      <div className="space-y-6 pb-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.history.back()} 
              className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-200/80 hover:bg-slate-50 transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Supervised ML Product Rankings</h1>
                <Badge className="bg-indigo-600/10 text-indigo-700 hover:bg-indigo-600/20 border-indigo-200/60 font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                  Python ML Engine
                </Badge>
              </div>
              <p className="text-slate-500 text-xs font-medium mt-0.5">
                Trained on <span className="font-bold text-slate-700">productperformances</span> collection attributes: <code className="bg-slate-100 text-indigo-600 font-mono px-1.5 py-0.5 rounded text-[11px] border border-slate-200">[SellingTimePeriod, Profit, OffersApplied]</code>
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setLocation("/product-analysis/offers")}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            ML Offer% Engine
          </button>
        </header>

        {/* Feature info strip */}
        <Card className="rounded-2xl border-slate-200/60 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl overflow-hidden">
          <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                <Award className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">Supervised Machine Learning Hierarchy</h3>
                <p className="text-xs text-slate-300">
                  Products ranked dynamically by performance score computed from historical selling time velocity & profit margins.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400">Features Used:</span>
              <Badge variant="outline" className="text-amber-300 border-amber-500/40 bg-amber-500/10 text-[10px]">SellingTimePeriod</Badge>
              <Badge variant="outline" className="text-emerald-300 border-emerald-500/40 bg-emerald-500/10 text-[10px]">Profit</Badge>
              <Badge variant="outline" className="text-sky-300 border-sky-500/40 bg-sky-500/10 text-[10px]">OffersApplied</Badge>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
        ) : error ? (
          <Card className="p-8 text-center rounded-2xl border-red-200 bg-red-50 text-red-700">
            <p className="font-bold">Failed to load Python ML Rankings</p>
            <p className="text-xs text-red-500 mt-1">{String(error)}</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {rankings.map((item, idx) => {
              const isTop3 = idx < 3;
              const rankGradients = [
                "from-amber-400 via-yellow-500 to-amber-600",
                "from-slate-300 via-slate-400 to-slate-500",
                "from-amber-600 via-orange-600 to-amber-700"
              ];
              
              const levelBadges = {
                HIGH: "bg-emerald-100 text-emerald-800 border-emerald-200",
                MID: "bg-sky-100 text-sky-800 border-sky-200",
                LOW: "bg-rose-100 text-rose-800 border-rose-200"
              };

              return (
                <Card 
                  key={item.productId} 
                  className="hover:border-indigo-300 transition-all cursor-pointer group rounded-2xl overflow-hidden border-slate-200/80 shadow-sm hover:shadow-md bg-white relative"
                  onClick={() => setLocation(`/product-analysis/products/${item.productId}`)}
                >
                  {isTop3 && (
                    <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${rankGradients[idx]}`} />
                  )}
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Rank badge */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-sm transition-transform group-hover:scale-105 ${isTop3 ? `bg-gradient-to-br ${rankGradients[idx]}` : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                        #{item.rank}
                      </div>

                      {/* Product image thumbnail */}
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
                        {item.imageUrl ? (
                          <img src={`/${item.imageUrl}`} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold">No Image</span>
                        )}
                      </div>

                      {/* Main product info */}
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{item.productName}</h3>
                          <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${levelBadges[item.performanceLevel]}`}>
                            {item.performanceLevel} PERF
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 font-medium">
                          <span>Category: <strong className="text-slate-700">{item.category}</strong></span>
                          <span>•</span>
                          <span>Avg Selling Time: <strong className="text-slate-700">{item.avgSellingTimePeriod} days</strong></span>
                          <span>•</span>
                          <span>Avg Profit: <strong className="text-emerald-600">₹{item.avgProfit.toFixed(2)}</strong></span>
                          <span>•</span>
                          <span>Avg Discount: <strong className="text-indigo-600">{item.avgOfferDiscount}%</strong></span>
                        </div>
                      </div>

                      {/* Score and action */}
                      <div className="text-right shrink-0">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">ML Score</span>
                          <span className="text-lg font-black text-slate-900">{item.score.toFixed(1)}</span>
                          {item.performanceLevel === 'HIGH' ? (
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-rose-500" />
                          )}
                        </div>
                        <p className="text-[10px] font-semibold text-slate-500 mt-0.5 max-w-[220px] truncate">{item.recommendation}</p>
                      </div>

                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
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
