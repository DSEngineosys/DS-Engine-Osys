import { Link } from "wouter";
import { AuthenticatedLayout } from "@/components/layout";
import { useGetProductRanking } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";

export default function ProductRanking() {
  const { data: rankings, isLoading } = useGetProductRanking();

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case 'promote': return <Badge className="bg-primary/20 text-primary hover:bg-primary/20">Promote</Badge>;
      case 'offer_discount': return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Discount</Badge>;
      case 'discontinue': return <Badge variant="destructive" className="bg-red-100 text-red-800">Discontinue</Badge>;
      default: return <Badge variant="outline">Keep</Badge>;
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ML Product Rankings</h1>
          <p className="text-muted-foreground mt-1">Algorithmically generated hierarchy of product viability.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 md:p-6 border-b bg-gradient-to-r from-secondary/20 to-transparent">
            <div className="flex items-center gap-2 text-secondary-foreground font-semibold">
              <Trophy className="w-5 h-5" /> Ranking Engine Active
            </div>
            <p className="text-sm text-slate-600 mt-1">Scores generated based on sales velocity, profit margins, and predictive demand models.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-500 border-b">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">ML Score</th>
                  <th className="px-6 py-4">Trend</th>
                  <th className="px-6 py-4">Revenue</th>
                  <th className="px-6 py-4">Margin</th>
                  <th className="px-6 py-4">Recommendation</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-8" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-48" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-12" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  ))
                ) : rankings && rankings.length > 0 ? (
                  rankings.map((item, idx) => (
                    <tr key={item.productId} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs
                          ${idx === 0 ? 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-400' : 
                            idx === 1 ? 'bg-slate-200 text-slate-700 ring-1 ring-slate-300' : 
                            idx === 2 ? 'bg-amber-100/50 text-amber-800 ring-1 ring-amber-300' : 
                            'bg-slate-50 text-slate-500'}
                        `}>
                          #{item.rank}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">{item.productName}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono bg-slate-100 px-2 py-1 rounded text-xs">{item.score.toFixed(1)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 capitalize text-slate-600">
                          {getTrendIcon(item.trend)}
                          <span className="text-xs">{item.trend}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">${item.revenue.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${item.profitMargin > 40 ? 'text-green-600' : item.profitMargin < 20 ? 'text-red-600' : 'text-slate-700'}`}>
                          {item.profitMargin}%
                        </span>
                      </td>
                      <td className="px-6 py-4">{getRecommendationBadge(item.recommendation)}</td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/product-analysis/products/${item.productId}`}>
                          <button className="text-primary hover:text-primary/80 opacity-0 group-hover:opacity-100 transition-opacity p-2" aria-label="View Details">
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                      No ranking data generated yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
