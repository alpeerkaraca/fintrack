"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, CreditCard, Wallet } from "lucide-react";

import { formatCurrency, formatNumber, type InvestmentAsset } from "@/lib/fintrack";
import { authFetch, getCurrentUser } from "@/lib/auth";
import { parseApiResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

type ForecastItem = {
  month: string;
  label: string;
  savings: number;
};

type CategoryWatchItem = {
  category: string;
  limitTry: number;
  spentTry: number;
  alertLevel: "normal" | "warning" | "critical";
};

type RecentTransaction = {
  id: string;
  title: string;
  amountTry: number;
  date: string;
  category: string;
  type: "income" | "expense";
  paymentMethod: "card" | "cash" | "transfer" | null;
  isInstallment: boolean;
  installmentMeta: {
    totalTry: number;
    months: number;
    startMonth: string;
  } | null;
};

type DashboardOverviewData = {
  summary: {
    income: number;
    expense: number;
    savings: number;
    creditCardLimit: number;
    usdRate: number;
  };
  forecast: ForecastItem[];
  categoryWatchlist: CategoryWatchItem[];
  investments: InvestmentAsset[];
  currentUsdTryRate: number;
  recentTransactions: {
    content: RecentTransaction[];
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
};

const toMonthYear = (yearMonth: string) => {
  const [year, month] = yearMonth.split("-");
  return {
    year,
    month: month?.padStart(2, "0"),
  };
};

const getCurrentYearMonth = () => {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
};

const getAlertColorClass = (alertLevel: CategoryWatchItem["alertLevel"]) => {
  if (alertLevel === "critical") {
    return "bg-rose-500";
  }
  if (alertLevel === "warning") {
    return "bg-amber-400";
  }
  return "bg-emerald-500";
};

export default function DashboardClient() {
  const [username, setUsername] = useState("User");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentYearMonth);
  const [overview, setOverview] = useState<DashboardOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUsername(user.username);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchOverview = async () => {
      setError("");
      if (hasLoadedOnceRef.current) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const { month, year } = toMonthYear(selectedMonth);
        const response = await authFetch(
          `/api/v1/dashboard/overview?month=${month}&year=${year}&page=0&size=20`,
        );
        const payload = await parseApiResponse<DashboardOverviewData>(response);

        if (!cancelled) {
          setOverview(payload);
          hasLoadedOnceRef.current = true;
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Dashboard data could not be loaded.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    void fetchOverview();

    return () => {
      cancelled = true;
    };
  }, [selectedMonth]);

  const netSavingsChart = useMemo(
    () =>
      (overview?.forecast ?? []).map((item) => ({
        month: item.label,
        netSavings: Number((item.savings / 1000).toFixed(1)),
      })),
    [overview],
  );

  const installmentTransactions = useMemo(
    () =>
      (overview?.recentTransactions.content ?? []).filter(
        (transaction) => transaction.isInstallment,
      ),
    [overview],
  );

  if (loading && !overview) {
    return (
      <section className="px-6 py-6 lg:px-10">
        <div className="mb-4 h-7 w-56 animate-pulse rounded bg-muted/50" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl border border-border bg-card/40"
            />
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-2xl border border-border bg-card/40" />
          <div className="h-72 animate-pulse rounded-2xl border border-border bg-card/40" />
        </div>
      </section>
    );
  }

  if (!overview) {
    return (
      <section className="px-6 py-6 lg:px-10">
        <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error || "No dashboard data available."}
        </p>
      </section>
    );
  }

  return (
    <>
      <div className="border-b border-border px-6 py-6 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back, {username}</p>
            <h2 className="text-2xl font-semibold">Dashboard Overview</h2>
          </div>
          <div className="rounded-2xl border border-border bg-card/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">Month</p>
              {refreshing ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Updating
                </span>
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {overview.forecast.map((item) => (
                <button
                  key={item.month}
                  type="button"
                  onClick={() => setSelectedMonth(item.month)}
                  className={cn(
                    "rounded-lg px-3 py-1 text-xs transition",
                    item.month === selectedMonth
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/70 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="px-6 py-6 lg:px-10">
        {error ? (
          <p className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card/70 p-5">
            <p className="text-xs text-muted-foreground">Monthly Income</p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold">
                  {formatCurrency(overview.summary.income)}
                </p>
                <p className="text-xs text-muted-foreground">From selected month</p>
              </div>
              <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-400">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card/70 p-5">
            <p className="text-xs text-muted-foreground">Monthly Expenses</p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold">
                  {formatCurrency(overview.summary.expense)}
                </p>
                <p className="text-xs text-muted-foreground">From selected month</p>
              </div>
              <div className="rounded-full bg-rose-500/10 p-3 text-rose-400">
                <ArrowDownRight className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card/70 p-5">
            <p className="text-xs text-muted-foreground">Net Savings</p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold">
                  {formatCurrency(overview.summary.savings)}
                </p>
                <p className="text-xs text-muted-foreground">Income - Expenses</p>
              </div>
              <div className="rounded-full bg-sky-500/10 p-3 text-sky-400">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card/70 p-5">
            <p className="text-xs text-muted-foreground">Credit Card Limit</p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold">
                  {formatCurrency(overview.summary.creditCardLimit)}
                </p>
                <p className="text-xs text-muted-foreground">Available from backend</p>
              </div>
              <div className="rounded-full bg-amber-500/10 p-3 text-amber-400">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <div className="rounded-2xl border border-border bg-card/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Forecast
                </p>
                <h3 className="text-lg font-semibold">Net Savings Trend</h3>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                USD/TRY {formatNumber(overview.currentUsdTryRate)}
              </span>
            </div>
            <div className="mt-4 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={netSavingsChart} margin={{ left: -12, right: 12 }}>
                  <defs>
                    <linearGradient id="netSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      borderRadius: 12,
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                    }}
                    formatter={(value) => [
                      `${formatNumber(Number(value) * 1000)} TL`,
                      "Net Savings",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="netSavings"
                    stroke="var(--primary)"
                    fill="url(#netSavings)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Investments
                </p>
                <h3 className="text-lg font-semibold">Live Portfolio</h3>
              </div>
              <span className="text-xs text-muted-foreground">
                {overview.investments.length} assets
              </span>
            </div>
            <div className="mt-5 space-y-4">
              {overview.investments.map((asset) => (
                <div
                  key={asset.symbol}
                  className="rounded-xl border border-border bg-background/60 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{asset.symbol}</p>
                      <p className="text-xs text-muted-foreground">{asset.name}</p>
                    </div>
                    <div
                      className={cn(
                        "rounded-full px-3 py-1 text-xs",
                        asset.changePercent >= 0
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-rose-500/10 text-rose-300",
                      )}
                    >
                      {asset.changePercent >= 0 ? "+" : ""}
                      {asset.changePercent}%
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>
                      <p>Quantity</p>
                      <p className="text-sm font-semibold text-foreground">
                        {formatNumber(asset.quantity)}
                      </p>
                    </div>
                    <div>
                      <p>Price</p>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(asset.currentPriceTry)}
                      </p>
                    </div>
                    <div>
                      <p>P/L</p>
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          asset.profitLossTry >= 0 ? "text-emerald-400" : "text-rose-400",
                        )}
                      >
                        {formatCurrency(asset.profitLossTry)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-2xl border border-border bg-card/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Budget Limits
                </p>
                <h3 className="text-lg font-semibold">Category Watchlist</h3>
              </div>
              <span className="text-xs text-muted-foreground">{selectedMonth}</span>
            </div>
            <div className="mt-5 grid gap-4">
              {overview.categoryWatchlist.map((category) => {
                const ratio = Math.min((category.spentTry / category.limitTry) * 100, 100);
                return (
                  <div key={category.category}>
                    <div className="flex items-center justify-between text-sm">
                      <span>{category.category}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(category.spentTry)} / {formatCurrency(category.limitTry)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-muted/60">
                      <div
                        className={cn(
                          "h-2 rounded-full",
                          getAlertColorClass(category.alertLevel),
                        )}
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Installments
                </p>
                <h3 className="text-lg font-semibold">Smart Schedule</h3>
              </div>
              <span className="text-xs text-muted-foreground">
                {installmentTransactions.length} entries
              </span>
            </div>
            <div className="mt-5 space-y-4">
              {installmentTransactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="rounded-xl border border-border bg-background/60 px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{transaction.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.category} · {transaction.date}
                      </p>
                      {transaction.installmentMeta ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {transaction.installmentMeta.months} months · total{" "}
                          {formatCurrency(transaction.installmentMeta.totalTry)} · starts{" "}
                          {transaction.installmentMeta.startMonth}
                        </p>
                      ) : null}
                    </div>
                    <p className="text-sm font-semibold text-amber-400">
                      {formatCurrency(transaction.amountTry)}
                    </p>
                  </div>
                </div>
              ))}
              {!installmentTransactions.length ? (
                <p className="text-sm text-muted-foreground">
                  No installment transactions for this month.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card/60 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Transactions
              </p>
              <h3 className="text-lg font-semibold">Latest Activity</h3>
            </div>
            <span className="text-xs text-muted-foreground">
              {overview.recentTransactions.totalElements} total
            </span>
          </div>
          <div className="mt-5 space-y-4">
            {overview.recentTransactions.content.slice(0, 8).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold">{transaction.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {transaction.category} · {transaction.date}
                  </p>
                </div>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    transaction.type === "expense" ? "text-rose-400" : "text-emerald-400",
                  )}
                >
                  {transaction.type === "expense" ? "-" : "+"}
                  {formatCurrency(transaction.amountTry)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
