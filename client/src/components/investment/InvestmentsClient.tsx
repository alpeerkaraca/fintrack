"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  DollarSign,
  Edit2,
  Lock,
  Plus,
  TurkishLira,
  ArrowDownRight,
  ArrowUpRight,
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

import {
  formatCurrency,
  formatCurrencyTrimZeros,
  formatNumber,
} from "@/lib/fintrack";
import type { InvestmentAsset } from "@/lib/fintrack";
import { authFetch } from "@/lib/auth";
import { parseApiResponse } from "@/lib/api";
import { cn } from "@/lib/utils";
import FeedbackModal from "@/components/ui/FeedbackModal";

type InvestmentAssetWithType = InvestmentAsset & {
  id?: string;
};

type SupportedAssetOption = {
  slug: string;
  label: string;
};

type SupportedAssets = Partial<
  Record<"CURRENCY" | "GOLD_SILVER" | "FUND" | "STOCK", SupportedAssetOption[]>
>;

type StockMarketOption = {
  id: string;
  label: string;
  suffix: string;
  currency: string;
  supportedAssetTypes: string[];
};

const CHART_COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];
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
  const [stockMarkets, setStockMarkets] = useState<StockMarketOption[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<InvestmentAssetWithType | null>(null);
  const [confirmAsset, setConfirmAsset] = useState<InvestmentAssetWithType | null>(null);

  const [formData, setFormData] = useState({
    assetType: "FUND",
    stockMarket: "",
    symbol: "",
    quantity: "",
    avgCost: "",
  });
  const isEditing = Boolean(editingAsset);
  const requiresMarket = formData.assetType === "FUND" || formData.assetType === "STOCK";
  const availableMarkets = stockMarkets.filter((market) =>
    market.supportedAssetTypes.includes(formData.assetType),
  );
  const selectedMarket = stockMarkets.find(
    (market) => market.id === formData.stockMarket,
  );

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

  useEffect(() => {
    let isActive = true;

    const loadStockMarkets = async () => {
      try {
        const response = await authFetch("/api/v1/metadata/stock-markets");
        const payload = await parseApiResponse<StockMarketOption[]>(response);
        if (isActive) {
          setStockMarkets(payload ?? []);
        }
      } catch {
        if (isActive) {
          setStockMarkets([]);
        }
      }
    };

    loadStockMarkets();
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
        stockMarket: asset.stockMarket ?? "",
        symbol: asset.symbol,
        quantity: asset.quantity.toString(),
        avgCost: (asset.avgCostOriginal ?? asset.avgCostTry).toString(),
      });
    } else {
      setEditingAsset(null);
      setFormData({
        assetType: "FUND",
        stockMarket: "",
        symbol: "",
        quantity: "",
        avgCost: "",
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingAsset(null);
    setFormData({
      assetType: "FUND",
      stockMarket: "",
      symbol: "",
      quantity: "",
      avgCost: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const quantity = Number.parseFloat(formData.quantity);
    const avgCost = Number.parseFloat(formData.avgCost);
    const roundedQuantity = Number(quantity.toFixed(6));
    const roundedAvgCost = Number(avgCost.toFixed(6));

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

    if (!isEditing && requiresMarket && !formData.stockMarket) {
      openModal("error", "Please select a market.");
      return;
    }

    if (editingAsset) {
      if (!editingAsset.id) {
        openModal("error", "Unable to update asset without an id.");
        return;
      }

      const purchaseCurrency = editingAsset.originalCurrency ?? "TRY";
      const fxRate =
        purchaseCurrency === "TRY" || !editingAsset.avgCostOriginal
          ? 1
          : editingAsset.avgCostTry / editingAsset.avgCostOriginal;
      const totalCostTry = Number(
        (roundedAvgCost * roundedQuantity * fxRate).toFixed(6),
      );

      try {
        const response = await authFetch(`/api/v1/investments/${editingAsset.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            quantity: roundedQuantity,
            totalCostTry,
            avgCostOriginal: roundedAvgCost,
            purchaseCurrency,
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
          quantity: roundedQuantity,
          avgCost: roundedAvgCost,
          assetType: formData.assetType,
          stockMarket: requiresMarket ? formData.stockMarket : undefined,
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b-2 border-foreground bg-background px-6 py-6 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-tighter text-muted-foreground">
              [ Portfolio Manager ]
            </p>
            <h1 className="mt-1 text-3xl font-black uppercase tracking-tighter italic text-foreground">
              Investments
            </h1>
          </div>

          <button
            type="button"
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 border-2 border-foreground bg-foreground px-6 py-4 font-mono text-xs font-black uppercase text-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none"
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
            Add Asset
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        {error && (
          <p className="mb-8 font-mono text-sm font-black uppercase italic text-[#ff0000] underline">
            [ ERROR: {error.toUpperCase()} ]
          </p>
        )}

        <div className="mb-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-2 border-foreground bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]"
          >
            <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">Total Invested</p>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="font-mono text-2xl font-black tracking-tighter text-foreground">
                  {formatCurrency(totalInvested)}
                </p>
                <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">Cost Basis</p>
              </div>
              <div className="border-2 border-foreground bg-[#00ffff] p-2 text-black">
                <Wallet className="h-6 w-6" strokeWidth={3} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="border-2 border-foreground bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]"
          >
            <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">Market Value</p>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="font-mono text-2xl font-black tracking-tighter text-foreground">
                  {formatCurrency(totalCurrentValue)}
                </p>
                <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">Real-time Est.</p>
              </div>
              <div className="border-2 border-foreground bg-[#00ff00] p-2 text-black">
                <ArrowUpRight className="h-6 w-6" strokeWidth={3} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border-2 border-foreground bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]"
          >
            <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">Total P/L</p>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p
                  className={cn(
                    "font-mono text-2xl font-black tracking-tighter",
                    totalProfitLoss >= 0 ? "text-[#00ff00]" : "text-[#ff0000]",
                  )}
                >
                  {totalProfitLoss >= 0 ? "+" : ""}
                  {formatCurrency(totalProfitLoss)}
                </p>
                <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">Unrealized</p>
              </div>
              <div
                className={cn(
                  "border-2 border-foreground p-2 text-black",
                  totalProfitLoss >= 0 ? "bg-[#00ff00]" : "bg-[#ff0000]",
                )}
              >
                {totalProfitLoss >= 0 ? (
                  <ArrowUpRight className="h-6 w-6" strokeWidth={3} />
                ) : (
                  <ArrowDownRight className="h-6 w-6" strokeWidth={3} />
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="border-2 border-foreground bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]"
          >
            <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">Net Return</p>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p
                  className={cn(
                    "font-mono text-2xl font-black tracking-tighter",
                    totalProfitLossPercent >= 0 ? "text-[#00ff00]" : "text-[#ff0000]",
                  )}
                >
                  {totalProfitLossPercent >= 0 ? "+" : ""}
                  {formatNumber(totalProfitLossPercent)}%
                </p>
                <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">Yield</p>
              </div>
              <div
                className={cn(
                  "border-2 border-foreground p-2 text-black",
                  totalProfitLossPercent >= 0 ? "bg-[#00ff00]" : "bg-[#ff0000]",
                )}
              >
                <Coins className="h-6 w-6" strokeWidth={3} />
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mb-10 grid gap-10 lg:grid-cols-[1fr_1.5fr]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-2 border-foreground bg-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]"
          >
            <div className="mb-8 border-b-2 border-foreground pb-4">
              <p className="font-mono text-[10px] font-black uppercase text-muted-foreground">
                Allocation [ Donut ]
              </p>
              <h2 className="font-mono text-xl font-black uppercase italic tracking-tighter text-foreground">Portfolio Weights</h2>
            </div>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={0}
                    stroke="var(--foreground)"
                    strokeWidth={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
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
            <div className="mt-8 grid grid-cols-2 gap-4">
              {chartData.map((item) => (
                <div
                  key={item.name}
                  className="border-2 border-foreground bg-background p-3 flex items-center gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]"
                >
                  <div
                    className="h-4 w-4 border border-foreground"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] font-black uppercase truncate text-foreground">{item.name}</p>
                    <p className="font-mono text-[10px] font-bold text-muted-foreground">
                      {formatCurrency(item.value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-2 border-foreground bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]"
          >
            <div className="border-b-2 border-foreground bg-foreground p-4 text-background flex items-center justify-between">
              <div>
                <h2 className="font-mono text-xl font-black uppercase italic tracking-tighter">
                  {"Trading Terminal // Active Holdings"}
                </h2>
              </div>
              <span className="font-mono text-[10px] font-black uppercase bg-[#ffff00] text-black px-2 py-0.5">
                Live Simulation
              </span>
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {assets.length === 0 ? (
                  <div className="py-20 text-center">
                    <p className="font-mono text-sm font-black uppercase italic text-muted-foreground">
                      No positions detected in terminal
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {assets.map((asset, index) => (
                      <motion.div
                        key={asset.id ?? asset.symbol}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-2 border-foreground bg-background p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] transition-all hover:bg-muted/20"
                      >
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <div>
                                <h3 className="font-mono text-lg font-black uppercase tracking-tight text-foreground">{asset.symbol}</h3>
                                <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground leading-none">
                                  {formatAssetName(asset.name)}
                                </p>
                              </div>
                              <div
                                className={cn(
                                  "border-2 border-foreground px-3 py-1 font-mono text-xs font-black uppercase",
                                  asset.changePercent >= 0
                                    ? "bg-[#00ff00] text-black"
                                    : "bg-[#ff0000] text-black",
                                )}
                              >
                                {asset.changePercent >= 0 ? "+" : ""}
                                {asset.changePercent.toFixed(2)}%
                              </div>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
                              <div>
                                <p className="font-mono text-[10px] font-black uppercase text-muted-foreground">Quantity</p>
                                <p className="mt-1 font-mono text-sm font-black text-foreground">
                                  {formatNumber(asset.quantity)}
                                </p>
                              </div>
                              <div>
                                <p className="font-mono text-[10px] font-black uppercase text-muted-foreground">Avg Cost</p>
                                <div className="mt-1 font-mono text-sm font-black text-foreground">
                                  <p>{formatCurrencyTrimZeros(asset.avgCostTry, "TRY", 6)}</p>
                                  {asset.originalCurrency && asset.originalCurrency !== "TRY" && (
                                    <p className="text-[10px] font-bold text-muted-foreground">
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
                                <p className="font-mono text-[10px] font-black uppercase text-muted-foreground">Market Price</p>
                                <div className="mt-1 font-mono text-sm font-black text-foreground">
                                  <p>{formatCurrencyTrimZeros(asset.currentPriceTry, "TRY", 6)}</p>
                                  {asset.originalCurrency && asset.originalCurrency !== "TRY" && (
                                    <p className="text-[10px] font-bold text-muted-foreground">
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
                                <p className="font-mono text-[10px] font-black uppercase text-muted-foreground">Profit / Loss</p>
                                <p
                                  className={cn(
                                    "mt-1 font-mono text-sm font-black",
                                    asset.profitLossTry >= 0 ? "text-[#00ff00]" : "text-[#ff0000]",
                                  )}
                                >
                                  {asset.profitLossTry >= 0 ? "+" : ""}
                                  {formatCurrency(asset.profitLossTry)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenForm(asset)}
                              className="border-2 border-foreground p-2 transition-all hover:bg-foreground hover:text-background text-foreground"
                            >
                              <Edit2 className="h-4 w-4" strokeWidth={3} />
                            </button>
                            <button
                              onClick={() => handleDeleteRequest(asset)}
                              className="border-2 border-foreground p-2 transition-all hover:bg-[#ff0000] text-foreground hover:text-black"
                            >
                              <X className="h-4 w-4" strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md border-4 border-foreground bg-background p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)]"
              >
                <div className="mb-8 flex items-center justify-between border-b-2 border-foreground pb-4">
                  <h2 className="font-mono text-xl font-black uppercase italic tracking-tighter text-foreground">
                    {editingAsset ? "// Edit Position" : "// Add Position"}
                  </h2>
                  <button
                    onClick={handleCloseForm}
                    className="border-2 border-foreground p-1 hover:bg-foreground hover:text-background transition-all text-foreground"
                  >
                    <X className="h-5 w-5" strokeWidth={3} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="assetType" className="font-mono text-[10px] font-black uppercase text-muted-foreground">
                      Asset Category
                    </label>
                    <select
                      id="assetType"
                      value={formData.assetType}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          assetType: e.target.value,
                          symbol: "",
                          stockMarket: "",
                        }))
                      }
                      disabled={isEditing}
                      className="w-full border-2 border-foreground bg-background px-4 py-3 font-mono text-sm font-bold uppercase focus:outline-none disabled:opacity-50 text-foreground"
                    >
                      <option value="FUND" className="bg-background">FUND</option>
                      <option value="STOCK" className="bg-background">STOCK</option>
                      <option value="GOLD_SILVER" className="bg-background">COMMODITY</option>
                      <option value="CURRENCY" className="bg-background">FOREX</option>
                    </select>
                  </div>

                  {!isEditing && requiresMarket && (
                    <div className="space-y-2">
                      <label htmlFor="stockMarket" className="font-mono text-[10px] font-black uppercase text-muted-foreground">
                        Exchange / Market
                      </label>
                      <select
                        id="stockMarket"
                        value={formData.stockMarket}
                        onChange={(e) =>
                          setFormData({ ...formData, stockMarket: e.target.value })
                        }
                        className="w-full border-2 border-foreground bg-background px-4 py-3 font-mono text-sm font-bold uppercase focus:outline-none text-foreground"
                        required
                      >
                        <option value="" className="bg-background">SELECT EXCHANGE</option>
                        {availableMarkets.map((market) => (
                          <option key={market.id} value={market.id} className="bg-background">
                            {market.label.toUpperCase()} // {market.suffix}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="symbol" className="font-mono text-[10px] font-black uppercase text-muted-foreground">
                      Trading Symbol
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
                        className="w-full border-2 border-foreground bg-background px-4 py-3 font-mono text-sm font-bold uppercase focus:outline-none disabled:opacity-50 text-foreground"
                        required
                      >
                        <option value="" className="bg-background">SELECT ASSET</option>
                        {(supportedAssets[formData.assetType as keyof SupportedAssets] ?? []).map((asset) => (
                          <option key={asset.slug} value={asset.slug} className="bg-background">
                            {asset.label.toUpperCase()}
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
                        placeholder="E.G. NVDA, BTC"
                        className="w-full border-2 border-foreground bg-background px-4 py-3 font-mono text-sm font-bold uppercase focus:outline-none disabled:opacity-50 placeholder:text-muted-foreground/30 text-foreground"
                        required
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="quantity" className="font-mono text-[10px] font-black uppercase text-muted-foreground">
                        Quantity
                      </label>
                      <input
                        id="quantity"
                        type="number"
                        step="0.000001"
                        min="0"
                        value={formData.quantity}
                        onChange={(e) =>
                          setFormData({ ...formData, quantity: e.target.value })
                        }
                        className="w-full border-2 border-foreground bg-background px-4 py-3 font-mono text-sm font-bold focus:outline-none text-foreground"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="avgCost" className="font-mono text-[10px] font-black uppercase text-muted-foreground">
                        Avg Cost Basis
                      </label>
                      <input
                        id="avgCost"
                        type="number"
                        step="0.000001"
                        min="0"
                        value={formData.avgCost}
                        onChange={(e) =>
                          setFormData({ ...formData, avgCost: e.target.value })
                        }
                        className="w-full border-2 border-foreground bg-background px-4 py-3 font-mono text-sm font-bold focus:outline-none text-foreground"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                    <button
                      type="submit"
                      className="flex-1 border-2 border-foreground bg-foreground py-4 font-mono text-sm font-black uppercase text-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none"
                    >
                      {editingAsset ? "Commit Update" : "Open Position"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseForm}
                      className="border-2 border-foreground bg-background px-8 py-4 font-mono text-sm font-black uppercase text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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
    </div>
  );
}
