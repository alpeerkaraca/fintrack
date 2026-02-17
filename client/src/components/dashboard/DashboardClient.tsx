"use client";

import { useEffect, useMemo, useState } from "react";
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
  currentUsdTryRate?: number;
  recentTransactions?: TransactionPage;
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
const getCurrencyIcon = (currency?: string) => {
  if (currency === "USD") {
    return DollarSign;
  }
  if (currency === "TRY") {
    return TurkishLira;
  }
  return Coins;
};

export default function DashboardClient() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey);
  const [dashboard, setDashboard] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryMeta[]>([]);

  const categoryMap = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category.label]));
  }, [categories]);

  const getCategoryLabel = (categoryId: string) => {
    return categoryMap.get(categoryId) ?? categoryId;
  };

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
        if (payload.forecast?.length) {
          const hasSelected = payload.forecast.some(
            (item) => item.month === selectedMonth,
          );
          if (!hasSelected && payload.forecast[0].month !== selectedMonth) {
            setSelectedMonth(payload.forecast[0].month);
          }
        }
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

  const forecast = dashboard?.forecast ?? [];
  const selectedForecast =
    forecast.find((item) => item.month === selectedMonth) ?? forecast[0];
  const summary = dashboard?.summary;
  const currentLabel = selectedForecast?.label ?? selectedMonth;
  const currentUsdRate =
    dashboard?.currentUsdTryRate ?? dashboard?.summary.usdRate ?? 0;
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
      forecast.map((item) => ({
        month: item.label,
        netSavings: Number((item.savings / 1000).toFixed(1)),
      })),
    [forecast],
  );

  if (isLoading && !dashboard) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted/60 border-t-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="border-b border-border px-6 py-6 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <h2 className="text-2xl font-semibold">Dashboard Overview</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-border bg-card/60 px-4 py-3">
              <p className="text-xs text-muted-foreground">USD/TRY Rate</p>
              <div className="mt-2 text-sm font-semibold">
                {formatNumber(currentUsdRate)}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card/60 px-4 py-3">
              <p className="text-xs text-muted-foreground">Month</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {forecast.map((item) => (
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
        {error ? (
          <p className="mt-3 text-xs text-rose-400">{error}</p>
        ) : isLoading ? (
          <p className="mt-3 text-xs text-muted-foreground">Loading dashboard...</p>
        ) : null}
      </div>

      <section className="px-6 py-6 lg:px-10">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card/70 p-5">
            <p className="text-xs text-muted-foreground">Monthly Income</p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold">
                  {formatCurrency(summary?.income ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">Selected month total</p>
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
                  {formatCurrency(summary?.expense ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">All categories</p>
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
                  {formatCurrency(summary?.savings ?? 0)}
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
                  {formatCurrency(creditCardRemaining)}
                </p>
                <p className="text-xs text-muted-foreground">Current balance</p>
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
                  Boss Fight
                </p>
                <h3 className="text-lg font-semibold">{currentLabel} Alert</h3>
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs",
                  bossFightTriggered
                    ? "bg-rose-500/15 text-rose-300"
                    : "bg-emerald-500/10 text-emerald-300",
                )}
              >
                {bossFightTriggered ? "Risk Level High" : "Stable"}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {bossFightTriggered
                ? "Expenses are above 85% of income. Prepare an emergency buffer."
                : "Spending ratio is under control for this month."}
            </p>
            {summary && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-background/60 p-4">
                  <p className="text-xs text-muted-foreground">Income</p>
                  <p className="mt-1 text-lg font-semibold">
                    {formatCurrency(summary.income)}
                  </p>
                </div>
                <div className="rounded-xl bg-background/60 p-4">
                  <p className="text-xs text-muted-foreground">Expenses</p>
                  <p className="mt-1 text-lg font-semibold">
                    {formatCurrency(summary.expense)}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Forecast
                </p>
                <h3 className="text-lg font-semibold">Savings Forecast</h3>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                Updated from backend
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
              <span className="text-xs text-muted-foreground">{currentLabel}</span>
            </div>
            <div className="mt-5 grid gap-4">
              {(dashboard?.categoryWatchlist ?? []).map((category) => {
                const state = getLimitState(category);
                const ratio =
                  category.limitTry > 0
                    ? Math.min((category.spentTry / category.limitTry) * 100, 100)
                    : 0;
                return (
                  <div key={category.category}>
                    <div className="flex items-center justify-between text-sm">
                      <span>{getCategoryLabel(category.category)}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(category.spentTry)} / {formatCurrency(category.limitTry)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-muted/60">
                      <div
                        className={cn(
                          "h-2 rounded-full",
                          state === "danger"
                            ? "bg-rose-500"
                            : state === "warning"
                              ? "bg-amber-400"
                              : "bg-emerald-500",
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
                  Investments
                </p>
                <h3 className="text-lg font-semibold">Mutual Funds</h3>
              </div>
              <span className="text-xs text-muted-foreground">Latest snapshot</span>
            </div>
            <div className="mt-5 space-y-4">
              {(dashboard?.investments ?? []).map((asset) => (
                <div
                  key={asset.symbol}
                  className="rounded-xl border border-border bg-background/60 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{asset.symbol}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatAssetName(asset.name)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {asset.stockMarketDisplayName ?? asset.stockMarket ?? "Other"}
                      </p>
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
                      {asset.changePercent.toFixed(2)}%
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                    <div>
                      <p>Quantity</p>
                      <p className="text-sm font-semibold text-foreground">
                        {asset.quantity}
                      </p>
                    </div>
                    <div>
                      <p>Avg Cost</p>
                      <div className="mt-1 space-y-1 text-foreground">
                        <p className="flex items-center gap-1 text-sm font-semibold">
                          <TurkishLira className="h-3.5 w-3.5" />
                          {formatCurrencyTrimZeros(asset.avgCostTry, "TRY", 6)}
                        </p>
                        {asset.originalCurrency && asset.originalCurrency !== "TRY" && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            {(() => {
                              const Icon = getCurrencyIcon(asset.originalCurrency);
                              return <Icon className="h-3 w-3" />;
                            })()}
                            {formatCurrencyTrimZeros(
                              asset.avgCostOriginal ?? asset.avgCostTry,
                              asset.originalCurrency,
                              6,
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p>Current Price</p>
                      <div className="mt-1 space-y-1 text-foreground">
                        <p className="flex items-center gap-1 text-sm font-semibold">
                          <TurkishLira className="h-3.5 w-3.5" />
                          {formatCurrencyTrimZeros(asset.currentPriceTry, "TRY", 6)}
                        </p>
                        {asset.originalCurrency && asset.originalCurrency !== "TRY" && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            {(() => {
                              const Icon = getCurrencyIcon(asset.originalCurrency);
                              return <Icon className="h-3 w-3" />;
                            })()}
                            {formatCurrencyTrimZeros(
                              asset.currentPriceOriginal ?? asset.currentPriceTry,
                              asset.originalCurrency,
                              6,
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p>P/L</p>
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          asset.profitLossTry >= 0
                            ? "text-emerald-400"
                            : "text-rose-400",
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

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-2xl border border-border bg-card/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Transactions
                </p>
                <h3 className="text-lg font-semibold">Latest Activity</h3>
              </div>
              <span className="text-xs text-muted-foreground">{currentLabel}</span>
            </div>
            <div className="mt-5 space-y-4">
              {latestTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{transaction.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {getCategoryLabel(transaction.category)} · {transaction.date}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      transaction.type === "expense"
                        ? "text-rose-400"
                        : "text-emerald-400",
                    )}
                  >
                    {transaction.type === "expense" ? "-" : "+"}
                    {formatCurrency(transaction.amountTry)}
                  </p>
                </div>
              ))}
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
              <span className="text-xs text-muted-foreground">Auto-distributed</span>
            </div>
            <div className="mt-5 space-y-4">
              {installmentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="rounded-xl border border-border bg-background/60 px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{transaction.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {getCategoryLabel(transaction.category)} · {transaction.date}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-amber-400">
                      {formatCurrency(transaction.amountTry)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Installment costs are automatically distributed across active schedules.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
