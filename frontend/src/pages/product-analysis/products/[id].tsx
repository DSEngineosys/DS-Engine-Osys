import { useRoute } from "wouter";
import { FlipchartLayout } from "@/components/flipchart-layout";
import { useGetProduct, useGetProductPrediction } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  BrainCircuit, 
  ArrowLeft, 
  Target, 
  Calendar, 
  Tag, 
  Layers, 
  User, 
  Sparkles,
  ShieldCheck,
  Percent
} from "lucide-react";
import { useState } from "react";

export default function ProductDetail() {
  const [, params] = useRoute("/product-analysis/products/:id");
  const id = params?.id || "";
  const [activePhase, setActivePhase] = useState<"employee" | "product">("product");

  const { data: product, isLoading: isLoadingProd } = useGetProduct(id);
  const { data: prediction, isLoading: isLoadingPred } = useGetProductPrediction(id);
  const prod = product as any;

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
              <div className="grid md:grid-cols-3 gap-6 p-6">
                <div className="aspect-square bg-slate-50 rounded-2xl relative flex items-center justify-center overflow-hidden border border-slate-100">
                  {prod.imageUrl ? (
                    <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-24 h-24 text-slate-200" />
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge className={`${getStatusColor(prod.marketStatus)} shadow px-3 py-1 rounded-full uppercase text-[10px] font-bold tracking-wider`}>
                      {prod.marketStatus?.replace('_', ' ')}
                    </Badge>
                  </div>
                  {prod.offerPercentage && prod.offerPercentage > 0 && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow">
                      -{prod.offerPercentage}% OFF
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                        {prod.sku || prod.productId}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{prod.category}</span>
                      {prod.subCategory && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-slate-400 font-medium">{prod.subCategory}</span>
                        </>
                      )}
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 leading-tight mb-2">{prod.name}</h2>
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                      {prod.description || prod.productDescription || "No description provided."}
                    </p>
                  </div>

                  {/* Pricing and Stock Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selling Price</p>
                      <p className="text-xl font-black text-primary">${prod.price?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MRP</p>
                      <p className="text-xl font-black text-slate-700">${(prod.mrp || prod.price)?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock Units</p>
                      <p className={`text-xl font-black ${prod.stock < 200 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {prod.stock}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Units Sold</p>
                      <p className="text-xl font-black text-emerald-600">{prod.soldUnits || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Specifications & Batch Details */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="rounded-[1.5rem] border-slate-100 shadow-sm bg-white p-6 space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Product Attributes & Target
                </h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-400 flex items-center gap-1.5"><Layers className="w-4 h-4" /> Type / Format</span>
                    <span className="font-semibold text-slate-800">{prod.type || "Standard"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-400 flex items-center gap-1.5"><User className="w-4 h-4" /> Target Gender</span>
                    <span className="font-semibold text-slate-800">{prod.gender || "Both / Unisex"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-400 flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> Target Age Group</span>
                    <span className="font-semibold text-slate-800">{prod.ageGroup || "All Ages"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-400 flex items-center gap-1.5"><Tag className="w-4 h-4" /> Batch Number</span>
                    <span className="font-mono font-bold text-slate-800">{prod.batchNumber || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400 flex items-center gap-1.5"><Percent className="w-4 h-4" /> Applied Tax Rate</span>
                    <span className="font-semibold text-slate-800">{prod.taxPercent || 18}%</span>
                  </div>
                </div>
              </Card>

              <Card className="rounded-[1.5rem] border-slate-100 shadow-sm bg-white p-6 space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Lifecycle & Ingredients
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-400">Manufacture Date</span>
                    <span className="font-semibold text-slate-800">{formatDate(prod.manufactureDate)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-400">Expiry Date</span>
                    <span className="font-semibold text-slate-800">{formatDate(prod.expiryDate)}</span>
                  </div>
                  <div className="pt-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Key Ingredients</p>
                    <div className="flex flex-wrap gap-1.5">
                      {prod.ingredients && prod.ingredients.length > 0 ? (
                        prod.ingredients.map((ing: string, i: number) => (
                          <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium">
                            {ing}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">No ingredients specified</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

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
