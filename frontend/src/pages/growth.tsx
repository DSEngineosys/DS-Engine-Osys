import { useState, useEffect } from "react";
import { FlipchartLayout } from "@/components/flipchart-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, TrendingUp, Users, Loader2, Package } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface DailyPerformancePoint {
  date: string;
  totalWorkspaceHours: number;
  tasksCompleted: number;
  employeeCount: number;
}

interface ProductPerformancePoint {
  date: string;
  profit: number;
  sellingTimePeriod: number;
  productCount: number;
}

export default function GrowthPage() {
  const [activePhase, setActivePhase] = useState<"employee" | "product">("employee");
  
  // Time Period state: From -> To
  const [fromDate, setFromDate] = useState<string>("2024-01-01");
  const [toDate, setToDate] = useState<string>("2024-01-31");

  const [data, setData] = useState<DailyPerformancePoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Product Growth state
  const [prodFromDate, setProdFromDate] = useState<string>("2024-01-01");
  const [prodToDate, setProdToDate] = useState<string>("2024-01-31");
  const [prodData, setProdData] = useState<ProductPerformancePoint[]>([]);
  const [prodLoading, setProdLoading] = useState<boolean>(true);
  const [prodTotalRecords, setProdTotalRecords] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/analytics/employee-daily-performance?fromDate=${fromDate}&toDate=${toDate}`)
      .then((res) => res.json())
      .then((resData) => {
        if (isMounted) {
          if (resData && Array.isArray(resData.chartData)) {
            setData(resData.chartData);
            setTotalRecords(resData.totalRecords || 0);
          } else {
            setData([]);
            setTotalRecords(0);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error fetching employee daily performance:", err);
        if (isMounted) {
          setData([]);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fromDate, toDate]);

  // Product Growth data fetch
  useEffect(() => {
    let isMounted = true;
    setProdLoading(true);

    fetch(`/api/analytics/product-daily-performance?fromDate=${prodFromDate}&toDate=${prodToDate}`)
      .then((res) => res.json())
      .then((resData) => {
        if (isMounted) {
          if (resData && Array.isArray(resData.chartData)) {
            setProdData(resData.chartData);
            setProdTotalRecords(resData.totalRecords || 0);
          } else {
            setProdData([]);
            setProdTotalRecords(0);
          }
          setProdLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error fetching product daily performance:", err);
        if (isMounted) {
          setProdData([]);
          setProdLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [prodFromDate, prodToDate]);

  return (
    <FlipchartLayout activePhase={activePhase} onPhaseChange={setActivePhase}>
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-black text-slate-900">Company Growth</h1>
          <p className="text-slate-500 font-medium font-sans">Tracking workforce analytics and performance trends</p>
        </header>

        {/* First Cell: Employee Growth */}
        <Card className="rounded-3xl border-slate-100 shadow-xl bg-white overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary to-pink-500 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black tracking-tight">Employee</CardTitle>
                <p className="text-white/80 text-xs font-semibold mt-0.5">Employee Growth Analysis</p>
              </div>
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Time Period Filter: From -> To */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-primary" />
                Time Period
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">From</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">To</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Metrics Header */}
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
              <span>Data Records Evaluated: <strong className="text-slate-800">{totalRecords}</strong></span>
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <TrendingUp className="w-3.5 h-3.5" /> Growth Trend
              </span>
            </div>

            {/* Linear Graph (LineChart): totalWorkspaceHours (X) vs tasksCompleted (Y) */}
            <div className="h-[320px] w-full pt-2">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="w-7 h-7 animate-spin text-primary" />
                  <span className="text-xs font-bold">Loading Employee Daily Performance...</span>
                </div>
              ) : data.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No performance data found for selected period ({fromDate} to {toDate})
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="totalWorkspaceHours"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fontWeight: 700, fill: "#64748b" }}
                      label={{
                        value: "Total Workspace Hours (Hours)",
                        position: "insideBottom",
                        offset: -15,
                        style: { fontSize: 11, fontWeight: 800, fill: "#475569" },
                      }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fontWeight: 700, fill: "#64748b" }}
                      label={{
                        value: "Tasks Completed",
                        angle: -90,
                        position: "insideLeft",
                        offset: 15,
                        style: { fontSize: 11, fontWeight: 800, fill: "#475569" },
                      }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload as DailyPerformancePoint;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                              <p className="font-bold text-pink-300">
                                Date: {item.date}
                              </p>
                              <p className="font-semibold text-slate-200">
                                Daily Avg Workspace Hours: <span className="text-white font-bold">{item.totalWorkspaceHours} hrs</span>
                              </p>
                              <p className="font-semibold text-slate-200">
                                Daily Avg Tasks Completed: <span className="text-emerald-400 font-black">{item.tasksCompleted}</span>
                              </p>
                              <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                                Average calculated across all {item.employeeCount} employees
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={() => (
                        <span className="text-xs font-bold text-slate-700">
                          Employee Growth (Workspace Hours vs Tasks Completed)
                        </span>
                      )}
                    />
                    <Line
                      type="monotone"
                      dataKey="tasksCompleted"
                      name="Tasks Completed"
                      stroke="#ec4899"
                      strokeWidth={3.5}
                      dot={{ r: 4, fill: "#ec4899", strokeWidth: 2, stroke: "#ffffff" }}
                      activeDot={{ r: 7, fill: "#be185d" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Second Cell: Product Growth */}
        <Card className="rounded-3xl border-slate-100 shadow-xl bg-white overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-violet-600 to-indigo-500 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black tracking-tight">Product</CardTitle>
                <p className="text-white/80 text-xs font-semibold mt-0.5">Product Growth Analysis</p>
              </div>
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Time Period Filter: From -> To */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-violet-600" />
                Time Period
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">From</label>
                  <input
                    type="date"
                    value={prodFromDate}
                    onChange={(e) => setProdFromDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">To</label>
                  <input
                    type="date"
                    value={prodToDate}
                    onChange={(e) => setProdToDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Metrics Header */}
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
              <span>Data Records Evaluated: <strong className="text-slate-800">{prodTotalRecords}</strong></span>
              <span className="flex items-center gap-1 text-violet-600 font-bold">
                <TrendingUp className="w-3.5 h-3.5" /> Growth Trend
              </span>
            </div>

            {/* Linear Graph (LineChart): Profit (X) vs SellingTimePeriod (Y) */}
            <div className="h-[320px] w-full pt-2">
              {prodLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="w-7 h-7 animate-spin text-violet-600" />
                  <span className="text-xs font-bold">Loading Product Performance...</span>
                </div>
              ) : prodData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No product performance data found for selected period ({prodFromDate} to {prodToDate})
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={prodData} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="profit"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fontWeight: 700, fill: "#64748b" }}
                      label={{
                        value: "Profit (₹)",
                        position: "insideBottom",
                        offset: -15,
                        style: { fontSize: 11, fontWeight: 800, fill: "#475569" },
                      }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fontWeight: 700, fill: "#64748b" }}
                      label={{
                        value: "Selling Time Period (Days)",
                        angle: -90,
                        position: "insideLeft",
                        offset: 15,
                        style: { fontSize: 11, fontWeight: 800, fill: "#475569" },
                      }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload as ProductPerformancePoint;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                              <p className="font-bold text-violet-300">
                                Date: {item.date}
                              </p>
                              <p className="font-semibold text-slate-200">
                                Daily Avg Profit: <span className="text-white font-bold">₹{item.profit}</span>
                              </p>
                              <p className="font-semibold text-slate-200">
                                Daily Avg Selling Time: <span className="text-emerald-400 font-black">{item.sellingTimePeriod} days</span>
                              </p>
                              <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                                Average calculated across {item.productCount} product records
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={() => (
                        <span className="text-xs font-bold text-slate-700">
                          Product Growth (Profit vs Selling Time Period)
                        </span>
                      )}
                    />
                    <Line
                      type="monotone"
                      dataKey="sellingTimePeriod"
                      name="Selling Time Period"
                      stroke="#7c3aed"
                      strokeWidth={3.5}
                      dot={{ r: 4, fill: "#7c3aed", strokeWidth: 2, stroke: "#ffffff" }}
                      activeDot={{ r: 7, fill: "#5b21b6" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </FlipchartLayout>
  );
}
