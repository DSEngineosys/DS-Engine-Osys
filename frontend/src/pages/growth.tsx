import { useState, useEffect } from "react";
import { FlipchartLayout } from "@/components/flipchart-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  Loader2, 
  Package, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search 
} from "lucide-react";
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

function getEmpPointDetails(data: DailyPerformancePoint[], point: DailyPerformancePoint) {
  const idx = data.findIndex(p => p.date === point.date);
  const prev = idx > 0 ? data[idx - 1] : null;

  const hoursDiff = prev ? point.totalWorkspaceHours - prev.totalWorkspaceHours : 0;
  const tasksDiff = prev ? point.tasksCompleted - prev.tasksCompleted : 0;

  const hoursPct = prev && prev.totalWorkspaceHours > 0 
    ? ((hoursDiff / prev.totalWorkspaceHours) * 100).toFixed(1) 
    : "0.0";
  const tasksPct = prev && prev.tasksCompleted > 0 
    ? ((tasksDiff / prev.tasksCompleted) * 100).toFixed(1) 
    : "0.0";

  const efficiency = point.totalWorkspaceHours > 0 
    ? (point.tasksCompleted / point.totalWorkspaceHours).toFixed(2) 
    : "0.00";

  let insight = "Standard operational productivity observed on this date.";
  if (Number(efficiency) > 1.2) {
    insight = "High Efficiency Peak: Exceptionally high task output per workspace hour logged.";
  } else if (Number(efficiency) < 0.5) {
    insight = "Low Output Window: Task completion rate was lower relative to logged workspace hours.";
  } else if (hoursDiff > 0 && tasksDiff > 0) {
    insight = "Positive Growth Correlation: Additional workspace hours directly boosted task completions.";
  }

  return { idx, prev, hoursDiff, tasksDiff, hoursPct, tasksPct, efficiency, insight };
}

function getProdPointDetails(prodData: ProductPerformancePoint[], point: ProductPerformancePoint) {
  const idx = prodData.findIndex(p => p.date === point.date);
  const prev = idx > 0 ? prodData[idx - 1] : null;

  const profitDiff = prev ? point.profit - prev.profit : 0;
  const timeDiff = prev ? point.sellingTimePeriod - prev.sellingTimePeriod : 0;

  const profitPct = prev && prev.profit > 0 
    ? ((profitDiff / prev.profit) * 100).toFixed(1) 
    : "0.0";
  const timePct = prev && prev.sellingTimePeriod > 0 
    ? ((timeDiff / prev.sellingTimePeriod) * 100).toFixed(1) 
    : "0.0";

  const velocity = point.sellingTimePeriod > 0 
    ? (point.profit / point.sellingTimePeriod).toFixed(2) 
    : "0.00";

  let insight = "Steady product profitability and inventory turnover velocity.";
  if (Number(velocity) > 100) {
    insight = "High Margin Velocity: Rapid selling rate with strong daily profit return per day.";
  } else if (profitDiff > 0 && timeDiff <= 0) {
    insight = "Optimized Sales Cycle: Profit increased while selling period decreased or held stable.";
  } else if (profitDiff < 0) {
    insight = "Margin Contraction: Reduced profit yield recorded for this product window.";
  }

  return { idx, prev, profitDiff, timeDiff, profitPct, timePct, velocity, insight };
}

export default function GrowthPage() {
  const [activePhase, setActivePhase] = useState<"employee" | "product">("employee");
  
  // Employee Growth state
  const [fromDate, setFromDate] = useState<string>("2024-01-01");
  const [toDate, setToDate] = useState<string>("2024-01-31");
  const [data, setData] = useState<DailyPerformancePoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [empZoomIndex, setEmpZoomIndex] = useState<{ start: number; end: number } | null>(null);
  const [empSelectedPoint, setEmpSelectedPoint] = useState<DailyPerformancePoint | null>(null);

  // Product Growth state
  const [prodFromDate, setProdFromDate] = useState<string>("2024-01-01");
  const [prodToDate, setProdToDate] = useState<string>("2024-01-31");
  const [prodData, setProdData] = useState<ProductPerformancePoint[]>([]);
  const [prodLoading, setProdLoading] = useState<boolean>(true);
  const [prodTotalRecords, setProdTotalRecords] = useState<number>(0);
  const [prodZoomIndex, setProdZoomIndex] = useState<{ start: number; end: number } | null>(null);
  const [prodSelectedPoint, setProdSelectedPoint] = useState<ProductPerformancePoint | null>(null);

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
            setEmpZoomIndex(null);
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
            setProdZoomIndex(null);
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

  // Employee Zoom Handlers
  const handleEmpZoomIn = () => {
    const current = empZoomIndex || { start: 0, end: data.length };
    const len = current.end - current.start;
    if (len <= 2) return;
    const quarter = Math.max(1, Math.floor(len / 4));
    setEmpZoomIndex({
      start: Math.min(current.start + quarter, data.length - 2),
      end: Math.max(current.end - quarter, current.start + 2)
    });
  };

  const handleEmpZoomOut = () => {
    if (!empZoomIndex) return;
    const len = empZoomIndex.end - empZoomIndex.start;
    const quarter = Math.max(1, Math.floor(len / 2));
    const newStart = Math.max(0, empZoomIndex.start - quarter);
    const newEnd = Math.min(data.length, empZoomIndex.end + quarter);
    if (newStart === 0 && newEnd === data.length) {
      setEmpZoomIndex(null);
    } else {
      setEmpZoomIndex({ start: newStart, end: newEnd });
    }
  };

  const handleEmpZoomToPoint = (pointIndex: number) => {
    const windowSize = Math.min(4, data.length);
    const half = Math.floor(windowSize / 2);
    const start = Math.max(0, Math.min(pointIndex - half, data.length - windowSize));
    const end = Math.min(data.length, start + windowSize);
    setEmpZoomIndex({ start, end });
  };

  // Product Zoom Handlers
  const handleProdZoomIn = () => {
    const current = prodZoomIndex || { start: 0, end: prodData.length };
    const len = current.end - current.start;
    if (len <= 2) return;
    const quarter = Math.max(1, Math.floor(len / 4));
    setProdZoomIndex({
      start: Math.min(current.start + quarter, prodData.length - 2),
      end: Math.max(current.end - quarter, current.start + 2)
    });
  };

  const handleProdZoomOut = () => {
    if (!prodZoomIndex) return;
    const len = prodZoomIndex.end - prodZoomIndex.start;
    const quarter = Math.max(1, Math.floor(len / 2));
    const newStart = Math.max(0, prodZoomIndex.start - quarter);
    const newEnd = Math.min(prodData.length, prodZoomIndex.end + quarter);
    if (newStart === 0 && newEnd === prodData.length) {
      setProdZoomIndex(null);
    } else {
      setProdZoomIndex({ start: newStart, end: newEnd });
    }
  };

  const handleProdZoomToPoint = (pointIndex: number) => {
    const windowSize = Math.min(4, prodData.length);
    const half = Math.floor(windowSize / 2);
    const start = Math.max(0, Math.min(pointIndex - half, prodData.length - windowSize));
    const end = Math.min(prodData.length, start + windowSize);
    setProdZoomIndex({ start, end });
  };

  const displayedEmpData = empZoomIndex ? data.slice(empZoomIndex.start, empZoomIndex.end) : data;
  const displayedProdData = prodZoomIndex ? prodData.slice(prodZoomIndex.start, prodZoomIndex.end) : prodData;

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

            {/* Zoom Controls Bar */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600">
              <div className="flex items-center gap-1.5 text-slate-700">
                <Search className="w-4 h-4 text-pink-500" />
                <span>Graph Zoom Controls:</span>
                {empZoomIndex ? (
                  <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded-md font-mono text-[11px]">
                    Zoomed ({empZoomIndex.end - empZoomIndex.start} of {data.length} points)
                  </span>
                ) : (
                  <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md text-[11px]">
                    Full View ({data.length} points)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-xs rounded-xl font-bold border-slate-200 bg-white hover:bg-slate-100"
                  onClick={handleEmpZoomIn}
                  disabled={data.length <= 2}
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5 mr-1 text-pink-600" /> Zoom In
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-xs rounded-xl font-bold border-slate-200 bg-white hover:bg-slate-100"
                  onClick={handleEmpZoomOut}
                  disabled={!empZoomIndex}
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5 mr-1 text-slate-600" /> Zoom Out
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2.5 text-xs rounded-xl font-bold text-slate-500 hover:bg-slate-200/60"
                  onClick={() => setEmpZoomIndex(null)}
                  disabled={!empZoomIndex}
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
                </Button>
              </div>
            </div>

            {/* Linear Graph (LineChart): totalWorkspaceHours (X) vs tasksCompleted (Y) */}
            <div className="h-[320px] w-full pt-2 relative">
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
                  <LineChart 
                    data={displayedEmpData} 
                    margin={{ top: 10, right: 20, left: -10, bottom: 25 }}
                    onClick={(state) => {
                      if (state && state.activePayload && state.activePayload.length > 0) {
                        setEmpSelectedPoint(state.activePayload[0].payload as DailyPerformancePoint);
                      }
                    }}
                  >
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
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 cursor-pointer">
                              <p className="font-bold text-pink-300">
                                Date: {item.date} (Click for Brief Zoom Details)
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
                          Employee Growth (Click point for Zoom Brief Details)
                        </span>
                      )}
                    />
                    <Line
                      type="monotone"
                      dataKey="tasksCompleted"
                      name="Tasks Completed"
                      stroke="#ec4899"
                      strokeWidth={3.5}
                      dot={{ r: 5, fill: "#ec4899", strokeWidth: 2, stroke: "#ffffff", cursor: "pointer" }}
                      activeDot={{ 
                        r: 8, 
                        fill: "#be185d", 
                        cursor: "pointer",
                        onClick: (_: any, payload: any) => {
                          if (payload && payload.payload) {
                            setEmpSelectedPoint(payload.payload);
                          }
                        } 
                      }}
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

            {/* Zoom Controls Bar */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600">
              <div className="flex items-center gap-1.5 text-slate-700">
                <Search className="w-4 h-4 text-violet-600" />
                <span>Graph Zoom Controls:</span>
                {prodZoomIndex ? (
                  <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-md font-mono text-[11px]">
                    Zoomed ({prodZoomIndex.end - prodZoomIndex.start} of {prodData.length} points)
                  </span>
                ) : (
                  <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md text-[11px]">
                    Full View ({prodData.length} points)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-xs rounded-xl font-bold border-slate-200 bg-white hover:bg-slate-100"
                  onClick={handleProdZoomIn}
                  disabled={prodData.length <= 2}
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5 mr-1 text-violet-600" /> Zoom In
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-xs rounded-xl font-bold border-slate-200 bg-white hover:bg-slate-100"
                  onClick={handleProdZoomOut}
                  disabled={!prodZoomIndex}
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5 mr-1 text-slate-600" /> Zoom Out
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2.5 text-xs rounded-xl font-bold text-slate-500 hover:bg-slate-200/60"
                  onClick={() => setProdZoomIndex(null)}
                  disabled={!prodZoomIndex}
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
                </Button>
              </div>
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
                  <LineChart 
                    data={displayedProdData} 
                    margin={{ top: 10, right: 20, left: -10, bottom: 25 }}
                    onClick={(state) => {
                      if (state && state.activePayload && state.activePayload.length > 0) {
                        setProdSelectedPoint(state.activePayload[0].payload as ProductPerformancePoint);
                      }
                    }}
                  >
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
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 cursor-pointer">
                              <p className="font-bold text-violet-300">
                                Date: {item.date} (Click for Brief Zoom Details)
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
                          Product Growth (Click point for Zoom Brief Details)
                        </span>
                      )}
                    />
                    <Line
                      type="monotone"
                      dataKey="sellingTimePeriod"
                      name="Selling Time Period"
                      stroke="#7c3aed"
                      strokeWidth={3.5}
                      dot={{ r: 5, fill: "#7c3aed", strokeWidth: 2, stroke: "#ffffff", cursor: "pointer" }}
                      activeDot={{ 
                        r: 8, 
                        fill: "#5b21b6", 
                        cursor: "pointer",
                        onClick: (_: any, payload: any) => {
                          if (payload && payload.payload) {
                            setProdSelectedPoint(payload.payload);
                          }
                        } 
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Employee Zoomed Point Brief Details Modal */}
        <Dialog open={!!empSelectedPoint} onOpenChange={(open) => !open && setEmpSelectedPoint(null)}>
          {empSelectedPoint && (() => {
            const details = getEmpPointDetails(data, empSelectedPoint);
            return (
              <DialogContent className="max-w-md bg-white rounded-3xl p-6 border-none shadow-2xl space-y-4">
                <DialogHeader>
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <ZoomIn className="w-5 h-5 text-pink-500" /> Point Zoom Details
                      </DialogTitle>
                      <DialogDescription className="text-xs text-slate-500 font-semibold mt-0.5">
                        Date: {empSelectedPoint.date}
                      </DialogDescription>
                    </div>
                    <span className="text-xs font-bold bg-pink-100 text-pink-700 px-2.5 py-1 rounded-full">
                      Day {details.idx + 1} of {data.length}
                    </span>
                  </div>
                </DialogHeader>

                {/* Detailed Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Workspace Hours (X)</span>
                    <p className="text-lg font-black text-slate-900">{empSelectedPoint.totalWorkspaceHours} <span className="text-xs font-semibold text-slate-500">hrs</span></p>
                    {details.prev && (
                      <span className={`text-[10px] font-bold flex items-center gap-0.5 ${Number(details.hoursPct) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {Number(details.hoursPct) >= 0 ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
                        {details.hoursPct}% vs prev day
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tasks Completed (Y)</span>
                    <p className="text-lg font-black text-pink-600">{empSelectedPoint.tasksCompleted}</p>
                    {details.prev && (
                      <span className={`text-[10px] font-bold flex items-center gap-0.5 ${Number(details.tasksPct) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {Number(details.tasksPct) >= 0 ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
                        {details.tasksPct}% vs prev day
                      </span>
                    )}
                  </div>
                </div>

                {/* Efficiency Ratio Banner */}
                <div className="bg-pink-50/60 border border-pink-100 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5 text-pink-700">
                      <Sparkles className="w-4 h-4 text-pink-500" />
                      Efficiency Ratio
                    </span>
                    <span className="text-sm font-black text-pink-600">{details.efficiency} tasks / hr</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {details.insight}
                  </p>
                  <div className="text-[10px] text-slate-400 font-semibold pt-1 border-t border-pink-100/80 flex justify-between">
                    <span>Workforce Evaluated:</span>
                    <span className="font-bold text-slate-700">{empSelectedPoint.employeeCount} Employees</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold py-2.5"
                    onClick={() => {
                      handleEmpZoomToPoint(details.idx);
                      setEmpSelectedPoint(null);
                    }}
                  >
                    <ZoomIn className="w-3.5 h-3.5 mr-1.5" /> Zoom Chart to Point
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl text-xs font-bold py-2.5"
                    onClick={() => setEmpSelectedPoint(null)}
                  >
                    Close
                  </Button>
                </div>
              </DialogContent>
            );
          })()}
        </Dialog>

        {/* Product Zoomed Point Brief Details Modal */}
        <Dialog open={!!prodSelectedPoint} onOpenChange={(open) => !open && setProdSelectedPoint(null)}>
          {prodSelectedPoint && (() => {
            const details = getProdPointDetails(prodData, prodSelectedPoint);
            return (
              <DialogContent className="max-w-md bg-white rounded-3xl p-6 border-none shadow-2xl space-y-4">
                <DialogHeader>
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <ZoomIn className="w-5 h-5 text-violet-600" /> Point Zoom Details
                      </DialogTitle>
                      <DialogDescription className="text-xs text-slate-500 font-semibold mt-0.5">
                        Date: {prodSelectedPoint.date}
                      </DialogDescription>
                    </div>
                    <span className="text-xs font-bold bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full">
                      Day {details.idx + 1} of {prodData.length}
                    </span>
                  </div>
                </DialogHeader>

                {/* Detailed Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Profit (X)</span>
                    <p className="text-lg font-black text-emerald-600">₹{prodSelectedPoint.profit}</p>
                    {details.prev && (
                      <span className={`text-[10px] font-bold flex items-center gap-0.5 ${Number(details.profitPct) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {Number(details.profitPct) >= 0 ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
                        {details.profitPct}% vs prev day
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Selling Time (Y)</span>
                    <p className="text-lg font-black text-violet-600">{prodSelectedPoint.sellingTimePeriod} <span className="text-xs font-semibold text-slate-500">days</span></p>
                    {details.prev && (
                      <span className={`text-[10px] font-bold flex items-center gap-0.5 ${Number(details.timePct) <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {Number(details.timePct) <= 0 ? <ArrowDownRight className="w-3 h-3"/> : <ArrowUpRight className="w-3 h-3"/>}
                        {details.timePct}% vs prev day
                      </span>
                    )}
                  </div>
                </div>

                {/* Profit Velocity Banner */}
                <div className="bg-violet-50/60 border border-violet-100 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5 text-violet-700">
                      <Sparkles className="w-4 h-4 text-violet-600" />
                      Profit Velocity Ratio
                    </span>
                    <span className="text-sm font-black text-violet-600">₹{details.velocity} / day</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {details.insight}
                  </p>
                  <div className="text-[10px] text-slate-400 font-semibold pt-1 border-t border-violet-100/80 flex justify-between">
                    <span>Products Evaluated:</span>
                    <span className="font-bold text-slate-700">{prodSelectedPoint.productCount} Products</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold py-2.5"
                    onClick={() => {
                      handleProdZoomToPoint(details.idx);
                      setProdSelectedPoint(null);
                    }}
                  >
                    <ZoomIn className="w-3.5 h-3.5 mr-1.5" /> Zoom Chart to Point
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl text-xs font-bold py-2.5"
                    onClick={() => setProdSelectedPoint(null)}
                  >
                    Close
                  </Button>
                </div>
              </DialogContent>
            );
          })()}
        </Dialog>
      </div>
    </FlipchartLayout>
  );
}
