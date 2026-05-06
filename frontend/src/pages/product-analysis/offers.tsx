import { useState } from "react";
import { AuthenticatedLayout } from "@/components/layout";
import { useGetProducts, useApplyProductOffer, getGetProductsQueryKey, getGetProductQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Tag, AlertTriangle, TrendingDown, Percent, Loader2, Package } from "lucide-react";

export default function Offers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [offerPercentage, setOfferPercentage] = useState("15");
  const [reason, setReason] = useState("Low demand ML prediction");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch only products that need attention (low demand or critical)
  const { data: products, isLoading } = useGetProducts();
  const applyOfferMutation = useApplyProductOffer();

  // Filter products client-side for this demo, usually would be a query param
  const actionableProducts = products?.filter(p => p.marketStatus === 'low_demand' || p.marketStatus === 'critical') || [];

  const handleApplyOffer = () => {
    if (!selectedProductId) return;

    applyOfferMutation.mutate(
      { 
        id: selectedProductId, 
        data: { 
          offerPercentage: parseInt(offerPercentage, 10), 
          reason 
        } 
      },
      {
        onSuccess: () => {
          toast({
            title: "Offer Applied",
            description: `Successfully applied ${offerPercentage}% discount.`,
          });
          queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
          if (selectedProductId) {
             queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(selectedProductId) });
          }
          setIsDialogOpen(false);
          setSelectedProductId(null);
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to apply offer.",
          });
        }
      }
    );
  };

  const openDialogForProduct = (id: number) => {
    setSelectedProductId(id);
    setIsDialogOpen(true);
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Offer Management</h1>
            <p className="text-muted-foreground mt-1">Intervene on low-performing inventory with targeted discounts.</p>
          </div>
        </div>

        <Card className="border-rose-100 bg-rose-50/30">
          <CardContent className="p-6 flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-rose-900">ML Intervention Required</h3>
              <p className="text-sm text-rose-700/80 mt-1">
                The prediction engine has identified the following products as having declining market demand. Applying an offer is recommended to prevent dead stock accumulation.
              </p>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : actionableProducts.length > 0 ? (
          <div className="grid gap-4">
            {actionableProducts.map(product => (
              <Card key={product.id} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center p-4 gap-6">
                  <div className="w-full sm:w-24 h-24 bg-slate-100 rounded-lg flex shrink-0 items-center justify-center">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover mix-blend-multiply opacity-80" />
                    ) : (
                      <Package className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 w-full">
                    <div className="text-xs font-mono text-muted-foreground mb-1">{product.sku}</div>
                    <h3 className="font-semibold text-lg truncate">{product.name}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1 text-slate-600">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        Status: <span className="font-medium text-red-600 capitalize">{product.marketStatus.replace('_', ' ')}</span>
                      </span>
                      <span className="text-slate-600">
                        Stock: <span className="font-medium">{product.stock}</span>
                      </span>
                      <span className="text-slate-600">
                        Price: <span className="font-medium">${product.price.toFixed(2)}</span>
                      </span>
                      {product.offerPercentage && product.offerPercentage > 0 && (
                        <span className="text-rose-600 font-medium flex items-center gap-1 bg-rose-100 px-2 py-0.5 rounded">
                          <Percent className="w-3 h-3" />
                          Current: {product.offerPercentage}% off
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full sm:w-auto mt-4 sm:mt-0 flex-shrink-0">
                    <Button 
                      onClick={() => openDialogForProduct(product.id)}
                      variant={product.offerPercentage ? "outline" : "default"}
                      className={!product.offerPercentage ? "bg-rose-600 hover:bg-rose-700 text-white w-full" : "w-full"}
                      data-testid={`btn-apply-offer-${product.id}`}
                    >
                      {product.offerPercentage ? "Update Offer" : "Apply Offer"}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white border rounded-xl shadow-sm">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingDown className="w-8 h-8 text-green-500 transform rotate-180" />
            </div>
            <h3 className="text-lg font-semibold">Inventory is Healthy</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              The ML models have not identified any products requiring immediate intervention or discounts at this time.
            </p>
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply Product Offer</DialogTitle>
              <DialogDescription>
                Set a discount percentage based on ML recommendations.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Discount Percentage (%)</label>
                <Input 
                  type="number" 
                  min="1" 
                  max="99" 
                  value={offerPercentage} 
                  onChange={(e) => setOfferPercentage(e.target.value)} 
                  data-testid="input-offer-percentage"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason for Intervention</label>
                <Input 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)} 
                  placeholder="e.g. Clearance, ML Prediction..."
                  data-testid="input-offer-reason"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleApplyOffer} 
                disabled={applyOfferMutation.isPending || !offerPercentage}
                className="bg-rose-600 hover:bg-rose-700 text-white"
                data-testid="btn-confirm-offer"
              >
                {applyOfferMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Apply Discount
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
