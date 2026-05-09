import { useRoute } from "wouter";
import { FlipchartLayout } from "@/components/flipchart-layout";
import { useGetProduct, useGetProductPrediction } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Package, BrainCircuit, TrendingDown, TrendingUp, AlertTriangle, Zap, ArrowLeft, Target } from "lucide-react";
import { useState } from "react";

export default function ProductDetail() {
  const [, params] = useRoute("/product-analysis/products/:id");
  const id = params?.id || "";
  const [activePhase, setActivePhase] = useState<"employee" | "product">("product");

  const { data: product, isLoading: isLoadingProd } = useGetProduct(id);
  const { data: prediction, isLoading: isLoadingPred } = useGetProductPrediction(id);

  return (
    <FlipchartLayout activePhase={activePhase} onPhaseChange={setActivePhase}>
      <div className="space-y-6 pb-12">
        <header className="flex items-center gap-4">
          <button onClick={() => window.history.back()} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Product Insights</h1>
          </div>
        </header>

        {isLoadingProd ? (
          <Skeleton className="h-64 w-full rounded-3xl" />
        ) : product ? (
          <div className="space-y-6">
            <Card className="overflow-hidden border-none shadow-xl bg-white rounded-[2.5rem]">
              <div className="aspect-square bg-slate-50 relative flex items-center justify-center">
                {product.imageUrl ? (
                  <img src={product.imageUrl} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-24 h-24 text-slate-200" />
                )}
                <div className="absolute top-4 right-4">
                   <Badge className="bg-primary shadow-lg px-3 py-1 rounded-full">{product.marketStatus}</Badge>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 leading-tight">{product.name}</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-primary">${product.price}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Current Price</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 py-4 border-t border-slate-50">
                   <div className="bg-slate-50 p-3 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">In Stock</p>
                      <p className="text-lg font-black text-slate-800">{product.stock} Units</p>
                   </div>
                   <div className="bg-slate-50 p-3 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Sold</p>
                      <p className="text-lg font-black text-slate-800">{product.soldUnits} Units</p>
                   </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-slate-100 shadow-lg overflow-hidden bg-slate-900 text-white relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -translate-y-1/2 translate-x-1/2" />
               <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                     <BrainCircuit className="w-5 h-5 text-primary" />
                     <CardTitle className="text-lg font-black tracking-tight">AI Sales Prediction</CardTitle>
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
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Growth Insights</p>
                          {prediction.insights.slice(0, 2).map((insight: string, idx: number) => (
                             <div key={idx} className="flex gap-3 text-sm text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5">
                                <Target className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <p className="font-medium leading-snug">{insight}</p>
                             </div>
                          ))}
                       </div>
                    </>
                  ) : (
                    <p className="text-center text-slate-500 py-4">Predictive data initializing...</p>
                  )}
               </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </FlipchartLayout>
  );
}
