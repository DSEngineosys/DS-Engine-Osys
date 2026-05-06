import { useState } from "react";
import { Link } from "wouter";
import { AuthenticatedLayout } from "@/components/layout";
import { useGetProducts } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Package, AlertTriangle, ArrowRight } from "lucide-react";

export default function ProductsList() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  const { data: products, isLoading } = useGetProducts({
    category: categoryFilter !== "all" ? categoryFilter : undefined
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'high_demand': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none">High Demand</Badge>;
      case 'moderate': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none">Moderate</Badge>;
      case 'low_demand': return <Badge variant="outline" className="text-amber-600 border-amber-200">Low Demand</Badge>;
      case 'critical': return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100 border-none">Critical</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Extract unique categories for filter
  const categories = ["all", "Cosmetics A1", "Skincare B2", "Fragrance C3"]; // Hardcoded for demo if API doesn't provide list

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Inventory</h1>
          <p className="text-muted-foreground mt-1">Full catalog with live market status indicators.</p>
        </div>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by SKU or name..."
                  className="pl-9 bg-slate-50/50"
                />
              </div>
              <div className="w-full sm:w-[240px] flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="bg-slate-50/50">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c} value={c}>
                        {c === "all" ? "All Categories" : c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map(product => (
              <Link key={product.id} href={`/product-analysis/products/${product.id}`}>
                <Card className="h-full hover:border-secondary-foreground/30 hover:shadow-md transition-all cursor-pointer group flex flex-col overflow-hidden">
                  <div className="h-32 bg-slate-100 flex items-center justify-center relative">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover mix-blend-multiply opacity-80" />
                    ) : (
                      <Package className="w-12 h-12 text-slate-300" />
                    )}
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(product.marketStatus)}
                    </div>
                    {product.offerPercentage && product.offerPercentage > 0 && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        -{product.offerPercentage}%
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <div className="text-xs text-muted-foreground font-mono mb-1">{product.sku}</div>
                    <h3 className="font-semibold text-base leading-tight mb-1 group-hover:text-secondary-foreground transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">{product.category}</p>
                    
                    <div className="mt-auto grid grid-cols-2 gap-2 pt-3 border-t">
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground font-semibold">Price</div>
                        <div className="font-medium">${product.price.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground font-semibold">Stock</div>
                        <div className={`font-medium ${product.stock < 20 ? 'text-red-600 flex items-center gap-1' : ''}`}>
                          {product.stock} {product.stock < 20 && <AlertTriangle className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed">
            <Package className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No Products Found</h3>
            <p className="text-muted-foreground">Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
