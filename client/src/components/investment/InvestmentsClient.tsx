"use client";

import { useEffect, useState } from "react";
import {
  Edit2,
  Lock,
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
import { authFetch } from "@/lib/auth";
import { parseApiResponse } from "@/lib/api";
import { cn } from "@/lib/utils";
import FeedbackModal from "@/components/ui/FeedbackModal";

type InvestmentAssetWithType = InvestmentAsset & {
  id?: string;
  assetType?: string;
};

type SupportedAssetOption = {
  slug: string;
  label: string;
};

type SupportedAssets = Partial<
  Record<"CURRENCY" | "GOLD_SILVER" | "FUND" | "STOCK", SupportedAssetOption[]>
>;

const CHART_COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

export default function InvestmentsClient() {
  const [assets, setAssets] = useState<InvestmentAssetWithType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<
    | {
        type: "success" | "error";
        title: string;
        message: string;
      }
    | null
  >(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [supportedAssets, setSupportedAssets] = useState<SupportedAssets>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<InvestmentAssetWithType | null>(null);
  const [confirmAsset, setConfirmAsset] = useState<InvestmentAssetWithType | null>(null);

  const [formData, setFormData] = useState({
    assetType: "FUND",
    symbol: "",
    quantity: "",
    avgCostTry: "",
  });
  const isEditing = Boolean(editingAsset);

  const openModal = (type: "success" | "error", message: string, title?: string) => {
    setModal({
      type,
      title: title ?? (type === "success" ? "Success" : "Something went wrong"),
      message,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    window.setTimeout(() => setModal(null), 200);
  };

  useEffect(() => {
    let isActive = true;

    const loadInvestments = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await authFetch("/api/v1/investments");
        const payload = await parseApiResponse<InvestmentAssetWithType[]>(response);
        if (isActive) {
          setAssets(payload ?? []);
        }
      } catch (requestError) {
        if (isActive) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Investments could not be loaded.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadInvestments();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadSupportedAssets = async () => {
      try {
        const response = await authFetch("/api/v1/market-data/supported-assets");
        const payload = await parseApiResponse<SupportedAssets>(response);
        if (isActive) {
          setSupportedAssets(payload ?? {});
        }
      } catch {
        if (isActive) {
          setSupportedAssets({});
        }
      }
    };

    loadSupportedAssets();
    return () => {
      isActive = false;
    };
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

  const handleOpenForm = (asset?: InvestmentAssetWithType) => {
    if (asset) {
      setEditingAsset(asset);
      setFormData({
        assetType: asset.assetType ?? "FUND",
        symbol: asset.symbol,
        quantity: asset.quantity.toString(),
        avgCostTry: asset.avgCostTry.toString(),
      });
    } else {
      setEditingAsset(null);
      setFormData({
        assetType: "FUND",
        symbol: "",
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
      assetType: "FUND",
      symbol: "",
      quantity: "",
      avgCostTry: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const quantity = Number.parseFloat(formData.quantity);
    const avgCost = Number.parseFloat(formData.avgCostTry);

    if (
      !formData.symbol.trim() ||
      Number.isNaN(quantity) ||
      quantity < 0 ||
      Number.isNaN(avgCost) ||
      avgCost < 0
    ) {
      openModal("error", "Please fill all fields with valid values.");
      return;
    }

    if (editingAsset) {
      if (!editingAsset.id) {
        openModal("error", "Unable to update asset without an id.");
        return;
      }

      try {
        const response = await authFetch(`/api/v1/investments/${editingAsset.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            quantity,
            avgCostTry: avgCost,
          }),
        });

        const updated = await parseApiResponse<InvestmentAssetWithType>(response);
        setAssets((prev) =>
          prev.map((asset) => (asset.id === updated.id ? updated : asset)),
        );
        handleCloseForm();
        openModal("success", `${updated.symbol} updated.`);
      } catch (requestError) {
        openModal(
          "error",
          requestError instanceof Error
            ? requestError.message
            : "Unable to update asset.",
        );
      }
      return;
    }

    try {
      const response = await authFetch("/api/v1/investments", {
        method: "POST",
        body: JSON.stringify({
          symbol: formData.symbol.trim(),
          quantity,
          avgCostTry: avgCost,
          assetType: formData.assetType,
        }),
      });

      const created = await parseApiResponse<InvestmentAssetWithType>(response);
      setAssets((prev) => [...prev, created]);
      handleCloseForm();
      openModal("success", `${created.symbol} added.`);
    } catch (requestError) {
      openModal(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "Unable to add asset.",
      );
      return;
    }
  };

  const handleDeleteRequest = (asset: InvestmentAssetWithType) => {
    if (!asset.id) {
      openModal("error", "Unable to delete asset without an id.");
      return;
    }

    setConfirmAsset(asset);
  };

  const handleConfirmDelete = async () => {
    if (!confirmAsset?.id) {
      setConfirmAsset(null);
      return;
    }

    try {
      const response = await authFetch(`/api/v1/investments/${confirmAsset.id}`, {
        method: "DELETE",
      });

      if (response.status !== 204) {
        await parseApiResponse<null>(response);
      }

      setAssets((prev) => prev.filter((item) => item.id !== confirmAsset.id));
      openModal("success", `${confirmAsset.symbol} deleted.`);
    } catch (requestError) {
      openModal(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete asset.",
      );
    } finally {
      setConfirmAsset(null);
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
        {error && (
          <p className="mb-4 text-sm text-rose-400">{error}</p>
        )}
        {isLoading && (
          <div className="mb-6 rounded-2xl border border-dashed border-border bg-background/60 py-10 text-center">
            <p className="text-sm text-muted-foreground">Loading portfolio...</p>
          </div>
        )}
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
                    key={asset.id ?? asset.symbol}
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
                          onClick={() => handleDeleteRequest(asset)}
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
                    htmlFor="assetType"
                    className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    Asset Type
                    {isEditing && <Lock className="h-3.5 w-3.5" />}
                  </label>
                  <select
                    id="assetType"
                    value={formData.assetType}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        assetType: e.target.value,
                        symbol: "",
                      }))
                    }
                    disabled={isEditing}
                    className={cn(
                      "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                      isEditing && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <option value="FUND">Fund</option>
                    <option value="STOCK">Stock</option>
                    <option value="GOLD_SILVER">Gold & Silver</option>
                    <option value="CURRENCY">Currency</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="symbol"
                    className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    Symbol
                    {isEditing && <Lock className="h-3.5 w-3.5" />}
                  </label>
                  {formData.assetType === "GOLD_SILVER" ||
                  formData.assetType === "CURRENCY" ? (
                    <select
                      id="symbol"
                      value={formData.symbol}
                      onChange={(e) =>
                        setFormData({ ...formData, symbol: e.target.value })
                      }
                      disabled={isEditing}
                      className={cn(
                        "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                        isEditing && "cursor-not-allowed opacity-60",
                      )}
                      required
                    >
                      <option value="">Select an asset</option>
                      {(supportedAssets[formData.assetType] ?? []).map((asset) => (
                        <option key={asset.slug} value={asset.slug}>
                          {asset.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="symbol"
                      type="text"
                      value={formData.symbol}
                      onChange={(e) =>
                        setFormData({ ...formData, symbol: e.target.value })
                      }
                      disabled={isEditing}
                      placeholder="e.g., TCD, AAPL"
                      className={cn(
                        "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm uppercase transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                        isEditing && "cursor-not-allowed opacity-60",
                      )}
                      required
                    />
                  )}
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
        {modal && (
          <FeedbackModal
            open={modalOpen}
            type={modal.type}
            title={modal.title}
            message={modal.message}
            onClose={closeModal}
          />
        )}
        {confirmAsset && (
          <FeedbackModal
            open
            type="error"
            title="Confirm delete"
            message={`Delete ${confirmAsset.symbol} from your portfolio? This action cannot be undone.`}
            confirmLabel="Delete"
            cancelLabel="Cancel"
            onConfirm={handleConfirmDelete}
            onClose={() => setConfirmAsset(null)}
          />
        )}
      </div>
    </>
  );
}
