"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Coins,
  CreditCard,
  DollarSign,
  TurkishLira,
  Wallet,
} from "lucide-react";

import {
  formatCurrency,
  formatCurrencyTrimZeros,
  formatNumber,
  type CategoryMeta,
  type InvestmentAsset,
  type Transaction,
} from "@/lib/fintrack";
import { cn } from "@/lib/utils";
import { authFetch } from "@/lib/auth";
import { parseApiResponse } from "@/lib/api";

type DashboardSummary = {
  income: number;
  expense: number;
  savings: number;
  creditCardLimit: number;
  usdRate: number;
};

type DashboardForecastItem = {
  month: string;
  label: string;
  savings: number;
};

type CategoryWatchlistItem = {
  category: string;
  limitTry: number;
  spentTry: number;
  alertLevel?: "normal" | "warning" | "danger";
};

type SavingsGoal = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate?: string;
  progressPercent: number;
};

type TransactionPage = {
  content?: Transaction[];
  pageNumber?: number;
  pageSize?: number;
  totalElements?: number;
  totalPages?: number;
  first?: boolean;
  last?: boolean;
  hasNext?: boolean;
  hasPrevious?: boolean;
};

type DashboardOverview = {
  summary: DashboardSummary;
  forecast: DashboardForecastItem[];
  categoryWatchlist: CategoryWatchlistItem[];
  investments: InvestmentAsset[];
  savingsGoals: SavingsGoal[];
  currentUsdTryRate?: number;
  recentTransactions?: TransactionPage;
};

type MonthOption = {
  value: string;
  label: string;
};

const getCurrentMonthKey = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
};

const parseMonthKey = (value: string) => {
  const [year, month] = value.split("-");
  return { year: Number(year), month: Number(month) };
};

const getLimitState = (category: CategoryWatchlistItem) => {
  if (category.alertLevel) {
    return category.alertLevel;
  }

  if (category.limitTry <= 0) {
    return "normal";
  }

  const ratio = category.spentTry / category.limitTry;
  if (ratio >= 1) {
    return "danger";
  }
  if (ratio >= 0.85) {
    return "warning";
  }
  return "normal";
};

const formatAssetName = (name: string) =>
  name.length > 30 ? `${name.slice(0, 30).trim()}...` : name;

export default function DashboardClient() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey);
  const [dashboard, setDashboard] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryMeta[]>([]);
  const [monthOptions, setMonthOptions] = useState<MonthOption[]>([]);

  const categoryMap = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category.label]));
  }, [categories]);

  const getCategoryLabel = (categoryId: string) => {
    return categoryMap.get(categoryId) ?? categoryId;
  };

  useEffect(() => {
    let isActive = true;

    const loadMonthOptions = async () => {
      try {
        const response = await authFetch("/api/v1/metadata/available-months");
        const payload = await parseApiResponse<MonthOption[]>(response);
        if (isActive) {
          setMonthOptions(Array.isArray(payload) ? payload : []);
        }
      } catch {
        if (isActive) {
          setMonthOptions([{ value: getCurrentMonthKey(), label: "Current Month" }]);
        }
      }
    };

    loadMonthOptions();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    const { month, year } = parseMonthKey(selectedMonth);

    if (Number.isNaN(month) || Number.isNaN(year)) {
      setError("Invalid month selection.");
      setIsLoading(false);
      return undefined;
    }

    const loadDashboard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams({
          month: String(month),
          year: String(year),
          page: "0",
          size: "15",
        });

        const response = await authFetch(
          `/api/v1/dashboard/overview?${query.toString()}`,
        );

        const payload = await parseApiResponse<DashboardOverview>(response);
        if (!isActive) {
          return;
        }

        setDashboard(payload);
      } catch (err) {
        if (!isActive) {
          return;
        }
        setError(err instanceof Error ? err.message : "Unable to load dashboard.");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadDashboard();
    return () => {
      isActive = false;
    };
  }, [selectedMonth]);

  useEffect(() => {
    let isActive = true;

    const loadCategories = async () => {
      try {
        const response = await authFetch("/api/v1/metadata/categories");
        const payload = await parseApiResponse<CategoryMeta[]>(response);
        if (isActive) {
          setCategories(payload ?? []);
        }
      } catch {
        if (isActive) {
          setCategories([]);
        }
      }
    };

    loadCategories();
    return () => {
      isActive = false;
    };
  }, []);

  const selectedMonthLabel =
    monthOptions.find((m) => m.value === selectedMonth)?.label ?? selectedMonth;
  const summary = dashboard?.summary;
  const recentTransactions = dashboard?.recentTransactions?.content ?? [];

  const latestTransactions = recentTransactions.slice(0, 6);
  const installmentTransactions = recentTransactions
    .filter((transaction) => transaction.isInstallment)
    .slice(0, 5);

  const bossFightTriggered = summary
    ? summary.expense / summary.income > 0.85
    : false;
  const creditCardRemaining = summary?.creditCardLimit ?? 0;

  const netSavingsChart = useMemo(
    () =>
      (dashboard?.forecast ?? []).map((item) => ({
        month: item.label,
        netSavings: Number((item.savings / 1000).toFixed(1)),
      })),
    [dashboard?.forecast],
  );

  if (isLoading && !dashboard) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div data-testid="dashboard-loading-spinner" className="h-12 w-12 animate-spin rounded-none border-4 border-foreground border-t-yellow-300" />
      </div>
    );
  }

  return (
    <>
      <div className="border-b-4 border-foreground bg-background px-6 py-10 lg:px-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500 mb-1">Authenticated_Session</p>
            <h2 className="text-4xl font-black uppercase tracking-tighter">System_Overview</h2>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="rounded-none border-2 border-foreground bg-muted/30 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 mb-2">Temporal_Index</p>
              <div className="flex flex-wrap gap-2">
                {monthOptions.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSelectedMonth(item.value)}
                    className={cn(
                      "rounded-none border-2 border-foreground px-4 py-1 text-xs font-mono font-bold transition-none",
                      item.value === selectedMonth
                        ? "bg-black text-white"
                        : "bg-background text-slate-900 hover:bg-yellow-300",
                    )}
                  >
                    {item.label.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        {error ? (
          <p className="mt-4 font-mono text-xs font-bold text-red-600 bg-red-100 p-2 border-2 border-red-600 inline-block">ERROR: {error.toUpperCase()}</p>
        ) : isLoading ? (
          <p className="mt-4 font-mono text-xs font-bold text-slate-500 animate-pulse uppercase">Syncing_Data_Stream...</p>
        ) : null}
      </div>

      <section className="px-6 py-10 lg:px-10">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-none border-4 border-foreground bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]"
          >
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground mb-4">Total_Income</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-mono font-black tracking-tighter text-[#00FF00]">
                  {formatCurrency(summary?.income ?? 0)}
                </p>
                <p className="mt-1 text-[10px] font-mono font-bold uppercase text-slate-400">Status: Nominal</p>
              </div>
              <div className="border-4 border-foreground bg-[#00FF00] p-2 text-black">
                <ArrowUpRight className="h-6 w-6 stroke-[3px]" />
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-none border-4 border-foreground bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]"
          >
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground mb-4">Total_Expenses</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-mono font-black tracking-tighter text-[#FF0000]">
                  {formatCurrency(summary?.expense ?? 0)}
                </p>
                <p className="mt-1 text-[10px] font-mono font-bold uppercase text-slate-400">Usage: Active</p>
              </div>
              <div className="border-4 border-foreground bg-[#FF0000] p-2 text-white">
                <ArrowDownRight className="h-6 w-6 stroke-[3px]" />
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-none border-4 border-foreground bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]"
          >
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground mb-4">Net_Savings</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-mono font-black tracking-tighter text-sky-600 dark:text-sky-400">
                  {formatCurrency(summary?.savings ?? 0)}
                </p>
                <p className="mt-1 text-[10px] font-mono font-bold uppercase text-slate-400">Delta_Value</p>
              </div>
              <div className="border-4 border-foreground bg-sky-600 p-2 text-white">
                <Wallet className="h-6 w-6 stroke-[3px]" />
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-none border-4 border-foreground bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]"
          >
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground mb-4">Available_Credit</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-mono font-black tracking-tighter text-amber-600 dark:text-amber-400">
                  {formatCurrency(creditCardRemaining)}
                </p>
                <p className="mt-1 text-[10px] font-mono font-bold uppercase text-slate-400">Limit_Buffer</p>
              </div>
              <div className="border-4 border-foreground bg-amber-600 p-2 text-white">
                <CreditCard className="h-6 w-6 stroke-[3px]" />
              </div>
            </div>
          </motion.div>
        </div>

        {(latestTransactions.length > 0 || installmentTransactions.length > 0) && (
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
            {latestTransactions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-none border-4 border-foreground bg-background p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)]"
              >
                <div className="flex items-center justify-between border-b-4 border-foreground pb-6 mb-6">
                  <div>
                    <p className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-muted-foreground">Event_Log</p>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">Recent_Activity</h3>
                  </div>
                </div>
                <div className="space-y-4">
                  {latestTransactions.map((transaction) => (
                    <Link
                      key={transaction.id}
                      href={`/budget?category=${transaction.category}`}
                      className="flex items-center justify-between rounded-none border-2 border-foreground bg-background px-6 py-4 hover:bg-foreground hover:text-background transition-none group"
                    >
                      <div>
                        <p className="font-mono font-black uppercase text-sm">{transaction.title}</p>
                        <p className="font-mono text-[10px] font-bold text-muted-foreground uppercase group-hover:text-background/60">
                          {getCategoryLabel(transaction.category)} // {transaction.date}
                        </p>
                      </div>
                      <p
                        className={cn(
                          "font-mono font-black text-sm",
                          transaction.type === "expense"
                            ? "text-[#FF0000] group-hover:text-background"
                            : "text-[#00FF00] group-hover:text-background",
                        )}
                      >
                        {transaction.type === "expense" ? "-" : "+"}
                        {formatCurrency(transaction.amountTry)}
                      </p>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}

            {installmentTransactions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-none border-4 border-foreground bg-background p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)]"
              >
                <div className="flex items-center justify-between border-b-4 border-foreground pb-6 mb-6">
                  <div>
                    <p className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-muted-foreground">Schedule_Sync</p>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">Active_Installments</h3>
                  </div>
                </div>
                <div className="space-y-4">
                  {installmentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="rounded-none border-2 border-foreground bg-muted/30 px-6 py-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-mono font-black uppercase text-sm text-foreground">{transaction.title}</p>
                          <p className="font-mono text-[10px] font-bold text-muted-foreground uppercase">
                            {getCategoryLabel(transaction.category)} // {transaction.date}
                          </p>
                        </div>
                        <p className="font-mono font-black text-sm text-amber-600 dark:text-amber-400">
                          {formatCurrency(transaction.amountTry)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-8 font-mono text-[10px] font-bold text-muted-foreground uppercase leading-tight italic">
                  * DISTRIBUTION_ALGORITHM_APPLIED_AUTOMATICALLY_ACROSS_TIME_AXIS.
                </p>
              </motion.div>
            )}
          </div>
        )}

        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          {netSavingsChart.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-none border-4 border-foreground bg-background p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)]"
            >
              <div className="flex items-center justify-between border-b-4 border-foreground pb-6 mb-6 text-foreground">
                <div>
                  <p className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-muted-foreground">Predictive_Analysis</p>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Savings_Forecast</h3>
                </div>
              </div>
              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={netSavingsChart} margin={{ left: -20, right: 0, bottom: 0 }}>
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: 'currentColor', fontWeight: 'bold', fontSize: 10, fontFamily: 'monospace' }}
                      tickLine={{ stroke: 'currentColor', strokeWidth: 2 }}
                      axisLine={{ stroke: 'currentColor', strokeWidth: 2 }}
                    />
                    <YAxis
                      tick={{ fill: 'currentColor', fontWeight: 'bold', fontSize: 10, fontFamily: 'monospace' }}
                      tickLine={{ stroke: 'currentColor', strokeWidth: 2 }}
                      axisLine={{ stroke: 'currentColor', strokeWidth: 2 }}
                      tickFormatter={(value) => `${value}K`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--background)",
                        borderRadius: 0,
                        border: "4px solid var(--foreground)",
                        fontFamily: "monospace",
                        fontWeight: "bold",
                        color: "var(--foreground)"
                      }}
                      cursor={{ stroke: 'currentColor', strokeWidth: 2 }}
                      formatter={(value) => [
                        `${formatNumber(Number(value) * 1000)} TL`,
                        "NET_SAVINGS",
                      ]}
                    />
                    <Area
                      type="stepAfter"
                      dataKey="netSavings"
                      stroke="currentColor"
                      fill="#FFFF00"
                      fillOpacity={0.4}
                      strokeWidth={4}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {(dashboard?.categoryWatchlist ?? []).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-none border-4 border-foreground bg-background p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)]"
            >
              <div className="flex items-center justify-between border-b-4 border-foreground pb-6 mb-6">
                <div>
                  <p className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-muted-foreground">Threshold_Monitor</p>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">Category_Watchlist</h3>
                </div>
              </div>
              <div className="space-y-6">
                {(dashboard?.categoryWatchlist ?? []).map((category, index) => {
                  const state = getLimitState(category);
                  const ratio =
                    category.limitTry > 0
                      ? Math.min((category.spentTry / category.limitTry) * 100, 100)
                      : 0;
                  return (
                    <motion.div
                      key={category.category}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-black uppercase text-xs text-foreground">{getCategoryLabel(category.category)}</span>
                        <span className="font-mono font-bold text-[10px] bg-foreground text-background px-2 py-0.5">
                          {formatCurrency(category.spentTry)} / {formatCurrency(category.limitTry)}
                        </span>
                      </div>
                      <div className="h-6 w-full rounded-none border-2 border-foreground bg-muted/20 p-0.5">
                        <div
                          className={cn(
                            "h-full transition-all duration-500",
                            state === "danger"
                              ? "bg-[#FF0000]"
                              : state === "warning"
                                ? "bg-yellow-400"
                                : "bg-[#00FF00]",
                          )}
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {(dashboard?.investments ?? []).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-none border-4 border-foreground bg-background p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)]"
            >
              <div className="flex items-center justify-between border-b-4 border-foreground pb-6 mb-6">
                <div>
                  <p className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-muted-foreground">Asset_Inventory</p>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">Investment_Vault</h3>
                </div>
              </div>
              <div className="space-y-4">
                {(dashboard?.investments ?? []).map((asset) => (
                  <motion.div
                    key={asset.symbol}
                    className="rounded-none border-2 border-foreground bg-background p-4 hover:bg-muted/10 transition-none"
                  >
                    <div className="flex items-center justify-between border-b-2 border-foreground pb-3 mb-3">
                      <div>
                        <p className="font-mono font-black text-lg uppercase tracking-tight text-foreground">{asset.symbol}</p>
                        <p className="font-mono text-[10px] font-bold text-muted-foreground uppercase">
                          {formatAssetName(asset.name)}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "border-2 border-foreground px-3 py-1 font-mono font-black text-xs",
                          asset.changePercent >= 0
                            ? "bg-[#00FF00] text-black"
                            : "bg-[#FF0000] text-white",
                        )}
                      >
                        {asset.changePercent >= 0 ? "+" : ""}
                        {asset.changePercent.toFixed(2)}%
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-mono font-bold uppercase text-muted-foreground">Qty</p>
                        <p className="font-mono font-black text-foreground">{asset.quantity}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono font-bold uppercase text-muted-foreground">Avg_Cost</p>
                        <p className="font-mono font-black flex items-center gap-1 text-foreground">
                          {formatCurrencyTrimZeros(asset.avgCostTry, "TRY", 4)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {(dashboard?.savingsGoals ?? []).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-none border-4 border-foreground bg-background p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)]"
            >
              <div className="flex items-center justify-between border-b-4 border-foreground pb-6 mb-6">
                <div>
                  <p className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-muted-foreground">Mission_Objectives</p>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">Savings_Goals</h3>
                </div>
                <button className="text-xs font-mono font-black uppercase underline hover:text-sky-600 transition-none text-foreground">
                  Expand_List
                </button>
              </div>
              <div className="space-y-8">
                {(dashboard?.savingsGoals ?? []).map((goal) => (
                  <motion.div key={goal.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex flex-col">
                        <span className="font-mono font-black uppercase text-xs text-foreground">{goal.title}</span>
                        {goal.targetDate && (
                          <span className="font-mono text-[10px] font-bold text-muted-foreground">
                            ETA: {goal.targetDate}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-sm bg-foreground text-background px-2 py-0.5">
                          {goal.progressPercent.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-6 w-full rounded-none border-2 border-foreground bg-muted/20 p-0.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(goal.progressPercent, 100)}%` }}
                        className="h-full bg-sky-600 transition-all duration-1000"
                      />
                    </div>
                    <p className="mt-2 font-mono text-[10px] font-bold text-muted-foreground uppercase">
                      REMAINING: {formatCurrency(goal.targetAmount - goal.currentAmount)}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </>
  );
}
