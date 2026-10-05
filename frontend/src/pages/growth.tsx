import { useState, useEffect, useRef } from "react";
import { FlipchartLayout } from "@/components/flipchart-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  Loader2, 
  Package, 
  ZoomIn, 
  ZoomOut,
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight,
  MousePointerClick,
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
  const empLastClickRef = useRef<{ time: number; date: string } | null>(null);

  // Product Growth state
  const [productsList, setProductsList] = useState<{ id: string; name: string; category: string; sku: string }[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [prodFromDate, setProdFromDate] = useState<string>("2024-01-01");
  const [prodToDate, setProdToDate] = useState<string>("2024-12-31");
  const [prodData, setProdData] = useState<{
    label: string;
    profit: number;
    offerAmount: number;
    profitWithOffer: number;
    sellingTimePeriod: number;
    offersApplied?: string;
  }[]>([]);
  const [prodLoading, setProdLoading] = useState<boolean>(false);
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
        if (isMounted) { setData([]); setLoading(false); }
      });

    return () => { isMounted = false; };
  }, [fromDate, toDate]);

  // Fetch products list once on mount
  useEffect(() => {
    fetch("/api/analytics/products-list")
      .then((r) => r.json())
      .then((list) => {
        setProductsList(list);
        if (list.length > 0) setSelectedProductId(list[0].id);
      })
      .catch(console.error);
  }, []);

  // Fetch per-product performance whenever selection or dates change
  useEffect(() => {
    if (!selectedProductId) return;
    let isMounted = true;
    setProdLoading(true);
    fetch(
      `/api/analytics/product-performance-by-product?productId=${selectedProductId}&fromDate=${prodFromDate}&toDate=${prodToDate}`
    )
      .then((r) => r.json())
      .then((res) => {
        if (!isMounted) return;
        setProdData(Array.isArray(res.chartData) ? res.chartData : []);
        setProdTotalRecords(res.totalRecords || 0);
        setProdLoading(false);
      })
      .catch(() => { if (isMounted) { setProdData([]); setProdLoading(false); } });
    return () => { isMounted = false; };
  }, [selectedProductId, prodFromDate, prodToDate]);

  // Handle Double Tap Zoom & Single Click Brief Details for Employee Graph
  const handleEmpPointClick = (point: DailyPerformancePoint) => {
    const now = Date.now();
    if (
      empLastClickRef.current && 
      empLastClickRef.current.date === point.date && 
      (now - empLastClickRef.current.time) < 450
    ) {
      // Double Tap detected -> Zoom in on this point
      const idx = data.findIndex(p => p.date === point.date);
      if (idx !== -1) {
        const currentLen = empZoomIndex ? (empZoomIndex.end - empZoomIndex.start) : data.length;
        const windowSize = Math.max(2, Math.floor(currentLen / 2));
        const half = Math.floor(windowSize / 2);
        const start = Math.max(0, Math.min(idx - half, data.length - windowSize));
        const end = Math.min(data.length, start + windowSize);
        setEmpZoomIndex({ start, end });
        setEmpSelectedPoint(null);
      }
      empLastClickRef.current = null;
    } else {
      empLastClickRef.current = { time: now, date: point.date };
      const clickTime = now;
      setTimeout(() => {
        if (empLastClickRef.current && empLastClickRef.current.time === clickTime) {
          setEmpSelectedPoint(point);
        }
      }, 250);
    }
  };

  const displayedEmpData = empZoomIndex ? data.slice(empZoomIndex.start, empZoomIndex.end) : data;
  const selectedProduct = productsList.find((p) => p.id === selectedProductId);

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
              <div className="flex items-center gap-3">
                {empZoomIndex && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 text-xs font-bold rounded-xl border-white/30 text-white bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all shadow-sm"
                    onClick={() => setEmpZoomIndex(null)}
                  >
                    <ZoomOut className="w-4 h-4 mr-1.5" /> Zoom Out
                  </Button>
                )}
                <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
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
              <div className="flex items-center gap-3">
                {empZoomIndex && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] font-bold rounded-lg border-pink-200 text-pink-700 bg-pink-50 hover:bg-pink-100"
                    onClick={() => setEmpZoomIndex(null)}
                  >
                    <ZoomOut className="w-3.5 h-3.5 mr-1" /> Side Zoom Out
                  </Button>
                )}
                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                  <TrendingUp className="w-3.5 h-3.5" /> Growth Trend
                </span>
              </div>
            </div>

            {/* Interactive Instruction Banner */}
            <div className="flex items-center justify-between bg-pink-50/50 border border-pink-100/70 px-3.5 py-2 rounded-xl text-[11px] font-semibold text-slate-600">
              <span className="flex items-center gap-1.5 text-pink-700 font-bold">
                <MousePointerClick className="w-3.5 h-3.5 text-pink-500" />
                Double tap point to zoom in • Single click for details
              </span>
              {empZoomIndex && (
                <span className="text-[10px] bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full font-bold">
                  Zoomed: {empZoomIndex.end - empZoomIndex.start} points
                </span>
              )}
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
                  <LineChart 
                    data={displayedEmpData} 
                    margin={{ top: 10, right: 20, left: -10, bottom: 25 }}
                    onClick={(state) => {
                      if (state && state.activePayload && state.activePayload.length > 0) {
                        handleEmpPointClick(state.activePayload[0].payload as DailyPerformancePoint);
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
                                Date: {item.date}
                              </p>
                              <p className="text-[10px] text-pink-400 font-semibold">
                                Double tap to zoom in â€¢ Click for details
                              </p>
                              <p className="font-semibold text-slate-200 pt-1">
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
                          Employee Growth (Double tap point to zoom in)
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
                            handleEmpPointClick(payload.payload);
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
        <Card className="rounded-3xl border-slate-100 shadow-xl bg-white overflow-hidden"
        >
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
            {/* Product Selector */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <Package className="w-4 h-4 text-violet-600" />
                Select Product
              </div>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="bg-white border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-violet-500/20 shadow-sm">
                  <SelectValue placeholder="Choose a product..." />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {productsList.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs font-semibold">
                      {p.name}
                      <span className="ml-1 text-slate-400 font-normal">({p.sku})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProduct && (
                <p className="text-[11px] text-violet-600 font-bold uppercase tracking-wider">
                  Category: {selectedProduct.category}
                </p>
              )}
            </div>

            {/* Time Period Filter */}
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
              <span>Records for this product: <strong className="text-slate-800">{prodTotalRecords}</strong></span>
              <span className="flex items-center gap-2 text-violet-600 font-bold">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-violet-600"></span> Base Profit
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 ml-1"></span> Profit + Offer
              </span>
            </div>

            {/* Linear Grid Graph (Base Profit & Offer Applied Lines) */}
            <div className="h-[340px] w-full pt-2">
              {prodLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="w-7 h-7 animate-spin text-violet-600" />
                  <span className="text-xs font-bold">Loading product performance...</span>
                </div>
              ) : !selectedProductId ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Select a product above to view its growth chart
                </div>
              ) : prodData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No performance data found for this product in the selected period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={prodData}
                    margin={{ top: 10, right: 24, left: 10, bottom: 35 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      axisLine={{ stroke: "#cbd5e1" }}
                      tickLine={true}
                      tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }}
                      label={{
                        value: `Days (${prodFromDate} → ${prodToDate})`,
                        position: "insideBottom",
                        offset: -22,
                        style: { fontSize: 11, fontWeight: 800, fill: "#475569" },
                      }}
                    />
                    <YAxis
                      axisLine={{ stroke: "#cbd5e1" }}
                      tickLine={true}
                      tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }}
                      tickFormatter={(value) => `₹${value}`}
                      label={{
                        value: "Profit (Rs)",
                        angle: -90,
                        position: "insideLeft",
                        offset: -4,
                        style: { fontSize: 11, fontWeight: 800, fill: "#475569" },
                      }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const dataPoint = payload[0]?.payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700">
                              <p className="font-bold text-violet-300 flex items-center justify-between gap-3">
                                <span>Day: {label}</span>
                                {dataPoint?.offersApplied && (
                                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-md">
                                    {dataPoint.offersApplied}
                                  </span>
                                )}
                              </p>
                              <div className="space-y-1 pt-1 border-t border-slate-800">
                                <p className="font-semibold text-slate-200 flex justify-between gap-4">
                                  <span className="text-violet-400 font-bold">Base Profit:</span>
                                  <span className="font-black text-violet-300">₹{dataPoint?.profit}</span>
                                </p>
                                <p className="font-semibold text-slate-200 flex justify-between gap-4">
                                  <span className="text-emerald-400 font-bold">Offer Boost:</span>
                                  <span className="font-black text-emerald-300">+₹{dataPoint?.offerAmount || 0}</span>
                                </p>
                                <p className="font-semibold text-slate-100 flex justify-between gap-4 pt-1 border-t border-slate-800/80">
                                  <span className="text-amber-400 font-black">Profit + Offer:</span>
                                  <span className="font-black text-amber-300">₹{dataPoint?.profitWithOffer}</span>
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Line
                      type="linear"
                      dataKey="profit"
                      name="Base Profit (Rs)"
                      stroke="#7c3aed"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#7c3aed", strokeWidth: 2, stroke: "#ffffff" }}
                      activeDot={{ r: 7, fill: "#5b21b6" }}
                    />
                    <Line
                      type="linear"
                      dataKey="profitWithOffer"
                      name="Profit + Offer (Rs)"
                      stroke="#10b981"
                      strokeWidth={3}
                      strokeDasharray="4 4"
                      dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#ffffff" }}
                      activeDot={{ r: 7, fill: "#059669" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Employee Point Details Modal */}
        <Dialog open={!!empSelectedPoint} onOpenChange={(open) => !open && setEmpSelectedPoint(null)}>
          {empSelectedPoint && (() => {
            const details = getEmpPointDetails(data, empSelectedPoint);
            return (
              <DialogContent className="max-w-md bg-white rounded-3xl p-6 border-none shadow-2xl space-y-4">
                <DialogHeader>
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <ZoomIn className="w-5 h-5 text-pink-500" /> Point Details
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

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Workspace Hours</span>
                    <p className="text-lg font-black text-slate-900">{empSelectedPoint.totalWorkspaceHours} <span className="text-xs font-semibold text-slate-500">hrs</span></p>
                    {details.prev && (
                      <span className={`text-[10px] font-bold flex items-center gap-0.5 ${Number(details.hoursPct) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {Number(details.hoursPct) >= 0 ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
                        {details.hoursPct}% vs prev day
                      </span>
                    )}
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tasks Completed</span>
                    <p className="text-lg font-black text-pink-600">{empSelectedPoint.tasksCompleted}</p>
                    {details.prev && (
                      <span className={`text-[10px] font-bold flex items-center gap-0.5 ${Number(details.tasksPct) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {Number(details.tasksPct) >= 0 ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
                        {details.tasksPct}% vs prev day
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-pink-50/60 border border-pink-100 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5 text-pink-700">
                      <Sparkles className="w-4 h-4 text-pink-500" /> Efficiency Ratio
                    </span>
                    <span className="text-sm font-black text-pink-600">{details.efficiency} tasks / hr</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">{details.insight}</p>
                  <div className="text-[10px] text-slate-400 font-semibold pt-1 border-t border-pink-100/80 flex justify-between">
                    <span>Workforce Evaluated:</span>
                    <span className="font-bold text-slate-700">{empSelectedPoint.employeeCount} Employees</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold py-2.5"
                    onClick={() => {
                      const windowSize = Math.max(2, Math.floor(data.length / 2));
                      const half = Math.floor(windowSize / 2);
                      const start = Math.max(0, Math.min(details.idx - half, data.length - windowSize));
                      const end = Math.min(data.length, start + windowSize);
                      setEmpZoomIndex({ start, end });
                      setEmpSelectedPoint(null);
                    }}
                  >
                    <ZoomIn className="w-3.5 h-3.5 mr-1.5" /> Zoom to Point
                  </Button>
                  <Button variant="outline" className="rounded-xl text-xs font-bold py-2.5" onClick={() => setEmpSelectedPoint(null)}>
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
