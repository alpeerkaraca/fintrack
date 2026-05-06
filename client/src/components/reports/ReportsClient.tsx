"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Download,
  PieChart as PieChartIcon,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  formatCurrency,
  formatNumber,
} from "@/lib/fintrack";
import { cn } from "@/lib/utils";
import { authFetch } from "@/lib/auth";
import { parseApiResponse } from "@/lib/api";

const CATEGORY_COLORS: Record<string, string> = {
  Housing: "#8b5cf6",
  Food: "#06b6d4",
  Transport: "#10b981",
  Utilities: "#f59e0b",
  Lifestyle: "#ec4899",
  Debt: "#ef4444",
  Installment: "#a855f7",
  Healthcare: "#14b8a6",
  Education: "#3b82f6",
  Entertainment: "#f97316",
  Other: "#64748b",
};

const CATEGORY_PALETTE = [
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#ef4444",
  "#a855f7",
  "#14b8a6",
  "#3b82f6",
  "#f97316",
  "#64748b",
  "#0ea5e9",
];

type ReportSummary = {
  currency: string;
  range: {
    start: string;
    end: string;
  };
  totals: {
    incomeTry: number;
    expenseTry: number;
    netSavingsTry: number;
    savingsRatePct: number;
  };
  averages: {
    monthlyIncomeTry: number;
    monthlyExpenseTry: number;
    monthlySavingsTry: number;
  };
  monthlySeries: {
    month: string;
    label: string;
    incomeTry: number;
    expenseTry: number;
    netSavingsTry: number;
  }[];
  categoryBreakdown: {
    categoryId: string;
    categoryLabel: string;
    totalTry: number;
  }[];
  topCategory?: {
    categoryId: string;
    categoryLabel: string;
    totalTry: number;
  };
  metadata?: {
    generatedAt: string;
    dataPoints?: {
      categories: number;
      months: number;
      transactions: number;
    };
  };
};

const getToday = () => new Date().toISOString().split("T")[0];

const getMonthStart = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
};

export default function ReportsClient() {
  const [selectedView, setSelectedView] = useState<"overview" | "category" | "forecast">(
    "overview",
  );
  const [startDate, setStartDate] = useState(getMonthStart);
  const [endDate, setEndDate] = useState(getToday);
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadReport = async () => {
    if (!startDate || !endDate) {
      setLoadError("Please select a valid date range.");
      return;
    }

    if (startDate > endDate) {
      setLoadError("Start date must be before end date.");
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const query = new URLSearchParams({
        startDate,
        endDate,
      });
      const response = await authFetch(
        `/api/v1/reports/summary?${query.toString()}`,
      );
      const payload = await parseApiResponse<ReportSummary>(response);
      setReport(payload);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Unable to load report.");
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const monthlySeries = useMemo(() => report?.monthlySeries ?? [], [report?.monthlySeries]);
  const monthlyTrend = useMemo(
    () =>
      monthlySeries.map((item) => ({
        month: item.label,
        income: item.incomeTry,
        expenses: item.expenseTry,
        savings: item.netSavingsTry,
      })),
    [monthlySeries],
  );

  const categoryData = useMemo(() => {
    const breakdown = report?.categoryBreakdown ?? [];
    return breakdown
      .map((entry, index) => ({
        category: entry.categoryLabel,
        total: entry.totalTry,
        color:
          CATEGORY_COLORS[entry.categoryLabel] ??
          CATEGORY_PALETTE[index % CATEGORY_PALETTE.length],
      }))
      .sort((a, b) => b.total - a.total);
  }, [report?.categoryBreakdown]);

  const totals = report?.totals;
  const averages = report?.averages;
  const totalIncome = totals?.incomeTry ?? 0;
  const totalExpenses = totals?.expenseTry ?? 0;
  const totalSavings = totals?.netSavingsTry ?? 0;
  const savingsRate = totals?.savingsRatePct ?? 0;
  const avgMonthlyIncome = averages?.monthlyIncomeTry ?? 0;
  const avgMonthlyExpenses = averages?.monthlyExpenseTry ?? 0;
  const avgMonthlySavings = averages?.monthlySavingsTry ?? 0;

  const bestSavings = useMemo(() => {
    if (monthlySeries.length === 0) {
      return null;
    }
    return monthlySeries.reduce((best, current) =>
      current.netSavingsTry > best.netSavingsTry ? current : best,
    );
  }, [monthlySeries]);

  const worstExpense = useMemo(() => {
    if (monthlySeries.length === 0) {
      return null;
    }
    return monthlySeries.reduce((worst, current) =>
      current.expenseTry > worst.expenseTry ? current : worst,
    );
  }, [monthlySeries]);
  const reportingLabel = report?.range
    ? `${report.range.start} - ${report.range.end}`
    : "";

  const handleExport = () => {
    if (!report) {
      return;
    }

    const reportData = {
      generatedAt: report.metadata?.generatedAt ?? new Date().toISOString(),
      range: report.range,
      totals: report.totals,
      averages: report.averages,
      monthlySeries: report.monthlySeries,
      categoryBreakdown: report.categoryBreakdown,
      topCategory: report.topCategory,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fintrack-report-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b-2 border-foreground bg-background px-6 py-6 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="border-2 border-foreground bg-background p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" strokeWidth={3} />
            </Link>
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-tighter text-muted-foreground">
                [ Financial Analytics ]
              </p>
              <h1 className="mt-1 text-3xl font-black uppercase tracking-tighter italic text-foreground">
                Reports
              </h1>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="border-2 border-foreground bg-background p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]">
              <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">Date Range</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-foreground bg-background px-2 py-1 font-mono text-[10px] font-bold uppercase focus:outline-none text-foreground"
                />
                <span className="font-mono text-[10px] font-black uppercase text-muted-foreground/30">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-foreground bg-background px-2 py-1 font-mono text-[10px] font-bold uppercase focus:outline-none text-foreground"
                />
                <button
                  type="button"
                  onClick={loadReport}
                  className="bg-foreground px-4 py-1 font-mono text-[10px] font-black uppercase text-background transition-all hover:bg-foreground/80"
                >
                  Run
                </button>
              </div>
            </div>
            
            <div className="border-2 border-foreground bg-background p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]">
              <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">Report View</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {[
                  { value: "overview", label: "Overview" },
                  { value: "category", label: "Category" },
                  { value: "forecast", label: "Forecast" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedView(option.value as typeof selectedView)}
                    className={cn(
                      "rounded-none border border-foreground px-2 py-1 font-mono text-[10px] font-bold transition-all",
                      option.value === selectedView
                        ? "bg-foreground text-background"
                        : "bg-background text-foreground hover:bg-muted/50",
                    )}
                  >
                    {option.label.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleExport}
              disabled={!report}
              className="flex items-center gap-2 border-2 border-foreground bg-foreground px-6 py-4 font-mono text-xs font-black uppercase text-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none disabled:opacity-50"
            >
              <Download className="h-4 w-4" strokeWidth={3} />
              Export .JSON
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        {loadError && (
          <p className="mb-8 font-mono text-sm font-black uppercase italic text-[#ff0000] underline">
            [ ERROR: {loadError.toUpperCase()} ]
          </p>
        )}
        
        <div className="mb-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-2 border-foreground bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]"
          >
            <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">Total Income</p>
            <div className="mt-4">
              <p className="font-mono text-3xl font-black tracking-tighter text-foreground">{formatCurrency(totalIncome)}</p>
              <p className="mt-2 font-mono text-[10px] font-bold uppercase text-muted-foreground underline decoration-foreground/20">
                AVG: {formatCurrency(avgMonthlyIncome)} / MO
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="border-2 border-foreground bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]"
          >
            <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">Total Expenses</p>
            <div className="mt-4">
              <p className="font-mono text-3xl font-black tracking-tighter text-foreground">{formatCurrency(totalExpenses)}</p>
              <p className="mt-2 font-mono text-[10px] font-bold uppercase text-muted-foreground underline decoration-foreground/20">
                AVG: {formatCurrency(avgMonthlyExpenses)} / MO
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border-2 border-foreground bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]"
          >
            <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">Total Savings</p>
            <div className="mt-4">
              <p
                className={cn(
                  "font-mono text-3xl font-black tracking-tighter",
                  totalSavings >= 0 ? "text-[#00ff00]" : "text-[#ff0000]",
                )}
              >
                {formatCurrency(totalSavings)}
              </p>
              <p className="mt-2 font-mono text-[10px] font-bold uppercase text-muted-foreground underline decoration-foreground/20">
                AVG: {formatCurrency(avgMonthlySavings)} / MO
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="border-2 border-foreground bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]"
          >
            <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">Savings Rate</p>
            <div className="mt-4">
              <p
                className={cn(
                  "font-mono text-3xl font-black tracking-tighter",
                  savingsRate >= 20 ? "text-[#00ff00]" : "text-[#ffff00]",
                )}
              >
                {formatNumber(savingsRate)}%
              </p>
              <p className="mt-2 font-mono text-[10px] font-bold uppercase text-muted-foreground underline decoration-foreground/20 italic">
                {savingsRate >= 20 ? "Target Reached" : "Efficiency Gap"}
              </p>
            </div>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {selectedView === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-10"
            >
              <motion.div
                className="border-2 border-foreground bg-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]"
              >
                <div className="mb-8 flex items-center justify-between border-b-2 border-foreground pb-4">
                  <div>
                    <p className="font-mono text-[10px] font-black uppercase text-muted-foreground">
                      Trend Analysis [ Linear ]
                    </p>
                    <h2 className="font-mono text-xl font-black uppercase italic tracking-tighter text-foreground">Income vs Expenses vs Savings</h2>
                  </div>
                  <Calendar className="h-6 w-6 text-foreground" strokeWidth={3} />
                </div>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrend} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="0" stroke="var(--muted)" vertical={false} />
                      <XAxis 
                        dataKey="month" 
                        stroke="var(--foreground)" 
                        fontFamily="monospace" 
                        fontSize={10} 
                        fontWeight="bold"
                        tickLine={false}
                        axisLine={{ strokeWidth: 2 }}
                      />
                      <YAxis
                        stroke="var(--foreground)"
                        fontFamily="monospace"
                        fontSize={10}
                        fontWeight="bold"
                        tickLine={false}
                        axisLine={{ strokeWidth: 2 }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--background)",
                          border: "2px solid var(--foreground)",
                          borderRadius: "0px",
                          fontFamily: "monospace",
                          fontSize: "12px",
                          fontWeight: "bold",
                          boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)"
                        }}
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                      <Legend 
                        wrapperStyle={{ 
                          fontFamily: "monospace", 
                          fontSize: "10px", 
                          fontWeight: "black",
                          textTransform: "uppercase",
                          paddingTop: "20px"
                        }} 
                      />
                      <Line
                        type="linear"
                        dataKey="income"
                        stroke="#00ff00"
                        strokeWidth={4}
                        dot={{ r: 4, strokeWidth: 2, fill: "var(--background)" }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                        name="Income"
                      />
                      <Line
                        type="linear"
                        dataKey="expenses"
                        stroke="#ff0000"
                        strokeWidth={4}
                        dot={{ r: 4, strokeWidth: 2, fill: "var(--background)" }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                        name="Expenses"
                      />
                      <Line
                        type="linear"
                        dataKey="savings"
                        stroke="#00ffff"
                        strokeWidth={4}
                        dot={{ r: 4, strokeWidth: 2, fill: "var(--background)" }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                        name="Savings"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <div className="grid gap-10 lg:grid-cols-2">
                <motion.div
                  className="border-2 border-foreground bg-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]"
                >
                  <div className="mb-8 border-b-2 border-foreground pb-4">
                    <p className="font-mono text-[10px] font-black uppercase text-muted-foreground">
                      Distribution [ Bar ]
                    </p>
                    <h2 className="font-mono text-xl font-black uppercase italic tracking-tighter text-foreground">Monthly Flow</h2>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyTrend}>
                        <CartesianGrid strokeDasharray="0" stroke="var(--muted)" vertical={false} />
                        <XAxis 
                          dataKey="month" 
                          stroke="var(--foreground)" 
                          fontFamily="monospace" 
                          fontSize={10} 
                          fontWeight="bold"
                          tickLine={false}
                          axisLine={{ strokeWidth: 2 }}
                        />
                        <YAxis
                          stroke="var(--foreground)"
                          fontFamily="monospace"
                          fontSize={10}
                          fontWeight="bold"
                          tickLine={false}
                          axisLine={{ strokeWidth: 2 }}
                          tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "var(--background)",
                            border: "2px solid var(--foreground)",
                            borderRadius: "0px",
                            fontFamily: "monospace",
                            fontSize: "12px",
                            fontWeight: "bold",
                            boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)"
                          }}
                          formatter={(value) => formatCurrency(Number(value))}
                        />
                        <Bar dataKey="income" fill="#00ff00" stroke="var(--foreground)" strokeWidth={2} name="Income" />
                        <Bar dataKey="expenses" fill="#ff0000" stroke="var(--foreground)" strokeWidth={2} name="Expenses" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                <motion.div
                  className="border-2 border-foreground bg-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]"
                >
                  <div className="mb-8 border-b-2 border-foreground pb-4">
                    <p className="font-mono text-[10px] font-black uppercase text-muted-foreground">
                      Performance [ Insights ]
                    </p>
                    <h2 className="font-mono text-xl font-black uppercase italic tracking-tighter text-foreground">Key Highlights</h2>
                  </div>
                  <div className="space-y-6">
                    {[
                      {
                        title: "Best Savings",
                        value: `${bestSavings?.label ?? "-"} // ${formatCurrency(bestSavings?.netSavingsTry ?? 0)}`,
                        icon: ArrowUpRight,
                        bg: "bg-[#00ff00]",
                      },
                      {
                        title: "Max Expense",
                        value: `${worstExpense?.label ?? "-"} // ${formatCurrency(worstExpense?.expenseTry ?? 0)}`,
                        icon: ArrowDownRight,
                        bg: "bg-[#ff0000]",
                      },
                      {
                        title: "Top Sector",
                        value: `${report?.topCategory?.categoryLabel.toUpperCase() ?? "-"} // ${formatCurrency(report?.topCategory?.totalTry ?? 0)}`,
                        icon: PieChartIcon,
                        bg: "bg-[#00ffff]",
                      },
                      {
                        title: "Duration",
                        value: `${monthlySeries.length} MONTHS ANALYZED`,
                        icon: Calendar,
                        bg: "bg-[#ffff00]",
                      },
                    ].map((insight) => (
                      <div
                        key={insight.title}
                        className="border-2 border-foreground bg-background p-4 flex items-center gap-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]"
                      >
                        <div className={cn("border-2 border-foreground p-3 text-black", insight.bg)}>
                          <insight.icon className="h-5 w-5" strokeWidth={3} />
                        </div>
                        <div className="flex-1">
                          <p className="font-mono text-[10px] font-black uppercase text-muted-foreground">{insight.title}</p>
                          <p className="font-mono text-xs font-black uppercase tracking-tight text-foreground">{insight.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {selectedView === "category" && (
            <motion.div
              key="category"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-10 lg:grid-cols-[1fr_1.3fr]"
            >
              <div
                className="border-2 border-foreground bg-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]"
              >
                <div className="mb-8 border-b-2 border-foreground pb-4">
                  <p className="font-mono text-[10px] font-black uppercase text-muted-foreground">
                    Composition [ Pie ]
                  </p>
                  <h2 className="font-mono text-xl font-black uppercase italic tracking-tighter text-foreground">Sector Breakdown</h2>
                </div>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={360}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={140}
                        stroke="var(--foreground)"
                        strokeWidth={2}
                        dataKey="total"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "var(--background)",
                          border: "2px solid var(--foreground)",
                          borderRadius: "0px",
                          fontFamily: "monospace",
                          fontSize: "12px",
                          fontWeight: "bold",
                          boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)"
                        }}
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div
                className="border-2 border-foreground bg-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]"
              >
                <div className="mb-8 flex items-center justify-between border-b-2 border-foreground pb-4">
                  <div>
                    <p className="font-mono text-[10px] font-black uppercase text-muted-foreground">
                      Metrics [ Ledger ]
                    </p>
                    <h2 className="font-mono text-xl font-black uppercase italic tracking-tighter text-foreground">Category Summary</h2>
                  </div>
                  <span className="font-mono text-xs font-black uppercase underline decoration-2 text-foreground">
                    SUM: {formatCurrency(categoryData.reduce((sum, c) => sum + c.total, 0))}
                  </span>
                </div>
                <div className="space-y-4">
                  {categoryData.map((cat, index) => {
                    const percentage = totalExpenses > 0 ? (cat.total / totalExpenses) * 100 : 0;
                    return (
                      <div
                        key={cat.category}
                        className="border-2 border-foreground bg-background p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div
                              className="h-6 w-6 border-2 border-foreground"
                              style={{ backgroundColor: cat.color }}
                            />
                            <div>
                              <p className="font-mono text-sm font-black uppercase tracking-tight text-foreground">{cat.category}</p>
                              <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">
                                {formatNumber(percentage)}% SHARE
                              </p>
                            </div>
                          </div>
                          <p className="font-mono text-lg font-black tracking-tighter text-foreground">{formatCurrency(cat.total)}</p>
                        </div>
                        <div className="h-4 w-full border-2 border-foreground bg-muted/30 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                            className="h-full"
                            style={{
                              backgroundColor: cat.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {selectedView === "forecast" && (
            <motion.div
              key="forecast"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-10"
            >
              <div
                className="border-2 border-foreground bg-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]"
              >
                <div className="mb-8 border-b-2 border-foreground pb-4">
                  <p className="font-mono text-[10px] font-black uppercase text-muted-foreground">
                    Projection [ Delta ]
                  </p>
                  <h2 className="font-mono text-xl font-black uppercase italic tracking-tighter text-foreground">Savings Forecast</h2>
                </div>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="0" stroke="var(--muted)" vertical={false} />
                      <XAxis 
                        dataKey="month" 
                        stroke="var(--foreground)" 
                        fontFamily="monospace" 
                        fontSize={10} 
                        fontWeight="bold"
                        tickLine={false}
                        axisLine={{ strokeWidth: 2 }}
                      />
                      <YAxis
                        stroke="var(--foreground)"
                        fontFamily="monospace"
                        fontSize={10}
                        fontWeight="bold"
                        tickLine={false}
                        axisLine={{ strokeWidth: 2 }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--background)",
                          border: "2px solid var(--foreground)",
                          borderRadius: "0px",
                          fontFamily: "monospace",
                          fontSize: "12px",
                          fontWeight: "bold",
                          boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)"
                        }}
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                      <Bar dataKey="savings" fill="#00ffff" stroke="var(--foreground)" strokeWidth={2} name="Net Savings" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div
                className="border-2 border-foreground bg-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]"
              >
                <div className="mb-8 border-b-2 border-foreground pb-4">
                  <p className="font-mono text-[10px] font-black uppercase text-muted-foreground">
                    Analysis [ Matrix ]
                  </p>
                  <h2 className="font-mono text-xl font-black uppercase italic tracking-tighter text-foreground">Freedom Outlook</h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  {[
                    {
                      title: "MAX SAVINGS",
                      value: formatCurrency(bestSavings?.netSavingsTry ?? 0),
                      sub: bestSavings?.label.toUpperCase() ?? "N/A",
                      color: "text-[#00ff00]",
                    },
                    {
                      title: "MAX EXPENSE",
                      value: formatCurrency(worstExpense?.expenseTry ?? 0),
                      sub: worstExpense?.label.toUpperCase() ?? "N/A",
                      color: "text-[#ff0000]",
                    },
                    {
                      title: "ACCUMULATED",
                      value: formatCurrency(totalSavings),
                      sub: "TOTAL PERIOD SAVINGS",
                      color: "text-foreground",
                    },
                    {
                      title: "PERIOD RATIO",
                      value: `${formatNumber(savingsRate)}%`,
                      sub: "GLOBAL EFFICIENCY",
                      color: "text-[#00ffff]",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="border-2 border-foreground bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]"
                    >
                      <p className="font-mono text-[10px] font-black uppercase text-muted-foreground">{item.title}</p>
                      <p className={cn("mt-4 font-mono text-3xl font-black tracking-tighter", item.color)}>
                        {item.value}
                      </p>
                      <p className="mt-2 font-mono text-[10px] font-bold uppercase text-muted-foreground italic">{item.sub}</p>
                    </div>
                  ))}
                </div>

                <div
                  className="mt-10 border-4 border-foreground bg-[#ffff00] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]"
                >
                  <p className="font-mono text-sm font-black uppercase italic text-black">{"// Forecast Insight"}</p>
                  <p className="mt-4 font-mono text-sm font-bold uppercase leading-relaxed text-black">
                    Financial Protocol: Maintain savings rate {">"}20% to achieve systemic resilience. 
                    Targeting inefficiency in top categories is mandatory for portfolio expansion.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
