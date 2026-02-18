"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Download,
  PieChart as PieChartIcon,
  TrendingDown,
  TrendingUp,
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

  const monthlySeries = report?.monthlySeries ?? [];
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
      <div className="border-b border-border bg-card/60 px-6 py-6 lg:px-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="rounded-xl border border-border bg-background/60 p-2.5 transition hover:bg-muted/50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <p className="text-sm text-muted-foreground">Financial Analytics</p>
              <h1 className="text-2xl font-semibold">Reports</h1>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-border bg-card/60 px-4 py-3">
              <p className="text-xs text-muted-foreground">Date Range</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground"
                />
                <span className="text-muted-foreground">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground"
                />
                <button
                  type="button"
                  onClick={loadReport}
                  className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                  Run
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card/60 px-4 py-3">
              <p className="text-xs text-muted-foreground">Report View</p>
              <div className="mt-2 flex flex-wrap gap-2">
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
                      "rounded-lg px-3 py-1 text-xs transition",
                      option.value === selectedView
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/70 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleExport}
              disabled={!report}
              className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              <Download className="h-4 w-4" />
              Export Data
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        {loadError && (
          <p className="mb-4 text-sm text-rose-400">{loadError}</p>
        )}
        {isLoading && (
          <div className="mb-6 rounded-2xl border border-dashed border-border bg-background/60 py-10 text-center">
            <p className="text-sm text-muted-foreground">Loading report...</p>
          </div>
        )}
        {!isLoading && !report && !loadError && (
          <div className="mb-6 rounded-2xl border border-dashed border-border bg-background/60 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Select a date range and run the report.
            </p>
          </div>
        )}
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card/70 p-5">
            <p className="text-xs text-muted-foreground">Total Income</p>
            <div className="mt-4">
              <p className="text-2xl font-semibold">{formatCurrency(totalIncome)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Avg: {formatCurrency(avgMonthlyIncome)}/month
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/70 p-5">
            <p className="text-xs text-muted-foreground">Total Expenses</p>
            <div className="mt-4">
              <p className="text-2xl font-semibold">{formatCurrency(totalExpenses)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Avg: {formatCurrency(avgMonthlyExpenses)}/month
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/70 p-5">
            <p className="text-xs text-muted-foreground">Total Savings</p>
            <div className="mt-4">
              <p
                className={cn(
                  "text-2xl font-semibold",
                  totalSavings >= 0 ? "text-emerald-400" : "text-rose-400",
                )}
              >
                {formatCurrency(totalSavings)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Avg: {formatCurrency(avgMonthlySavings)}/month
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/70 p-5">
            <p className="text-xs text-muted-foreground">Savings Rate</p>
            <div className="mt-4">
              <p
                className={cn(
                  "text-2xl font-semibold",
                  savingsRate >= 20 ? "text-emerald-400" : "text-amber-400",
                )}
              >
                {formatNumber(savingsRate)}%
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {savingsRate >= 20 ? "Healthy rate" : "Room to improve"}
              </p>
            </div>
          </div>
        </div>

        {selectedView === "overview" && (
          <>
            <div className="mb-6 rounded-2xl border border-border bg-card/70 p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Trend Analysis
                  </p>
                  <h2 className="text-lg font-semibold">Income vs Expenses</h2>
                </div>
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrend} margin={{ left: 0, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        borderRadius: 12,
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                      }}
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Income"
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Expenses"
                    />
                    <Line
                      type="monotone"
                      dataKey="savings"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      name="Savings"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card/70 p-6">
                <div className="mb-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Monthly Comparison
                  </p>
                  <h2 className="text-lg font-semibold">Income & Expenses Bar Chart</h2>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrend} margin={{ left: 0, right: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                      <YAxis
                        stroke="var(--muted-foreground)"
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--card)",
                          borderRadius: 12,
                          borderColor: "var(--border)",
                          color: "var(--foreground)",
                        }}
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                      <Legend />
                      <Bar dataKey="income" fill="#10b981" name="Income" />
                      <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card/70 p-6">
                <div className="mb-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Key Insights
                  </p>
                  <h2 className="text-lg font-semibold">Financial Highlights</h2>
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-background/60 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-emerald-500/10 p-2.5 text-emerald-400">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Best Savings Month</p>
                        <p className="text-xs text-muted-foreground">
                          {bestSavings?.label ?? "-"} with{" "}
                          {formatCurrency(bestSavings?.netSavingsTry ?? 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-background/60 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-rose-500/10 p-2.5 text-rose-400">
                        <TrendingDown className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Highest Expense Month</p>
                        <p className="text-xs text-muted-foreground">
                          {worstExpense?.label ?? "-"} with{" "}
                          {formatCurrency(worstExpense?.expenseTry ?? 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-background/60 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2.5 text-primary">
                        <PieChartIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Top Spending Category</p>
                        <p className="text-xs text-muted-foreground">
                          {report?.topCategory?.categoryLabel ?? "-"} -{" "}
                          {formatCurrency(report?.topCategory?.totalTry ?? 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-background/60 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-sky-500/10 p-2.5 text-sky-400">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Reporting Period</p>
                        <p className="text-xs text-muted-foreground">
                          {reportingLabel || "-"} ({monthlySeries.length} months)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {selectedView === "category" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
            <div className="rounded-2xl border border-border bg-card/70 p-6">
              <div className="mb-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Breakdown
                </p>
                <h2 className="text-lg font-semibold">Expense by Category</h2>
              </div>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="total"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        borderRadius: 12,
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                      }}
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/70 p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Details
                  </p>
                  <h2 className="text-lg font-semibold">Category Summary</h2>
                </div>
                <span className="text-xs text-muted-foreground">
                  Total: {formatCurrency(categoryData.reduce((sum, c) => sum + c.total, 0))}
                </span>
              </div>
              <div className="space-y-3">
                {categoryData.map((cat) => {
                  const percentage = totalExpenses > 0 ? (cat.total / totalExpenses) * 100 : 0;
                  return (
                    <div
                      key={cat.category}
                      className="rounded-xl border border-border bg-background/60 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-4 w-4 rounded"
                            style={{ backgroundColor: cat.color }}
                          />
                          <div>
                            <p className="text-sm font-semibold">{cat.category}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatNumber(percentage)}% of total
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold">{formatCurrency(cat.total)}</p>
                      </div>
                      <div className="mt-3 h-2 w-full rounded-full bg-muted/60">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {selectedView === "forecast" && (
          <>
            <div className="mb-6 rounded-2xl border border-border bg-card/70 p-6">
              <div className="mb-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Projection
                </p>
                <h2 className="text-lg font-semibold">Savings Forecast</h2>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrend} margin={{ left: 0, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        borderRadius: 12,
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                      }}
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Legend />
                    <Bar dataKey="savings" fill="#06b6d4" name="Net Savings" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/70 p-6">
              <div className="mb-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Analysis
                </p>
                <h2 className="text-lg font-semibold">Nisan Freedom Outlook</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-background/60 p-5">
                  <p className="text-sm font-semibold">Best Savings Month</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-400">
                    {formatCurrency(bestSavings?.netSavingsTry ?? 0)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {bestSavings?.label ?? "No data"}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-background/60 p-5">
                  <p className="text-sm font-semibold">Highest Expense Month</p>
                  <p className="mt-2 text-2xl font-bold text-rose-400">
                    {formatCurrency(worstExpense?.expenseTry ?? 0)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {worstExpense?.label ?? "No data"}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-background/60 p-5">
                  <p className="text-sm font-semibold">Total Savings</p>
                  <p className="mt-2 text-2xl font-bold text-primary">
                    {formatCurrency(totalSavings)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Net savings across the selected range
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-background/60 p-5">
                  <p className="text-sm font-semibold">Savings Rate</p>
                  <p className="mt-2 text-2xl font-bold text-sky-400">
                    {formatNumber(savingsRate)}
                    %
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Overall savings rate for the range
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-primary/10 p-4">
                <p className="text-sm font-semibold text-primary">💡 Forecast Insight</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Keep your savings rate above 20% to strengthen long-term financial
                  resilience. Review top categories to identify possible reductions.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
