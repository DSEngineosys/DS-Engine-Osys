import { useRoute } from "wouter";
import { FlipchartLayout } from "@/components/flipchart-layout";
import { useGetProduct, useGetProductPrediction } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { 
  Package, 
  BrainCircuit, 
  ArrowLeft, 
  Target,
  Zap,
  Clock,
  Tag,
  Timer,
} from "lucide-react";

export default function ProductDetail() {
  const [, params] = useRoute("/product-analysis/products/:id");
  const id = params?.id || "";
  const [activePhase, setActivePhase] = useState<"employee" | "product">("product");

  const { data: product, isLoading: isLoadingProd } = useGetProduct(id);
  const { data: prediction, isLoading: isLoadingPred } = useGetProductPrediction(id);
  const prod = product as any;

  // Live countdown for active offer
  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const offerExpiresMs = prod?.offerExpiresAt ? new Date(prod.offerExpiresAt).getTime() : 0;
  const offerRemainingSecs = offerExpiresMs > nowMs ? Math.floor((offerExpiresMs - nowMs) / 1000) : 0;
  const isOfferLive = offerRemainingSecs > 0 || prod?.isOfferActive;

  const formatCountdown = (secs: number) => {
    if (secs <= 0) return "Expired";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "high_demand": return "bg-emerald-500 text-white";
      case "moderate": return "bg-blue-500 text-white";
      case "low_demand": return "bg-amber-500 text-white";
      case "critical": return "bg-rose-500 text-white";
      default: return "bg-slate-500 text-white";
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <FlipchartLayout activePhase={activePhase} onPhaseChange={setActivePhase}>
      <div className="space-y-6 pb-12 max-w-5xl mx-auto">
        <header className="flex items-center gap-4">
          <button onClick={() => window.history.back()} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 hover:bg-slate-50 transition">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Product Specification & Insights</h1>
            <p className="text-slate-500 text-sm">Detailed catalog profile and predictive analytics</p>
          </div>
        </header>

        {isLoadingProd ? (
          <Skeleton className="h-96 w-full rounded-3xl" />
        ) : prod ? (
          <div className="space-y-6">
            {/* Top Overview Card */}
            <Card className="overflow-hidden border-none shadow-md bg-white rounded-[2rem]">
              <div className="p-6">
                <div className="flex flex-col gap-4">

                  {/* Product Name Header */}
                  <div className="text-center py-2">
                    <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-slate-800 via-primary to-slate-700 bg-clip-text text-transparent leading-tight">
                      {prod.name}
                    </h2>
                    <div className="mt-2 mx-auto w-16 h-1 rounded-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
                  </div>

                  {/* Product Image */}
                  <div className="relative w-full max-w-sm mx-auto aspect-square rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center shadow-sm">
                    {prod.imageUrl ? (
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <p className="text-sm font-bold text-slate-400 italic tracking-wide text-center px-4">
                          Image need to be add soon..!
                        </p>
                      </div>
                    )}
                    {/* Offer badge */}
                    {prod.offerPercentage && prod.offerPercentage > 0 && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow">
                        -{prod.offerPercentage}% OFF
                      </div>
                    )}
                  </div>

                  {/* Category | SubCategory | Performance Level */}
                  <div className="flex items-center justify-between bg-slate-50 rounded-2xl border border-slate-100 px-5 py-3">
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</p>
                      <p className="text-sm font-black text-slate-800 mt-0.5">{prod.category || "—"}</p>
                    </div>
                    <div className="text-center border-x border-slate-200 px-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sub Category</p>
                      <p className="text-sm font-black text-slate-800 mt-0.5">{prod.subCategory || "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Performance</p>
                      <span className={`inline-block mt-0.5 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide ${getStatusColor(prod.marketStatus)}`}>
                        {prod.marketStatus?.replace('_', ' ') || "—"}
                      </span>
                    </div>
                  </div>

                  {/* Pricing and Stock Banner */}
                  <div className="flex flex-col gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selling Price</p>
                      {isOfferLive && prod.offerPercentage > 0 ? (
                        <div className="flex items-center gap-2">
                          <p className="text-base font-black text-slate-400 line-through">₹{prod.price?.toFixed(2)}</p>
                          <p className="text-lg font-black text-sky-600">₹{(prod.price * (1 - prod.offerPercentage / 100)).toFixed(2)}</p>
                        </div>
                      ) : (
                        <p className="text-lg font-black text-primary">₹{prod.price?.toFixed(2)}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MRP</p>
                      <p className="text-lg font-black text-slate-700">₹{(prod.mrp || prod.price)?.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock Units</p>
                      <p className={`text-lg font-black ${prod.stock < 200 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {prod.stock}
                      </p>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Units Sold</p>
                      <p className="text-lg font-black text-emerald-600">{prod.soldUnits || 0}</p>
                    </div>
                  </div>

                  {/* ── ACTIVE OFFER BANNER ── */}
                  {isOfferLive && prod.offerPercentage > 0 && (
                    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                      {/* Header */}
                      <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-300" />
                          <span className="text-white font-black text-sm uppercase tracking-widest">Active Offer Applied</span>
                        </div>
                        <span className="bg-white/20 text-white font-black text-lg px-3 py-0.5 rounded-xl backdrop-blur-sm">
                          -{prod.offerPercentage}% OFF
                        </span>
                      </div>
                      {/* Body */}
                      <div className="bg-sky-50 p-4 space-y-3">
                        {/* Offer name */}
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-sky-700 shrink-0" />
                          <span className="font-black text-sky-900 text-sm">
                            {prod.activeOfferDetails?.offerName || `${prod.offerPercentage}% Discount Offer`}
                          </span>
                        </div>
                        {/* Prices */}
                        <div className="flex items-center gap-4 bg-white rounded-xl px-4 py-3 border border-sky-100">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Original Price</p>
                            <p className="text-base font-black text-slate-400 line-through">₹{prod.price?.toFixed(2)}</p>
                          </div>
                          <div className="text-sky-500 font-black text-xl">→</div>
                          <div>
                            <p className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">Offer Price</p>
                            <p className="text-xl font-black text-sky-700">₹{(prod.price * (1 - prod.offerPercentage / 100)).toFixed(2)}</p>
                          </div>
                          <div className="ml-auto text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">You Save</p>
                            <p className="text-base font-black text-rose-600">₹{(prod.price * prod.offerPercentage / 100).toFixed(2)}</p>
                          </div>
                        </div>
                        {/* Timestamps */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white rounded-xl px-3 py-2 border border-sky-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Applied At</p>
                            <p className="text-xs font-bold text-slate-700 mt-0.5">
                              {prod.offerAppliedAt ? new Date(prod.offerAppliedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                            </p>
                          </div>
                          <div className="bg-white rounded-xl px-3 py-2 border border-sky-100">
                            <div className="flex items-center gap-1">
                              <Timer className="w-3 h-3 text-rose-500" />
                              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Expires In</p>
                            </div>
                            <p className="text-xs font-black text-rose-700 mt-0.5 tabular-nums">
                              {formatCountdown(offerRemainingSecs)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Details section */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Details</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</p>
                        <p className="font-semibold text-slate-800 text-xs mt-0.5">{prod.type || "Standard"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender</p>
                        <p className="font-semibold text-slate-800 text-xs mt-0.5">{prod.gender || "Both"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Age Group</p>
                        <p className="font-semibold text-slate-800 text-xs mt-0.5">{prod.ageGroup || "All Ages"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tax Rate</p>
                        <p className="font-semibold text-slate-800 text-xs mt-0.5">{prod.taxPercent || 18}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Batch No.</p>
                        <p className="font-mono font-bold text-slate-800 text-xs mt-0.5">{prod.batchNumber || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mfg. Date</p>
                        <p className="font-semibold text-slate-800 text-xs mt-0.5">{formatDate(prod.manufactureDate)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expiry Date</p>
                        <p className="font-semibold text-slate-800 text-xs mt-0.5">{formatDate(prod.expiryDate)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* AI Sales Prediction Card */}
            <Card className="rounded-[2rem] border-slate-100 shadow-lg overflow-hidden bg-slate-900 text-white relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -translate-y-1/2 translate-x-1/2" />
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg font-black tracking-tight">AI Demand & Sales Forecast</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingPred ? (
                  <Skeleton className="h-32 w-full bg-slate-800" />
                ) : prediction ? (
                  <>
                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Predicted Demand</p>
                        <p className={`text-xl font-black ${prediction.predictedDemand === 'high' ? 'text-green-400' : 'text-amber-400'}`}>
                          {prediction.predictedDemand.toUpperCase()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black text-white">{Math.round(prediction.confidence * 100)}%</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Confidence</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Growth & Optimization Insights</p>
                      {prediction.insights && prediction.insights.length > 0 ? (
                        prediction.insights.map((insight: string, idx: number) => (
                          <div key={idx} className="flex gap-3 text-sm text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5">
                            <Target className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <p className="font-medium leading-snug">{insight}</p>
                          </div>
                        ))
                      ) : (
                        <div className="flex gap-3 text-sm text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5">
                          <Target className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <p className="font-medium leading-snug">Demand velocity is stable for this category tier. Monitor stock levels against seasonal fluctuations.</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-white/5 rounded-xl text-slate-400 text-sm">
                    Forecast model analysis active for category: {prod.category}.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </FlipchartLayout>
  );
}
