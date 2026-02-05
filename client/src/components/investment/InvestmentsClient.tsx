"use client";

import { useEffect, useState } from "react";
import {
  Edit2,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { formatCurrency, formatNumber, type InvestmentAsset } from "@/lib/fintrack";
import { cn } from "@/lib/utils";

const INITIAL_ASSETS: InvestmentAsset[] = [
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

const CHART_COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

const updateProfitLoss = (assets: InvestmentAsset[]) =>
  assets.map((asset) => ({
    ...asset,
    profitLossTry: (asset.currentPriceTry - asset.avgCostTry) * asset.quantity,
  }));

export default function InvestmentsClient() {
  const [assets, setAssets] = useState(() => updateProfitLoss(INITIAL_ASSETS));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<InvestmentAsset | null>(null);

  const [formData, setFormData] = useState({
    symbol: "",
    name: "",
    quantity: "",
    avgCostTry: "",
  });

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
              changePercent: Number(
                ((variance / asset.currentPriceTry) * 100).toFixed(2),
              ),
            };
          }),
        ),
      );
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  const totalInvested = assets.reduce(
    (sum, asset) => sum + asset.avgCostTry * asset.quantity,
    0,
  );
  const totalCurrentValue = assets.reduce(
    (sum, asset) => sum + asset.currentPriceTry * asset.quantity,
    0,
  );
  const totalProfitLoss = totalCurrentValue - totalInvested;
  const totalProfitLossPercent = totalInvested
    ? (totalProfitLoss / totalInvested) * 100
    : 0;

  const chartData = assets.map((asset, index) => ({
    name: asset.symbol,
    value: asset.currentPriceTry * asset.quantity,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const handleOpenForm = (asset?: InvestmentAsset) => {
    if (asset) {
      setEditingAsset(asset);
      setFormData({
        symbol: asset.symbol,
        name: asset.name,
        quantity: asset.quantity.toString(),
        avgCostTry: asset.avgCostTry.toString(),
      });
    } else {
      setEditingAsset(null);
      setFormData({
        symbol: "",
        name: "",
        quantity: "",
        avgCostTry: "",
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingAsset(null);
    setFormData({
      symbol: "",
      name: "",
      quantity: "",
      avgCostTry: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const quantity = Number.parseFloat(formData.quantity);
    const avgCost = Number.parseFloat(formData.avgCostTry);

    if (
      !formData.symbol.trim() ||
      Number.isNaN(quantity) ||
      quantity <= 0 ||
      Number.isNaN(avgCost) ||
      avgCost <= 0
    ) {
      alert("Please fill all fields with valid values");
      return;
    }

    if (editingAsset) {
      setAssets((prev) =>
        updateProfitLoss(
          prev.map((asset) =>
            asset.symbol === editingAsset.symbol
              ? {
                  ...asset,
                  symbol: formData.symbol.trim().toUpperCase(),
                  name: formData.name.trim() || formData.symbol.trim().toUpperCase(),
                  quantity,
                  avgCostTry: avgCost,
                }
              : asset,
          ),
        ),
      );
    } else {
      const newAsset: InvestmentAsset = {
        symbol: formData.symbol.trim().toUpperCase(),
        name: formData.name.trim() || formData.symbol.trim().toUpperCase(),
        quantity,
        avgCostTry: avgCost,
        currentPriceTry: avgCost,
        changePercent: 0,
        profitLossTry: 0,
      };
      setAssets((prev) => updateProfitLoss([...prev, newAsset]));
    }

    handleCloseForm();
  };

  const handleDelete = (symbol: string) => {
    if (confirm(`Are you sure you want to remove ${symbol} from your portfolio?`)) {
      setAssets((prev) => prev.filter((asset) => asset.symbol !== symbol));
    }
  };

  return (
    <>
      <div className="border-b border-border bg-card/60 px-6 py-6 lg:px-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div>
              <p className="text-sm text-muted-foreground">Portfolio Manager</p>
              <h1 className="text-2xl font-semibold">Investments</h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Asset
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card/70 p-5">
            <p className="text-xs text-muted-foreground">Total Invested</p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold">
                  {formatCurrency(totalInvested)}
                </p>
                <p className="text-xs text-muted-foreground">Average cost basis</p>
              </div>
              <div className="rounded-full bg-sky-500/10 p-3 text-sky-400">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/70 p-5">
            <p className="text-xs text-muted-foreground">Current Value</p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold">
                  {formatCurrency(totalCurrentValue)}
                </p>
                <p className="text-xs text-muted-foreground">Market price</p>
              </div>
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/70 p-5">
            <p className="text-xs text-muted-foreground">Total P/L</p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p
                  className={cn(
                    "text-2xl font-semibold",
                    totalProfitLoss >= 0 ? "text-emerald-400" : "text-rose-400",
                  )}
                >
                  {totalProfitLoss >= 0 ? "+" : ""}
                  {formatCurrency(totalProfitLoss)}
                </p>
                <p className="text-xs text-muted-foreground">Unrealized gain/loss</p>
              </div>
              <div
                className={cn(
                  "rounded-full p-3",
                  totalProfitLoss >= 0
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-rose-500/10 text-rose-400",
                )}
              >
                {totalProfitLoss >= 0 ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/70 p-5">
            <p className="text-xs text-muted-foreground">Return</p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p
                  className={cn(
                    "text-2xl font-semibold",
                    totalProfitLossPercent >= 0
                      ? "text-emerald-400"
                      : "text-rose-400",
                  )}
                >
                  {totalProfitLossPercent >= 0 ? "+" : ""}
                  {formatNumber(totalProfitLossPercent)}%
                </p>
                <p className="text-xs text-muted-foreground">Overall performance</p>
              </div>
              <div
                className={cn(
                  "rounded-full p-3",
                  totalProfitLossPercent >= 0
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-rose-500/10 text-rose-400",
                )}
              >
                {totalProfitLossPercent >= 0 ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <div className="rounded-2xl border border-border bg-card/70 p-6">
            <div className="mb-5">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Portfolio
              </p>
              <h2 className="text-lg font-semibold">Asset Allocation</h2>
            </div>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
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
            <div className="mt-4 grid grid-cols-2 gap-3">
              {chartData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2"
                >
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1">
                    <p className="text-xs font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/70 p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Holdings
                </p>
                <h2 className="text-lg font-semibold">Mutual Funds</h2>
              </div>
              <span className="text-xs text-muted-foreground">
                Live simulation
              </span>
            </div>

            {assets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-background/60 py-16 text-center">
                <p className="text-sm text-muted-foreground">
                  No assets in your portfolio
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenForm()}
                  className="mt-4 text-sm text-primary hover:underline"
                >
                  Add your first asset
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {assets.map((asset) => (
                  <div
                    key={asset.symbol}
                    className="rounded-xl border border-border bg-background/60 p-4 transition hover:bg-muted/30"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-sm font-semibold">{asset.symbol}</p>
                            <p className="text-xs text-muted-foreground">
                              {asset.name}
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
                            {asset.changePercent}%
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                          <div>
                            <p className="text-muted-foreground">Quantity</p>
                            <p className="mt-1 font-semibold text-foreground">
                              {formatNumber(asset.quantity)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Avg Cost</p>
                            <p className="mt-1 font-semibold text-foreground">
                              {formatCurrency(asset.avgCostTry)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Current Price</p>
                            <p className="mt-1 font-semibold text-foreground">
                              {formatCurrency(asset.currentPriceTry)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">P/L</p>
                            <p
                              className={cn(
                                "mt-1 font-semibold",
                                asset.profitLossTry >= 0
                                  ? "text-emerald-400"
                                  : "text-rose-400",
                              )}
                            >
                              {asset.profitLossTry >= 0 ? "+" : ""}
                              {formatCurrency(asset.profitLossTry)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenForm(asset)}
                          className="rounded-lg p-2 text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(asset.symbol)}
                          className="rounded-lg p-2 text-muted-foreground transition hover:bg-rose-500/10 hover:text-rose-400"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {editingAsset ? "Edit Asset" : "Add New Asset"}
                </h2>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted/50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="symbol"
                    className="mb-2 block text-xs text-muted-foreground"
                  >
                    Symbol / Ticker
                  </label>
                  <input
                    id="symbol"
                    type="text"
                    value={formData.symbol}
                    onChange={(e) =>
                      setFormData({ ...formData, symbol: e.target.value })
                    }
                    placeholder="e.g., GUM, IJC"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm uppercase transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-xs text-muted-foreground"
                  >
                    Fund Name (Optional)
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Gumruk Tech Fund"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="quantity"
                    className="mb-2 block text-xs text-muted-foreground"
                  >
                    Quantity
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    placeholder="0"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="avgCost"
                    className="mb-2 block text-xs text-muted-foreground"
                  >
                    Average Cost (TRY)
                  </label>
                  <input
                    id="avgCost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.avgCostTry}
                    onChange={(e) =>
                      setFormData({ ...formData, avgCostTry: e.target.value })
                    }
                    placeholder="0.00"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                  >
                    {editingAsset ? "Update Asset" : "Add Asset"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-medium transition hover:bg-muted/50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
