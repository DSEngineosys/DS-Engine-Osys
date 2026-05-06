import { useState } from "react";
import { FlipchartLayout } from "@/components/flipchart-layout";
import { useGetProducts, useApplyProductOffer, getGetProductsQueryKey, getGetProductQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Tag, AlertTriangle, TrendingDown, Percent, Loader2, Package, ArrowLeft } from "lucide-react";

export default function Offers() {
  const [activePhase, setActivePhase] = useState<"employee" | "product">("product");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [offerPercentage, setOfferPercentage] = useState("15");
  const [reason, setReason] = useState("Low demand ML prediction");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: products, isLoading } = useGetProducts();
  const applyOfferMutation = useApplyProductOffer();
  const actionableProducts = products?.filter(p => p.marketStatus === 'low_demand' || p.marketStatus === 'critical') || [];

  const handleApplyOffer = () => {
    if (!selectedProductId) return;
    applyOfferMutation.mutate(
      { id: selectedProductId, data: { offerPercentage: parseInt(offerPercentage, 10), reason } },
      {
        onSuccess: () => {
          toast({ title: "Offer Applied", description: `Successfully applied ${offerPercentage}% discount.` });
          queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
          setIsDialogOpen(false);
          setSelectedProductId(null);
        }
      }
    );
  };

  return (
    <FlipchartLayout activePhase={activePhase} onPhaseChange={setActivePhase}>
      <div className="space-y-6 pb-12">
        <header className="flex items-center gap-4">
          <button onClick={() => window.history.back()} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Offer Center</h1>
          </div>
        </header>

        <Card className="rounded-3xl border-none shadow-lg bg-rose-500 text-white overflow-hidden">
           <CardContent className="p-6">
              <div className="flex items-start gap-4">
                 <AlertTriangle className="w-6 h-6 text-white shrink-0 mt-1" />
                 <div>
                    <h3 className="font-black text-lg">ML Intervention</h3>
                    <p className="text-xs font-medium text-white/80 leading-relaxed">
                       Predictions suggest stock intervention for the following items.
                    </p>
                 </div>
              </div>
           </CardContent>
        </Card>

        {isLoading ? (
           <Skeleton className="h-40 w-full rounded-3xl" />
        ) : (
           <div className="space-y-4">
              {actionableProducts.map(product => (
                 <Card key={product.id} className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-4">
                       <div className="w-16 h-16 bg-slate-50 rounded-2xl flex-shrink-0 flex items-center justify-center">
                          <Package className="w-8 h-8 text-slate-200" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-800 truncate">{product.name}</h3>
                          <p className="text-[10px] font-black text-rose-500 uppercase">{product.marketStatus}</p>
                       </div>
                       <Button 
                          size="sm" 
                          onClick={() => { setSelectedProductId(product.id); setIsDialogOpen(true); }}
                          className="rounded-xl font-black"
                       >
                          Update
                       </Button>
                    </CardContent>
                 </Card>
              ))}
           </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="rounded-[2.5rem] border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-black">Set Offer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Input 
                type="number" 
                value={offerPercentage} 
                onChange={(e) => setOfferPercentage(e.target.value)} 
                className="h-12 rounded-2xl bg-slate-50 border-none shadow-inner"
                placeholder="Discount %"
              />
              <Input 
                value={reason} 
                onChange={(e) => setReason(e.target.value)} 
                className="h-12 rounded-2xl bg-slate-50 border-none shadow-inner"
                placeholder="Reason"
              />
            </div>
            <DialogFooter>
              <Button onClick={handleApplyOffer} className="w-full h-12 rounded-2xl font-black text-lg">Apply Now</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </FlipchartLayout>
  );
}
