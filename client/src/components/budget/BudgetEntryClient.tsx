"use client";

import { useState } from "react";
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
  BASE_TRANSACTIONS,
  expandInstallments,
  formatCurrency,
  type PaymentMethod,
  type Transaction,
  type TransactionType,
} from "@/lib/fintrack";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Housing",
  "Food",
  "Transport",
  "Utilities",
  "Lifestyle",
  "Debt",
  "Installment",
  "Healthcare",
  "Education",
  "Entertainment",
  "Other",
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "card", label: "Credit Card" },
  { value: "cash", label: "Cash" },
  { value: "transfer", label: "Bank Transfer" },
];

export default function BudgetEntryClient() {
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    expandInstallments(BASE_TRANSACTIONS),
  );
  const [selectedMonth, setSelectedMonth] = useState("2026-02");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    amountTry: "",
    date: new Date().toISOString().split("T")[0],
    category: "Food",
    type: "expense" as TransactionType,
    paymentMethod: "card" as PaymentMethod,
    isInstallment: false,
    installmentMonths: "1",
  });

  const monthlyTransactions = transactions
    .filter((t) => t.date.startsWith(selectedMonth))
    .sort((a, b) => b.date.localeCompare(a.date));

  const monthOptions = [
    { value: "2026-02", label: "Feb 2026" },
    { value: "2026-03", label: "Mar 2026" },
    { value: "2026-04", label: "Apr 2026" },
    { value: "2026-05", label: "May 2026" },
    { value: "2026-06", label: "Jun 2026" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amount = Number.parseFloat(formData.amountTry);
    if (Number.isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const newTransaction: Transaction = {
      id: `custom-${Date.now()}`,
      title: formData.title.trim() || "Untitled Transaction",
      amountTry: amount,
      date: formData.date,
      category: formData.category,
      type: formData.type,
      paymentMethod: formData.paymentMethod,
      isInstallment: formData.isInstallment,
      installmentMeta: formData.isInstallment
        ? {
            totalTry: amount,
            months: Number.parseInt(formData.installmentMonths, 10),
            startMonth: formData.date.slice(0, 7),
          }
        : undefined,
    };

    setTransactions((prev) => {
      const updated = [...prev, newTransaction];
      return formData.isInstallment ? expandInstallments(updated) : updated;
    });

    setFormData({
      title: "",
      amountTry: "",
      date: new Date().toISOString().split("T")[0],
      category: "Food",
      type: "expense",
      paymentMethod: "card",
      isInstallment: false,
      installmentMonths: "1",
    });
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
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
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, type: "expense" })
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
                      onClick={() => setFormData({ ...formData, type: "income" })}
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
              </div>

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
                      min="1"
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

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                  Add Transaction
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

          {monthlyTransactions.length === 0 ? (
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
                          {transaction.category}
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
      </div>
    </>
  );
}
