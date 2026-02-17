"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  Plus,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
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

export default function BudgetEntryClient() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("2026-02");
  const [selectedLimit, setSelectedLimit] = useState("15");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryMeta[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
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

  const monthOptions = [
    { value: "2026-02", label: "Feb 2026" },
    { value: "2026-03", label: "Mar 2026" },
    { value: "2026-04", label: "Apr 2026" },
    { value: "2026-05", label: "May 2026" },
    { value: "2026-06", label: "Jun 2026" },
  ];

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

  const handleDelete = (id: string) => {
    const transaction = transactions.find((item) => item.id === id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    openModal(
      "success",
      `${transaction?.title ?? "Transaction"} removed.`,
    );
  };

  const totalIncome = monthlyTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amountTry, 0);

  const totalExpenses = monthlyTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amountTry, 0);

  return (
    <>
      <div className="border-b border-border bg-card/60 px-6 py-6 lg:px-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div>
              <p className="text-sm text-muted-foreground">Transaction Manager</p>
              <h1 className="text-2xl font-semibold">Budget Entry</h1>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-border bg-card/60 px-4 py-3">
              <p className="text-xs text-muted-foreground">Select Month</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {monthOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedMonth(option.value)}
                    className={cn(
                      "rounded-lg px-3 py-1 text-xs transition",
                      option.value === selectedMonth
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/70 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 px-4 py-3">
              <p className="text-xs text-muted-foreground">Show</p>
              <select
                value={selectedLimit}
                onChange={(e) => setSelectedLimit(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="15">Last 15</option>
                <option value="30">Last 30</option>
                <option value="50">Last 50</option>
                <option value="all">All</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Transaction
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card/70 p-5">
            <p className="text-xs text-muted-foreground">Total Income</p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold">
                  {formatCurrency(totalIncome)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {monthlyTransactions.filter((t) => t.type === "income").length}{" "}
                  transactions
                </p>
              </div>
              <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-400">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/70 p-5">
            <p className="text-xs text-muted-foreground">Total Expenses</p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold">
                  {formatCurrency(totalExpenses)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {monthlyTransactions.filter((t) => t.type === "expense").length}{" "}
                  transactions
                </p>
              </div>
              <div className="rounded-full bg-rose-500/10 p-3 text-rose-400">
                <TrendingDown className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/70 p-5">
            <p className="text-xs text-muted-foreground">Net Balance</p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold">
                  {formatCurrency(totalIncome - totalExpenses)}
                </p>
                <p className="text-xs text-muted-foreground">For selected month</p>
              </div>
              <div className="rounded-full bg-sky-500/10 p-3 text-sky-400">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        {isFormOpen && (
          <div className="mb-6 rounded-2xl border border-border bg-card/70 p-6">
            <h2 className="mb-5 text-lg font-semibold">New Transaction</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="title"
                    className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., Groceries, Salary"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="amount"
                    className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    Amount (TRY)
                  </label>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amountTry}
                    onChange={(e) =>
                      setFormData({ ...formData, amountTry: e.target.value })
                    }
                    placeholder="0.00"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="date"
                    className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Date
                  </label>
                  <input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                {formData.type === "expense" && (
                  <div>
                    <label
                      htmlFor="category"
                      className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <Tag className="h-3.5 w-3.5" />
                      Category
                    </label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      disabled={categoriesLoading || categories.length === 0}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {categoriesLoading && (
                        <option value="">Loading categories...</option>
                      )}
                      {!categoriesLoading && categories.length === 0 && (
                        <option value="">No categories available</option>
                      )}
                      {!categoriesLoading &&
                        categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.label}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          type: "expense",
                          category: prev.category || getDefaultCategoryId(),
                        }))
                      }
                      className={cn(
                        "flex-1 rounded-xl border px-4 py-2.5 text-sm transition",
                        formData.type === "expense"
                          ? "border-rose-500 bg-rose-500/10 text-rose-400"
                          : "border-border bg-background text-muted-foreground hover:border-primary/50",
                      )}
                    >
                      Expense
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          type: "income",
                          category: "OTHER",
                          paymentMethod: "transfer",
                          isInstallment: false,
                          installmentMonths: "2",
                        }))
                      }
                      className={cn(
                        "flex-1 rounded-xl border px-4 py-2.5 text-sm transition",
                        formData.type === "income"
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                          : "border-border bg-background text-muted-foreground hover:border-primary/50",
                      )}
                    >
                      Income
                    </button>
                  </div>
                </div>

                {formData.type === "expense" && (
                  <div>
                    <label
                      htmlFor="payment"
                      className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Payment Method
                    </label>
                    <select
                      id="payment"
                      value={formData.paymentMethod}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentMethod: e.target.value as PaymentMethod,
                        })
                      }
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {formData.type === "expense" && (
                <div className="rounded-xl border border-border bg-background/60 p-4">
                  <div className="flex items-center gap-3">
                    <input
                      id="installment"
                      type="checkbox"
                      checked={formData.isInstallment}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isInstallment: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-border"
                    />
                    <label htmlFor="installment" className="text-sm">
                      This is an installment payment
                    </label>
                  </div>
                  {formData.isInstallment && (
                    <div className="mt-3">
                      <label
                        htmlFor="months"
                        className="mb-2 block text-xs text-muted-foreground"
                      >
                        Number of Months
                      </label>
                      <input
                        id="months"
                        type="number"
                        min="2"
                        max="60"
                        value={formData.installmentMonths}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            installmentMonths: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 md:w-48"
                      />
                    </div>
                  )}
                </div>
              )}

              {submitError && (
                <p className="text-sm text-rose-400">{submitError}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                  {isSubmitting ? "Saving..." : "Add Transaction"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-medium transition hover:bg-muted/50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card/70 p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Transactions
              </p>
              <h2 className="text-lg font-semibold">
                {monthOptions.find((m) => m.value === selectedMonth)?.label}
              </h2>
            </div>
            <span className="text-sm text-muted-foreground">
              {monthlyTransactions.length} total
            </span>
          </div>

          {loadError && (
            <p className="mb-4 text-sm text-rose-400">{loadError}</p>
          )}

          {isLoading ? (
            <div className="rounded-xl border border-dashed border-border bg-background/60 py-16 text-center">
              <p className="text-sm text-muted-foreground">Loading transactions...</p>
            </div>
          ) : monthlyTransactions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-background/60 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                No transactions found for this month
              </p>
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="mt-4 text-sm text-primary hover:underline"
              >
                Add your first transaction
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {monthlyTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-5 py-4 transition hover:bg-muted/30"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "rounded-full p-2.5",
                        transaction.type === "expense"
                          ? "bg-rose-500/10 text-rose-400"
                          : "bg-emerald-500/10 text-emerald-400",
                      )}
                    >
                      {transaction.type === "expense" ? (
                        <TrendingDown className="h-4 w-4" />
                      ) : (
                        <TrendingUp className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{transaction.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded bg-muted/60 px-2 py-0.5">
                          {getCategoryLabel(transaction.category)}
                        </span>
                        <span>{transaction.date}</span>
                        {transaction.paymentMethod && (
                          <span className="rounded bg-muted/60 px-2 py-0.5 capitalize">
                            {transaction.paymentMethod}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p
                      className={cn(
                        "text-lg font-semibold",
                        transaction.type === "expense"
                          ? "text-rose-400"
                          : "text-emerald-400",
                      )}
                    >
                      {transaction.type === "expense" ? "-" : "+"}
                      {formatCurrency(transaction.amountTry)}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleDelete(transaction.id)}
                      className="rounded-lg p-2 text-muted-foreground transition hover:bg-rose-500/10 hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
