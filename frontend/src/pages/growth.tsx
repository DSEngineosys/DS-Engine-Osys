import { useState } from "react";
import { FlipchartLayout } from "@/components/flipchart-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

export default function GrowthPage() {
  const [activePhase, setActivePhase] = useState<"employee" | "product">("employee");
  const { data: summary } = useGetDashboardSummary();

  const data = [
    { name: 'Jan', growth: 4000, revenue: 2400 },
    { name: 'Feb', growth: 3000, revenue: 1398 },
    { name: 'Mar', growth: 2000, revenue: 9800 },
    { name: 'Apr', growth: 2780, revenue: 3908 },
    { name: 'May', growth: 1890, revenue: 4800 },
    { name: 'Jun', growth: 2390, revenue: 3800 },
  ];

  return (
    <FlipchartLayout activePhase={activePhase} onPhaseChange={setActivePhase}>
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-black text-slate-900">Company Growth</h1>
          <p className="text-slate-500 font-medium">Tracking our expansion and success metrics</p>
        </header>

        <Card className="rounded-3xl border-none shadow-lg bg-white overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary to-pink-500 text-white">
            <CardTitle>Revenue Forecast</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1998ec" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1998ec" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} />
                  <YAxis hide />
                  <Tooltip />
                  <Area type="monotone" dataKey="growth" stroke="#1998ec" strokeWidth={3} fillOpacity={1} fill="url(#colorGrowth)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="rounded-3xl border-slate-100 shadow-sm p-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Efficiency</h4>
            <p className="text-2xl font-black text-slate-800">+{summary?.avgPerformanceScore?.toFixed(1)}%</p>
          </Card>
          <Card className="rounded-3xl border-slate-100 shadow-sm p-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Market Cap</h4>
            <p className="text-2xl font-black text-slate-800">$1.2M</p>
          </Card>
        </div>
      </div>
    </FlipchartLayout>
  );
}
