import { useRoute } from "wouter";
import { AuthenticatedLayout } from "@/components/layout";
import { useGetProduct, useGetProductPrediction } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Package, BrainCircuit, TrendingDown, TrendingUp, AlertTriangle, Zap } from "lucide-react";

export default function ProductDetail() {
  const [, params] = useRoute("/product-analysis/products/:id");
  const id = params?.id || "";

  const { data: product, isLoading: isLoadingProd } = useGetProduct(id);

  const { data: prediction, isLoading: isLoadingPred } = useGetProductPrediction(id);

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Product Header */}
        {isLoadingProd ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : product ? (
          <div className="flex flex-col md:flex-row gap-6 bg-white p-6 rounded-2xl border shadow-sm">
            <div className="w-full md:w-48 h-48 bg-slate-100 rounded-xl flex flex-shrink-0 items-center justify-center overflow-hidden">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-16 h-16 text-slate-300" />
              )}
            </div>
            <div className="flex-1 flex flex-col justify-between py-2">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="outline" className="font-mono text-xs">{product.sku}</Badge>
                  <span className="text-sm text-muted-foreground">{product.category}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold leading-tight">{product.name}</h1>
                <div className="flex items-center gap-4 mt-4">
                  <div className="text-2xl font-bold">${product.price.toFixed(2)}</div>
                  {product.offerPercentage && product.offerPercentage > 0 && (
                    <Badge variant="destructive" className="text-sm">-{product.offerPercentage}% Active Offer</Badge>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Cost</p>
                  <p className="font-medium">${product.cost.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Stock</p>
                  <p className="font-medium">{product.stock} units</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Sold</p>
                  <p className="font-medium">{product.soldUnits} units</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Status</p>
                  <p className="font-medium capitalize">{product.marketStatus.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Prediction Engine Card */}
        <Card className="border-secondary/30 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <CardHeader className="border-b bg-slate-50/50 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-secondary/20 rounded-lg text-secondary-foreground">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">ML Prediction Analysis</CardTitle>
                  <CardDescription>Algorithmic forecast based on historical data</CardDescription>
                </div>
              </div>
              {prediction && (
                <div className="text-right">
                  <div className="text-xs text-muted-foreground font-semibold uppercase">Confidence</div>
                  <div className="text-xl font-bold text-secondary-foreground">{prediction.confidence.toFixed(1)}%</div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoadingPred ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : prediction ? (
              <div className="space-y-8">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col">
                    <span className="text-sm font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" /> Predicted Demand
                    </span>
                    <span className={`text-2xl font-bold mt-auto capitalize
                      ${prediction.predictedDemand === 'high' ? 'text-green-600' : 
                        prediction.predictedDemand === 'low' ? 'text-red-600' : 'text-amber-600'}`}
                    >
                      {prediction.predictedDemand}
                    </span>
                  </div>
                  
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col">
                    <span className="text-sm font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4" /> Action Recommendation
                    </span>
                    <span className="text-xl font-bold mt-auto text-slate-800 capitalize">
                      {prediction.recommendation.replace('_', ' ')}
                    </span>
                    {prediction.suggestedOfferPercentage && (
                      <span className="text-sm font-medium text-red-500 mt-1">
                        Suggest: {prediction.suggestedOfferPercentage}% Off
                      </span>
                    )}
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col">
                    <span className="text-sm font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Est. Market Longevity
                    </span>
                    <div className="mt-auto flex items-end gap-1">
                      <span className="text-3xl font-bold text-slate-800">{prediction.marketLongevityMonths}</span>
                      <span className="text-sm text-muted-foreground mb-1">months</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Model Insights</h3>
                  <ul className="space-y-3">
                    {prediction.insights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary-foreground mt-2 shrink-0" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Prediction model data unavailable for this product.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
