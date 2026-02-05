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
  CreditCard,
  Wallet,
} from "lucide-react";

import {
  BASE_TRANSACTIONS,
  buildBudgets,
  expandInstallments,
  formatCurrency,
  formatNumber,
  getMonthlyTransactions,
  type BudgetCategory,
  type InvestmentAsset,
  USD_TRY_RATE,
} from "@/lib/fintrack";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";

const BASE_ASSETS: InvestmentAsset[] = [
  {
    symbol: "GUM",
    name: "Gumruk Tech Fund",
    quantity: 280,
    avgCostTry: 96.4,
    currentPriceTry: 102.3,
    changePercent: 2.1,
    profitLossTry: 0,
  },
  {
    symbol: "IJC",
    name: "Istanbul Growth",
    quantity: 140,
    avgCostTry: 182.7,
    currentPriceTry: 176.8,
    changePercent: -1.4,
    profitLossTry: 0,
  },
  {
    symbol: "TGE",
    name: "Tech Global Equity",
    quantity: 90,
    avgCostTry: 244.2,
    currentPriceTry: 262.5,
    changePercent: 3.3,
    profitLossTry: 0,
  },
];

const updateProfitLoss = (assets: InvestmentAsset[]) =>
  assets.map((asset) => ({
    ...asset,
    profitLossTry: (asset.currentPriceTry - asset.avgCostTry) * asset.quantity,
  }));

const getLimitState = (category: BudgetCategory) => {
  const ratio = category.spentTry / category.limitTry;
  if (ratio >= 1) {
    return "danger";
  }
  if (ratio >= 0.85) {
    return "warning";
  }
  return "normal";
};

export default function DashboardClient() {
  const [usdSalary, setUsdSalary] = useState(1190);
  const [username, setUsername] = useState("User");
  const [selectedMonth, setSelectedMonth] = useState("2026-03");
  const [assets, setAssets] = useState(() => updateProfitLoss(BASE_ASSETS));

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUsername(user.username);
      setUsdSalary(user.netSalaryUsd);
    }
  }, []);

  const transactions = useMemo(
    () => expandInstallments(BASE_TRANSACTIONS),
    [],
  );

  const budgets = useMemo(
    () => buildBudgets(usdSalary, USD_TRY_RATE, transactions),
    [transactions, usdSalary],
  );

  const currentBudget =
    budgets.find((budget) => budget.month === selectedMonth) ?? budgets[0];
  const currentTransactions = useMemo(
    () => getMonthlyTransactions(selectedMonth, transactions),
    [selectedMonth, transactions],
  );

  const marchBudget = budgets.find((budget) => budget.month === "2026-03");
  const bossFightTriggered = marchBudget
    ? marchBudget.expensesTry / marchBudget.incomeTry > 0.85
    : false;

  const creditCardLimit = 23000;
  const creditCardUsed = currentTransactions
    .filter((transaction) => transaction.paymentMethod === "card")
    .reduce((total, transaction) => total + transaction.amountTry, 0);
  const creditCardRemaining = creditCardLimit - creditCardUsed;

  useEffect(() => {
    const interval = setInterval(() => {
      setAssets((prev) =>
        updateProfitLoss(
          prev.map((asset) => {
            const variance = (Math.random() - 0.45) * 1.8;
            const nextPrice = Math.max(40, asset.currentPriceTry + variance);
            return {
              ...asset,
              currentPriceTry: Number(nextPrice.toFixed(2)),
              changePercent: Number(((variance / asset.currentPriceTry) * 100).toFixed(2)),
            };
          }),
        ),
      );
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  const netSavingsChart = budgets.map((budget) => ({
    month: budget.label,
    netSavings: Number((budget.netSavingsTry / 1000).toFixed(1)),
  }));

  return (
    <>
      <div className="border-b border-border px-6 py-6 lg:px-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {username}
                </p>
                <h2 className="text-2xl font-semibold">Dashboard Overview</h2>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="rounded-2xl border border-border bg-card/60 px-4 py-3">
                  <p className="text-xs text-muted-foreground">Monthly Salary (USD)</p>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={usdSalary}
                      onChange={(event) =>
                        setUsdSalary(Number(event.target.value) || 0)
                      }
                      className="w-24 rounded-lg border border-border bg-background px-2 py-1 text-sm"
                    />
                    <span className="text-xs text-muted-foreground">→</span>
                    <span className="text-sm font-semibold">
                      {formatCurrency(usdSalary * USD_TRY_RATE)}
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-card/60 px-4 py-3">
                  <p className="text-xs text-muted-foreground">Month</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {budgets.map((budget) => (
                      <button
                        key={budget.month}
                        type="button"
                        onClick={() => setSelectedMonth(budget.month)}
                        className={cn(
                          "rounded-lg px-3 py-1 text-xs transition",
                          budget.month === selectedMonth
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/70 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {budget.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
      </div>

      <section className="px-6 py-6 lg:px-10">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-border bg-card/70 p-5">
                <p className="text-xs text-muted-foreground">Monthly Income</p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-semibold">
                      {formatCurrency(currentBudget.incomeTry)}
                    </p>
                    <p className="text-xs text-muted-foreground">USD salary converted</p>
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
                      {formatCurrency(currentBudget.expensesTry)}
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
                      {formatCurrency(currentBudget.netSavingsTry)}
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
                    <p className="text-xs text-muted-foreground">
                      Remaining from {formatCurrency(creditCardLimit)}
                    </p>
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
                    <h3 className="text-lg font-semibold">March 2026 Alert</h3>
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
                  Father&apos;s debt + installments + Valentine&apos;s Day are consuming more
                  than 85% of March income. Prepare an emergency buffer.
                </p>
                {marchBudget && (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-background/60 p-4">
                      <p className="text-xs text-muted-foreground">March Income</p>
                      <p className="mt-1 text-lg font-semibold">
                        {formatCurrency(marchBudget.incomeTry)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-background/60 p-4">
                      <p className="text-xs text-muted-foreground">March Expenses</p>
                      <p className="mt-1 text-lg font-semibold">
                        {formatCurrency(marchBudget.expensesTry)}
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
                    <h3 className="text-lg font-semibold">Nisan Freedom</h3>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                    Savings jump in April
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
                  <span className="text-xs text-muted-foreground">
                    {currentBudget.label}
                  </span>
                </div>
                <div className="mt-5 grid gap-4">
                  {currentBudget.categories.map((category) => {
                    const state = getLimitState(category);
                    const ratio = Math.min(
                      (category.spentTry / category.limitTry) * 100,
                      100,
                    );
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
                  <span className="text-xs text-muted-foreground">Live simulation</span>
                </div>
                <div className="mt-5 space-y-4">
                  {assets.map((asset) => (
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
                            {asset.quantity}
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
                  <span className="text-xs text-muted-foreground">{currentBudget.label}</span>
                </div>
                <div className="mt-5 space-y-4">
                  {currentTransactions.slice(0, 6).map((transaction) => (
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
                  {currentTransactions
                    .filter((transaction) => transaction.title.includes("Installment"))
                    .slice(0, 5)
                    .map((transaction) => (
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
                          </div>
                          <p className="text-sm font-semibold text-amber-400">
                            {formatCurrency(transaction.amountTry)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Installment costs are automatically distributed across the next 9
                  months starting from March 2026.
                </p>
              </div>
            </div>
      </section>
    </>
  );
}
