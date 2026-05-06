"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  Filter,
  Plus,
  Tag,
  Trash2,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
} from "lucide-react";

import {
  formatCurrency,
  type CategoryMeta,
  type PaymentMethod,
  type Transaction,
  type TransactionType,
} from "@/lib/fintrack";
import { cn } from "@/lib/utils";
import { authFetch } from "@/lib/auth";
import { parseApiResponse } from "@/lib/api";
import FeedbackModal from "@/components/ui/FeedbackModal";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "card", label: "Credit Card" },
  { value: "cash", label: "Cash" },
  { value: "transfer", label: "Bank Transfer" },
];

const getCurrentMonthKey = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
};

export default function BudgetEntryClient() {
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey);
  const [monthOptions, setMonthOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedLimit, setSelectedLimit] = useState("15");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryMeta[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(searchParams.get("category"));
  const [modal, setModal] = useState<
    | {
        type: "success" | "error";
        title: string;
        message: string;
      }
    | null
  >(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    amountTry: "",
    date: new Date().toISOString().split("T")[0],
    category: "",
    type: "expense" as TransactionType,
    paymentMethod: "card" as PaymentMethod,
    isInstallment: false,
    installmentMonths: "2",
  });

  const categoryMap = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category.label]));
  }, [categories]);

  const getCategoryLabel = (categoryId: string) => {
    return categoryMap.get(categoryId) ?? categoryId;
  };

  const getDefaultCategoryId = () => {
    return categories[0]?.id ?? "OTHER";
  };

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

  const monthlyTransactions = [...transactions].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  const filteredTransactions = useMemo(() => {
    if (!categoryFilter) return monthlyTransactions;
    return monthlyTransactions.filter((t) => t.category === categoryFilter || t.type === "income");
  }, [monthlyTransactions, categoryFilter]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map((t) => t.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    setIsLoading(true);
    try {
      const response = await authFetch("/api/v1/transactions/bulk", {
        method: "DELETE",
        body: JSON.stringify(Array.from(selectedIds)),
      });
      
      await parseApiResponse(response);
      
      setTransactions((prev) => prev.filter((t) => !selectedIds.has(t.id)));
      setSelectedIds(new Set());
      openModal("success", `${selectedIds.size} transactions deleted.`);
    } catch (err) {
      openModal("error", err instanceof Error ? err.message : "Failed to delete transactions.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setIsFormOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    let isActive = true;

    const loadMonthOptions = async () => {
      try {
        const response = await authFetch("/api/v1/metadata/available-months");
        const payload = await parseApiResponse<{ value: string; label: string }[]>(response);
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

  const loadTransactions = async (monthKey: string, limit: string) => {
    const [year, month] = monthKey.split("-");
    const query = new URLSearchParams({
      month: String(Number(month)),
      year,
      page: "0",
      expanded: "true",
    });

    if (limit === "all") {
      query.set("size", "1000");
    } else {
      query.set("size", limit);
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await authFetch(`/api/v1/transactions?${query.toString()}`);

      const payload = await parseApiResponse<{ content?: Transaction[] }>(
        response,
      );
      setTransactions(payload.content ?? []);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Unable to load transactions.",
      );
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions(selectedMonth, selectedLimit);
  }, [selectedMonth, selectedLimit]);

  useEffect(() => {
    let isActive = true;

    const loadCategories = async () => {
      setCategoriesLoading(true);
      try {
        const response = await authFetch("/api/v1/metadata/categories");
        const payload = await parseApiResponse<CategoryMeta[]>(response);
        if (!isActive) {
          return;
        }
        setCategories(payload ?? []);
      } catch {
        if (isActive) {
          setCategories([]);
        }
      } finally {
        if (isActive) {
          setCategoriesLoading(false);
        }
      }
    };

    loadCategories();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (formData.type !== "expense") {
      return;
    }

    if (formData.category && categories.some((category) => category.id === formData.category)) {
      return;
    }

    if (categories.length) {
      setFormData((prev) => ({
        ...prev,
        category: categories[0].id,
      }));
    }
  }, [categories, formData.category, formData.type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const amount = Number.parseFloat(formData.amountTry);
    if (Number.isNaN(amount) || amount <= 0) {
      openModal("error", "Please enter a valid amount.");
      return;
    }

    const isExpense = formData.type === "expense";
    const installmentMonths = Number.parseInt(formData.installmentMonths, 10);
    if (isExpense && formData.isInstallment && installmentMonths < 2) {
      openModal("error", "Installments must be at least 2 months.");
      return;
    }

    if (isExpense && !formData.category) {
      openModal("error", "Please select a category.");
      return;
    }

    const payload = {
      title: formData.title.trim() || "Untitled Transaction",
      amountTry: amount,
      date: formData.date,
      category: isExpense ? formData.category : "OTHER",
      type: formData.type,
      paymentMethod: isExpense ? formData.paymentMethod : "transfer",
      isInstallment: isExpense ? formData.isInstallment : false,
      installmentMeta:
        isExpense && formData.isInstallment
          ? {
              totalTry: amount,
              months: installmentMonths,
              startMonth: formData.date.slice(0, 7),
            }
          : undefined,
    };

    setIsSubmitting(true);
    try {
      const response = await authFetch("/api/v1/transactions", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const created = await parseApiResponse<Partial<Transaction>>(response);

      const newTransaction: Transaction = {
        id: created.id ?? `custom-${Date.now()}`,
        title: created.title ?? payload.title,
        amountTry: Number(created.amountTry ?? payload.amountTry),
        date: created.date ?? payload.date,
        category: created.category ?? payload.category,
        type: (created.type ?? payload.type) as TransactionType,
        paymentMethod: (created.paymentMethod ?? payload.paymentMethod) as PaymentMethod,
        isInstallment: created.isInstallment ?? payload.isInstallment,
        installmentMeta: created.installmentMeta ?? payload.installmentMeta,
      };

      setTransactions((prev) => [...prev, newTransaction]);

      setFormData({
        title: "",
        amountTry: "",
        date: new Date().toISOString().split("T")[0],
        category: getDefaultCategoryId(),
        type: "expense",
        paymentMethod: "card",
        isInstallment: false,
        installmentMonths: "2",
      });
      setIsFormOpen(false);
      loadTransactions(selectedMonth, selectedLimit);
      openModal("success", `${newTransaction.title} added.`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save transaction.";
      setSubmitError(message);
      openModal("error", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalIncome = monthlyTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amountTry, 0);

  const totalExpenses = monthlyTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amountTry, 0);

  return (
    <>
      <div className="border-b-2 border-foreground bg-background px-6 py-6 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-tighter text-muted-foreground">
              [ Transaction Manager ]
            </p>
            <h1 className="mt-1 text-3xl font-black uppercase tracking-tighter italic text-foreground">
              Budget Entry
            </h1>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="border-2 border-foreground bg-background p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]">
              <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">Month</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {monthOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedMonth(option.value)}
                    className={cn(
                      "rounded-none border border-foreground px-2 py-1 font-mono text-[10px] font-bold transition-all",
                      option.value === selectedMonth
                        ? "bg-foreground text-background"
                        : "bg-background text-foreground hover:bg-muted/50",
                    )}
                  >
                    {option.label.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-2 border-foreground bg-background p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]">
              <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">Limit</p>
              <select
                value={selectedLimit}
                onChange={(e) => setSelectedLimit(e.target.value)}
                className="mt-1 w-full border-none bg-transparent font-mono text-xs font-bold focus:ring-0 text-foreground"
              >
                <option value="15" className="bg-background">LAST 15</option>
                <option value="30" className="bg-background">LAST 30</option>
                <option value="50" className="bg-background">LAST 50</option>
                <option value="all" className="bg-background">ALL</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="flex items-center gap-2 border-2 border-foreground bg-foreground px-6 py-4 font-mono text-xs font-black uppercase text-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none"
            >
              <Plus className="h-4 w-4" strokeWidth={3} />
              Add Entry
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="mb-10 grid gap-6 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-2 border-foreground bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]"
          >
            <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">Total Income</p>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="font-mono text-3xl font-black tracking-tighter text-foreground">
                  {formatCurrency(totalIncome)}
                </p>
                <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">
                  {monthlyTransactions.filter((t) => t.type === "income").length} ITEMS
                </p>
              </div>
              <div className="border-2 border-foreground bg-[#00ff00] p-2 text-black">
                <ArrowUpRight className="h-6 w-6" strokeWidth={3} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="border-2 border-foreground bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]"
          >
            <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">Total Expenses</p>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="font-mono text-3xl font-black tracking-tighter text-foreground">
                  {formatCurrency(totalExpenses)}
                </p>
                <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">
                  {monthlyTransactions.filter((t) => t.type === "expense").length} ITEMS
                </p>
              </div>
              <div className="border-2 border-foreground bg-[#ff0000] p-2 text-black">
                <ArrowDownRight className="h-6 w-6" strokeWidth={3} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border-2 border-foreground bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]"
          >
            <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">Net Balance</p>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className={cn(
                  "font-mono text-3xl font-black tracking-tighter",
                  totalIncome - totalExpenses >= 0 ? "text-[#00ff00]" : "text-[#ff0000]"
                )}>
                  {formatCurrency(totalIncome - totalExpenses)}
                </p>
                <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">Current Month</p>
              </div>
              <div className={cn(
                "border-2 border-foreground p-2 text-black",
                totalIncome - totalExpenses >= 0 ? "bg-[#00ff00]" : "bg-[#ff0000]"
              )}>
                {totalIncome - totalExpenses >= 0 ? (
                  <ArrowUpRight className="h-6 w-6" strokeWidth={3} />
                ) : (
                  <ArrowDownRight className="h-6 w-6" strokeWidth={3} />
                )}
              </div>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: "auto", opacity: 1, marginBottom: 40 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="border-4 border-foreground bg-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]">
                <h2 className="mb-8 font-mono text-xl font-black uppercase italic text-foreground">
                  // Add New Transaction
                </h2>
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="title" className="font-mono text-[10px] font-black uppercase text-muted-foreground">
                          Transaction Title
                        </label>
                        <input
                          id="title"
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="E.G. GROCERIES"
                        className="w-full rounded-none border-2 border-foreground bg-background px-4 py-3 font-mono text-sm font-bold uppercase placeholder:text-muted-foreground/30 focus:outline-none focus:ring-0 text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="amount" className="font-mono text-[10px] font-black uppercase text-muted-foreground">
                        Amount (TRY)
                      </label>
                      <input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.amountTry}
                        onChange={(e) => setFormData({ ...formData, amountTry: e.target.value })}
                        placeholder="0.00"
                        className="w-full rounded-none border-2 border-foreground bg-background px-4 py-3 font-mono text-sm font-bold focus:outline-none focus:ring-0 text-foreground"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="date" className="font-mono text-[10px] font-black uppercase text-muted-foreground">
                        Date
                      </label>
                      <input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full rounded-none border-2 border-foreground bg-background px-4 py-3 font-mono text-sm font-bold focus:outline-none focus:ring-0 text-foreground"
                        required
                      />
                    </div>

                    {formData.type === "expense" && (
                      <div className="space-y-2">
                        <label htmlFor="category" className="font-mono text-[10px] font-black uppercase text-muted-foreground">
                          Category
                        </label>
                        <select
                          id="category"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full rounded-none border-2 border-foreground bg-background px-4 py-3 font-mono text-sm font-bold uppercase focus:outline-none focus:ring-0 text-foreground"
                        >
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id} className="bg-background">
                              {cat.label.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="font-mono text-[10px] font-black uppercase text-muted-foreground">
                        Transaction Type
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, type: "expense" }))}
                          className={cn(
                            "flex-1 border-2 border-foreground py-3 font-mono text-xs font-black uppercase transition-all",
                            formData.type === "expense"
                              ? "bg-foreground text-background"
                              : "bg-background text-foreground hover:bg-muted/50",
                          )}
                        >
                          Expense
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, type: "income" }))}
                          className={cn(
                            "flex-1 border-2 border-foreground py-3 font-mono text-xs font-black uppercase transition-all",
                            formData.type === "income"
                              ? "bg-foreground text-background"
                              : "bg-background text-foreground hover:bg-muted/50",
                          )}
                        >
                          Income
                        </button>
                      </div>
                    </div>

                    {formData.type === "expense" && (
                      <div className="space-y-2">
                        <label htmlFor="payment" className="font-mono text-[10px] font-black uppercase text-muted-foreground">
                          Payment Method
                        </label>
                        <select
                          id="payment"
                          value={formData.paymentMethod}
                          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                          className="w-full rounded-none border-2 border-foreground bg-background px-4 py-3 font-mono text-sm font-bold uppercase focus:outline-none focus:ring-0 text-foreground"
                        >
                          {PAYMENT_METHODS.map((method) => (
                            <option key={method.value} value={method.value} className="bg-background">
                              {method.label.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {formData.type === "expense" && (
                    <div className="border-2 border-foreground bg-muted/30 p-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isInstallment}
                          onChange={(e) => setFormData({ ...formData, isInstallment: e.target.checked })}
                          className="h-5 w-5 rounded-none border-2 border-foreground bg-background text-foreground focus:ring-0"
                        />
                        <span className="font-mono text-[10px] font-black uppercase text-foreground">
                          Enable Installment Logic
                        </span>
                      </label>
                      {formData.isInstallment && (
                        <div className="mt-4 animate-in slide-in-from-top-1 duration-200">
                          <label className="font-mono text-[10px] font-black uppercase text-muted-foreground">
                            Months
                          </label>
                          <input
                            type="number"
                            min="2"
                            max="60"
                            value={formData.installmentMonths}
                            onChange={(e) => setFormData({ ...formData, installmentMonths: e.target.value })}
                            className="mt-1 w-full border-2 border-foreground bg-background px-4 py-3 font-mono text-sm font-bold focus:outline-none focus:ring-0 md:w-32 text-foreground"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {submitError && (
                    <p className="font-mono text-xs font-bold text-[#ff0000] underline">{submitError}</p>
                  )}

                  <div className="flex flex-col gap-4 sm:flex-row">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 border-2 border-foreground bg-foreground py-4 font-mono text-sm font-black uppercase text-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none"
                    >
                      {isSubmitting ? "Processing..." : "Confirm Transaction"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="border-2 border-foreground bg-background px-8 py-4 font-mono text-sm font-black uppercase text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="border-2 border-foreground bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
          <div className="border-b-2 border-foreground bg-foreground p-4 text-background">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={filteredTransactions.length > 0 && selectedIds.size === filteredTransactions.length}
                  onChange={handleSelectAll}
                  className="h-5 w-5 rounded-none border-2 border-background bg-transparent text-background focus:ring-0"
                />
                <div>
                  <h2 className="font-mono text-lg font-black uppercase italic tracking-tighter">
                    {"Data Ledger //"} {monthOptions.find((m) => m.value === selectedMonth)?.label.toUpperCase()}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-6">
                {selectedIds.size > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="bg-[#ff0000] px-4 py-1 font-mono text-[10px] font-black uppercase text-black border border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none"
                  >
                    Delete Selected ({selectedIds.size})
                  </button>
                )}
                <span className="font-mono text-xs font-bold uppercase">
                  Count: {filteredTransactions.length}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="border-b-2 border-foreground bg-muted/30">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <span className="font-mono text-[10px] font-black uppercase text-foreground">Status</span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="font-mono text-[10px] font-black uppercase text-foreground">Description</span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="font-mono text-[10px] font-black uppercase text-foreground">Category</span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="font-mono text-[10px] font-black uppercase text-foreground">Date</span>
                  </th>
                  <th className="px-6 py-3 text-right">
                    <span className="font-mono text-[10px] font-black uppercase text-foreground">Amount</span>
                  </th>
                  <th className="px-6 py-3 text-center">
                    <span className="font-mono text-[10px] font-black uppercase text-foreground">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-muted">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center font-mono text-sm font-black uppercase italic text-muted-foreground">
                      Loading encrypted data...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center font-mono text-sm font-black uppercase italic text-muted-foreground">
                      No records found
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className={cn(
                        "transition-colors",
                        selectedIds.has(transaction.id) ? "bg-muted/30" : "hover:bg-muted/20",
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(transaction.id)}
                            onChange={() => handleToggleSelect(transaction.id)}
                            className="h-5 w-5 rounded-none border-2 border-foreground bg-background text-foreground focus:ring-0"
                          />
                          <div className={cn(
                            "border-2 border-foreground p-1",
                            transaction.type === "expense" ? "bg-[#ff0000]" : "bg-[#00ff00]"
                          )}>
                            {transaction.type === "expense" ? (
                              <ArrowDownRight className="h-4 w-4 text-black" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-black" />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-mono text-sm font-black uppercase tracking-tight text-foreground">
                          {transaction.title}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="border border-foreground bg-background px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-foreground">
                          {getCategoryLabel(transaction.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-mono text-xs font-bold text-muted-foreground">
                          {transaction.date}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className={cn(
                          "font-mono text-lg font-black tracking-tighter",
                          transaction.type === "expense" ? "text-[#ff0000]" : "text-[#00ff00]"
                        )}>
                          {transaction.type === "expense" ? "-" : "+"}
                          {formatCurrency(transaction.amountTry)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedIds(new Set([transaction.id]));
                            handleBulkDelete();
                          }}
                          className="border border-foreground p-2 transition-all hover:bg-[#ff0000] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)] active:translate-x-0 active:translate-y-0 active:shadow-none text-foreground hover:text-black"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={3} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {modal && (
          <FeedbackModal
            open={modalOpen}
            type={modal.type}
            title={modal.title}
            message={modal.message}
            onClose={closeModal}
          />
        )}
      </div>
    </>
  );
}
