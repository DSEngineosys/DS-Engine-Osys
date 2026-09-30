import { useState } from "react";
import { FlipchartLayout } from "@/components/flipchart-layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Flame, 
  Package, 
  Percent, 
  Gift, 
  Layers, 
  Cpu, 
  Zap
} from "lucide-react";

interface PairProductOption {
  productId: string;
  productName: string;
  price: number;
}

interface OfferOption {
  priority: number; // 4, 3, 2, 1
  id: string;
  name: string;
  badge: string;
  tagline: string;
  isRecommended: boolean;
  type: "bogo" | "b2g1" | "combine_sell" | "discount";
  allowProductSelection?: boolean;
  availablePairProducts?: PairProductOption[];
  defaultDiscountPercent?: number;
}

interface ProductOfferItem {
  productId: string;
  productName: string;
  category: string;
  subCategory?: string;
  mrp: number;
  sellingPrice: number;
  imageUrl?: string;
  performanceScore: number;
  performanceLevel: "LOWEST" | "LOW" | "LOW_MID" | "MID" | "HIGH";
  recommendedPriority: number; // 4, 3, 2, or 1
  offers: OfferOption[];
}

interface ProductOffersResponse {
  totalProducts: number;
  prioritySequence: number[];
  productOffers: ProductOfferItem[];
}

export default function Offers() {
  const [activePhase, setActivePhase] = useState<"employee" | "product">("product");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Track expanded product block dropdowns
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  // Track user offer selections per product
  const [selectedOffers, setSelectedOffers] = useState<Record<string, number>>({});
  
  // Track selected pair products for Priority 2 Combine Selling
  const [selectedPairProducts, setSelectedPairProducts] = useState<Record<string, string>>({});
  
  // Track custom discount percentage for Priority 1 Discount
  const [customDiscounts, setCustomDiscounts] = useState<Record<string, number>>({});

  const { data, isLoading, error } = useQuery<ProductOffersResponse>({
    queryKey: ["/api/ml/product-offers"],
    queryFn: async () => {
      const res = await fetch("/api/ml/product-offers");
      if (!res.ok) throw new Error("Failed to fetch ML offer suggestions");
      return res.json();
    }
  });

  const toggleDropdown = (productId: string, defaultRecommendedPriority: number) => {
    if (expandedProductId === productId) {
      setExpandedProductId(null);
    } else {
      setExpandedProductId(productId);
      if (!selectedOffers[productId]) {
        setSelectedOffers(prev => ({ ...prev, [productId]: defaultRecommendedPriority }));
      }
    }
  };

  const applyOfferMutation = useMutation({
    mutationFn: async ({ productId, priority, details }: { productId: string; priority: number; details: any }) => {
      const res = await fetch(`/api/products/${productId}/offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerPercentage: details.discountPercent || 20,
          reason: `ML Priority ${priority} Offer: ${details.offerName}`
        })
      });
      if (!res.ok) throw new Error("Failed to apply offer");
      return res.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "⚡ ML Offer Applied Successfully!",
        description: `Applied Priority ${variables.priority} offer to ${data.name || 'product'}.`
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ml/product-offers"] });
    },
    onError: (err: any) => {
      toast({
        title: "Error Applying Offer",
        description: err.message,
        variant: "destructive"
      });
    }
  });

  const productOffers = data?.productOffers || [];

  return (
    <FlipchartLayout activePhase={activePhase} onPhaseChange={setActivePhase}>
      <div className="space-y-6 pb-16">
        <header className="flex items-center gap-4">
          <button 
            onClick={() => window.history.back()} 
            className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">ML Offer% Suggestion Center</h1>
              <Badge className="bg-amber-500/10 text-amber-700 border-amber-300 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-amber-600" />
                Supervised ML Model
              </Badge>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full rounded-3xl" />)}
          </div>
        ) : error ? (
          <Card className="p-8 text-center rounded-3xl border-red-200 bg-red-50 text-red-700">
            <p className="font-bold">Failed to load ML Offer Suggestions</p>
            <p className="text-xs text-red-500 mt-1">{String(error)}</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {productOffers.map((item) => {
              const isExpanded = expandedProductId === item.productId;
              const currentActivePriority = selectedOffers[item.productId] || item.recommendedPriority;
              const recommendedOffer = item.offers.find(o => o.priority === item.recommendedPriority) || item.offers[0];

              return (
                <Card 
                  key={item.productId} 
                  className={`rounded-3xl transition-all duration-300 border bg-white overflow-hidden shadow-sm hover:shadow-md ${
                    isExpanded 
                      ? "border-amber-400 ring-4 ring-amber-500/10 shadow-lg" 
                      : "border-slate-200 hover:border-amber-300"
                  }`}
                >
                  {/* Tappable Product Block Header */}
                  <div 
                    onClick={() => toggleDropdown(item.productId, item.recommendedPriority)}
                    className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer select-none group"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-[280px]">
                      {/* Product Image / Icon */}
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0 relative">
                        {item.imageUrl ? (
                          <img src={`/${item.imageUrl}`} alt={item.productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <Package className="w-8 h-8 text-slate-300" />
                        )}
                        <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                          #{item.performanceScore.toFixed(0)}
                        </div>
                      </div>

                      {/* Product Details */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-600 transition-colors">
                            {item.productName}
                          </h3>
                          <Badge 
                            variant="outline"
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                              item.performanceLevel === 'LOWEST' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                              item.performanceLevel === 'LOW' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                              'bg-amber-100 text-amber-800 border-amber-300'
                            }`}
                          >
                            {item.performanceLevel} PERF
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                          <span>{item.category}</span>
                          <span>•</span>
                          <span className="font-bold text-slate-900">${item.sellingPrice.toFixed(2)}</span>
                          {item.mrp > item.sellingPrice && (
                            <span className="line-through text-slate-400 font-normal">${item.mrp.toFixed(2)}</span>
                          )}
                        </div>

                        {/* Highlight Chip showing auto-suggested offer */}
                        <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/80 w-fit">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>ML Auto-Suggested: <strong className="text-amber-950 font-black">{recommendedOffer.name}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Expand/Collapse Dropdown Indicator */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 group-hover:text-amber-600 transition-colors">
                        {isExpanded ? "Close Dropdown" : "Tap to View Offers"}
                      </span>
                      <div className={`p-2 rounded-xl transition-colors ${isExpanded ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-amber-100 group-hover:text-amber-700"}`}>
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Section: Horizontal Serial-Wise Offer Blocks */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-gradient-to-b from-slate-50/80 to-white p-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
                      
                      {/* HORIZONTAL SERIAL-WISE OFFER BLOCKS CONTAINER (HORIZONTALLY SCROLLABLE) */}
                      <div className="flex flex-row overflow-x-auto gap-4 pb-4 pt-2 snap-x scrollbar-thin scrollbar-thumb-amber-300">
                        {item.offers.map((offer) => {
                          const isRecommended = offer.priority === item.recommendedPriority;
                          const isSelected = currentActivePriority === offer.priority;

                          // Distinct colors per offer block
                          const priorityColors = {
                            4: { border: "border-rose-300", bg: "bg-rose-50/40", badge: "bg-rose-500 text-white", accent: "text-rose-600" },
                            3: { border: "border-orange-300", bg: "bg-orange-50/40", badge: "bg-orange-500 text-white", accent: "text-orange-600" },
                            2: { border: "border-amber-300", bg: "bg-amber-50/40", badge: "bg-amber-500 text-white", accent: "text-amber-600" },
                            1: { border: "border-sky-300", bg: "bg-sky-50/40", badge: "bg-sky-500 text-white", accent: "text-sky-600" },
                          }[offer.priority as 4 | 3 | 2 | 1];

                          return (
                            <div
                              key={offer.id}
                              onClick={() => setSelectedOffers(prev => ({ ...prev, [item.productId]: offer.priority }))}
                              className={`relative rounded-2xl p-4 cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[140px] min-w-[260px] max-w-[280px] shrink-0 snap-start ${
                                isRecommended 
                                  ? "border-2 border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/15 ring-2 ring-amber-400/40 scale-[1.02]" 
                                  : isSelected
                                  ? "border-2 border-slate-900 bg-white shadow-md"
                                  : `border ${priorityColors.border} ${priorityColors.bg} bg-white hover:border-slate-400 hover:shadow-sm`
                              }`}
                            >
                              {/* Highlighted ML Recommended Badge */}
                              {isRecommended && (
                                <div className="absolute -top-3 left-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1 tracking-wider">
                                  <Flame className="w-3 h-3 text-yellow-300" />
                                  ★ ML MOST PROVIDABLE
                                </div>
                              )}

                              <div>
                                {/* Offer Header */}
                                <div className="flex items-center justify-between mb-3 mt-1">
                                  <div className="flex items-center gap-2">
                                    {offer.type === 'bogo' && <Gift className="w-5 h-5 text-rose-500 shrink-0" />}
                                    {offer.type === 'b2g1' && <Package className="w-5 h-5 text-orange-500 shrink-0" />}
                                    {offer.type === 'combine_sell' && <Layers className="w-5 h-5 text-amber-500 shrink-0" />}
                                    {offer.type === 'discount' && <Percent className="w-5 h-5 text-sky-500 shrink-0" />}
                                    <h5 className="font-extrabold text-sm text-slate-900 leading-snug">
                                      {offer.name}
                                    </h5>
                                  </div>
                                  {isSelected && (
                                    <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />
                                  )}
                                </div>

                                {/* Priority 2: COMBINE SELLING PRODUCT SELECTION DROPDOWN */}
                                {offer.type === 'combine_sell' && offer.allowProductSelection && (
                                  <div className="mt-2 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                                    <label className="text-[10px] font-black uppercase text-amber-800">
                                      Select Combine Product:
                                    </label>
                                    <Select
                                      value={selectedPairProducts[item.productId] || (offer.availablePairProducts?.[0]?.productId || "")}
                                      onValueChange={(val) => setSelectedPairProducts(prev => ({ ...prev, [item.productId]: val }))}
                                    >
                                      <SelectTrigger className="h-9 rounded-xl text-xs bg-white border-amber-300 font-bold text-slate-800">
                                        <SelectValue placeholder="Choose paired product..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {offer.availablePairProducts?.map((p) => (
                                          <SelectItem key={p.productId} value={p.productId} className="text-xs">
                                            {p.productName} (${p.price.toFixed(2)})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}

                                {/* Priority 1: DISCOUNT PERCENT INPUT */}
                                {offer.type === 'discount' && (
                                  <div className="mt-2 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                                    <label className="text-[10px] font-black uppercase text-sky-800">
                                      Set Discount % (0-100%):
                                    </label>
                                    <Input
                                      type="number"
                                      min={1}
                                      max={100}
                                      value={customDiscounts[item.productId] ?? offer.defaultDiscountPercent ?? 20}
                                      onChange={(e) => setCustomDiscounts(prev => ({ ...prev, [item.productId]: parseInt(e.target.value, 10) || 0 }))}
                                      className="h-9 rounded-xl text-xs bg-white border-sky-300 font-bold text-slate-800"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Selected Status Footer */}
                              <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                                <span className={`text-[11px] font-black uppercase ${isSelected ? "text-slate-900" : "text-slate-400"}`}>
                                  {isSelected ? "Selected Offer" : "Tap to Select"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* APPLY SELECTED OFFER BUTTON */}
                      <div className="pt-2 flex justify-end">
                        <Button
                          onClick={() => {
                            const activeOffer = item.offers.find(o => o.priority === currentActivePriority);
                            let discountVal = 20;
                            if (currentActivePriority === 4) discountVal = 50; // BOGO ~ 50%
                            else if (currentActivePriority === 3) discountVal = 33; // B2G1 ~ 33%
                            else if (currentActivePriority === 2) discountVal = 25; // Combine ~ 25%
                            else if (currentActivePriority === 1) discountVal = customDiscounts[item.productId] ?? 20;

                            applyOfferMutation.mutate({
                              productId: item.productId,
                              priority: currentActivePriority,
                              details: {
                                offerName: activeOffer?.name,
                                discountPercent: discountVal,
                                pairedProductId: selectedPairProducts[item.productId]
                              }
                            });
                          }}
                          disabled={applyOfferMutation.isPending}
                          className="h-12 px-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-white font-black text-sm shadow-md flex items-center gap-2 transition-all hover:scale-[1.01]"
                        >
                          <Zap className="w-4 h-4 text-amber-400" />
                          Apply Offer to {item.productName}
                        </Button>
                      </div>

                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </FlipchartLayout>
  );
}
