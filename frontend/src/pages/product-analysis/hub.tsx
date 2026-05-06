import { Link } from "wouter";
import { AuthenticatedLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Trophy, Tag, BarChart3, ArrowRight } from "lucide-react";

export default function ProductAnalysisHub() {
  const sections = [
    {
      title: "ML Product Ranking",
      description: "Algorithmic sorting of product viability.",
      icon: Trophy,
      href: "/product-analysis/ranking",
      color: "text-amber-600",
      bg: "bg-amber-100"
    },
    {
      title: "Inventory List",
      description: "Full catalog with market status indicators.",
      icon: Package,
      href: "/product-analysis/products",
      color: "text-emerald-600",
      bg: "bg-emerald-100"
    },
    {
      title: "Offer Management",
      description: "Targeted discounts for low-demand items.",
      icon: Tag,
      href: "/product-analysis/offers",
      color: "text-rose-600",
      bg: "bg-rose-100"
    },
  ];

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-secondary rounded-lg">
                <Package className="w-6 h-6 text-secondary-foreground" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Product Analysis Phase</h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Focusing on <span className="font-semibold text-foreground">Cosmetics A1 Category</span>. Predictive modeling and market demand analysis.
            </p>
          </div>
          <Link href="/product-analysis/ranking">
            <Button size="lg" variant="secondary" className="shrink-0 text-secondary-foreground" data-testid="btn-view-rankings">
              View ML Rankings
            </Button>
          </Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 pt-4">
          {sections.map((section, idx) => (
            <Link key={idx} href={section.href}>
              <Card className="h-full hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer border-slate-200">
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 rounded-lg ${section.bg} flex items-center justify-center mb-4`}>
                    <section.icon className={`w-6 h-6 ${section.color}`} />
                  </div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-2">
                    {section.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center text-sm font-medium text-secondary-foreground mt-2">
                    Explore <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-12 bg-white border border-secondary/50 rounded-2xl p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-secondary/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="relative z-10 max-w-3xl">
            <h2 className="text-2xl font-semibold mb-4">ML Prediction Engine Active</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              The Product Analysis Phase utilizes advanced predictive models to evaluate market longevity and profit potential. By analyzing historical sales velocity against category benchmarks, the engine proactively identifies inventory requiring intervention before it becomes dead stock.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mt-8">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-sm text-muted-foreground mb-1">Confidence Interval</div>
                <div className="text-2xl font-bold text-foreground">94.2%</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-sm text-muted-foreground mb-1">Models Active</div>
                <div className="text-2xl font-bold text-foreground">3 Ensembles</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-sm text-muted-foreground mb-1">Last Training Run</div>
                <div className="text-2xl font-bold text-foreground">2 hours ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
