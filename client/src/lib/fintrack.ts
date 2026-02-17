export type TransactionType = "income" | "expense";
export type PaymentMethod = "card" | "cash" | "transfer";

export interface InstallmentMeta {
  totalTry: number;
  months: number;
  startMonth: string;
}

export interface Transaction {
  id: string;
  title: string;
  amountTry: number;
  date: string;
  category: string;
  type: TransactionType;
  paymentMethod?: PaymentMethod;
  isInstallment?: boolean;
  installmentMeta?: InstallmentMeta;
}

export type CategoryMeta = {
  id: string;
  label: string;
  icon?: string;
};

export type StockMarketMeta = {
  id: string;
  label: string;
  suffix: string;
  currency: string;
  supportedAssetTypes: string[];
};

export interface BudgetCategory {
  category: string;
  limitTry: number;
  spentTry: number;
}

export interface BudgetMonth {
  month: string;
  label: string;
  incomeTry: number;
  expensesTry: number;
  netSavingsTry: number;
  categories: BudgetCategory[];
}

export interface InvestmentAsset {
  id?: string;
  symbol: string;
  name: string;
  quantity: number;
  avgCostTry: number;
  currentPriceTry: number;
  changePercent: number;
  profitLossTry: number;
  assetType?: string;
  stockMarket?: string;
  stockMarketDisplayName?: string;
  originalCurrency?: string;
  avgCostOriginal?: number;
  currentPriceOriginal?: number;
}

export const USD_TRY_RATE :number = await fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json")
    .then((res) => res.json())
    .then((data) => data.usd.try)
    .catch(() => 27.0);

export const CATEGORY_LIMITS: Record<string, number> = {
  Housing: 9000,
  Food: 10000,
  Transport: 2000,
  Utilities: 1500,
  Lifestyle: 2500,
  Debt: 20000,
  Installment: 2500,
};

export const BASE_TRANSACTIONS: Transaction[] = [
  {
    id: "rent-2026-02",
    title: "Rent",
    amountTry: 8500,
    date: "2026-02-01",
    category: "Housing",
    type: "expense",
    paymentMethod: "transfer",
  },
  {
    id: "food-2026-02",
    title: "Groceries",
    amountTry: 3200,
    date: "2026-02-06",
    category: "Food",
    type: "expense",
    paymentMethod: "card",
  },
  {
    id: "transport-2026-02",
    title: "Transport",
    amountTry: 950,
    date: "2026-02-09",
    category: "Transport",
    type: "expense",
    paymentMethod: "card",
  },
  {
    id: "utilities-2026-02",
    title: "Utilities",
    amountTry: 1200,
    date: "2026-02-12",
    category: "Utilities",
    type: "expense",
    paymentMethod: "transfer",
  },
  {
    id: "lifestyle-2026-02",
    title: "Gym + Streaming",
    amountTry: 1300,
    date: "2026-02-15",
    category: "Lifestyle",
    type: "expense",
    paymentMethod: "card",
  },
  {
    id: "rent-2026-03",
    title: "Rent",
    amountTry: 8500,
    date: "2026-03-01",
    category: "Housing",
    type: "expense",
    paymentMethod: "transfer",
  },
  {
    id: "food-2026-03",
    title: "Groceries",
    amountTry: 3300,
    date: "2026-03-06",
    category: "Food",
    type: "expense",
    paymentMethod: "card",
  },
  {
    id: "valentine-2026-03",
    title: "Valentine's Day",
    amountTry: 1500,
    date: "2026-03-14",
    category: "Lifestyle",
    type: "expense",
    paymentMethod: "card",
  },
  {
    id: "father-debt-2026-03",
    title: "Father's Debt",
    amountTry: 20000,
    date: "2026-03-20",
    category: "Debt",
    type: "expense",
    paymentMethod: "transfer",
  },
  {
    id: "utilities-2026-03",
    title: "Utilities",
    amountTry: 1250,
    date: "2026-03-21",
    category: "Utilities",
    type: "expense",
    paymentMethod: "transfer",
  },
  {
    id: "installment-phone",
    title: "Phone Installment",
    amountTry: 0,
    date: "2026-03-05",
    category: "Installment",
    type: "expense",
    paymentMethod: "card",
    isInstallment: true,
    installmentMeta: {
      totalTry: 18000,
      months: 9,
      startMonth: "2026-03",
    },
  },
  {
    id: "rent-2026-04",
    title: "Rent",
    amountTry: 8500,
    date: "2026-04-01",
    category: "Housing",
    type: "expense",
    paymentMethod: "transfer",
  },
  {
    id: "food-2026-04",
    title: "Groceries",
    amountTry: 3100,
    date: "2026-04-06",
    category: "Food",
    type: "expense",
    paymentMethod: "card",
  },
  {
    id: "transport-2026-04",
    title: "Transport",
    amountTry: 850,
    date: "2026-04-09",
    category: "Transport",
    type: "expense",
    paymentMethod: "card",
  },
  {
    id: "utilities-2026-04",
    title: "Utilities",
    amountTry: 1150,
    date: "2026-04-12",
    category: "Utilities",
    type: "expense",
    paymentMethod: "transfer",
  },
  {
    id: "lifestyle-2026-04",
    title: "Weekend escape",
    amountTry: 2200,
    date: "2026-04-17",
    category: "Lifestyle",
    type: "expense",
    paymentMethod: "card",
  },
  {
    id: "rent-2026-05",
    title: "Rent",
    amountTry: 8500,
    date: "2026-05-01",
    category: "Housing",
    type: "expense",
    paymentMethod: "transfer",
  },
  {
    id: "food-2026-05",
    title: "Groceries",
    amountTry: 3050,
    date: "2026-05-06",
    category: "Food",
    type: "expense",
    paymentMethod: "card",
  },
  {
    id: "utilities-2026-05",
    title: "Utilities",
    amountTry: 1100,
    date: "2026-05-12",
    category: "Utilities",
    type: "expense",
    paymentMethod: "transfer",
  },
  {
    id: "lifestyle-2026-05",
    title: "Tech accessories",
    amountTry: 1400,
    date: "2026-05-19",
    category: "Lifestyle",
    type: "expense",
    paymentMethod: "card",
  },
];

const monthLabels: Record<string, string> = {
  "2026-02": "Feb 2026",
  "2026-03": "Mar 2026",
  "2026-04": "Apr 2026",
  "2026-05": "May 2026",
  "2026-06": "Jun 2026",
};

const monthOrder = Object.keys(monthLabels);

const padMonth = (month: number) => `${month}`.padStart(2, "0");

export const addMonths = (monthKey: string, offset: number) => {
  const [year, month] = monthKey.split("-").map(Number);
  const base = new Date(year, month - 1, 1);
  base.setMonth(base.getMonth() + offset);
  return `${base.getFullYear()}-${padMonth(base.getMonth() + 1)}`;
};

export const expandInstallments = (transactions: Transaction[]) => {
  const expanded: Transaction[] = [];

  transactions.forEach((transaction) => {
    if (!transaction.isInstallment || !transaction.installmentMeta) {
      expanded.push(transaction);
      return;
    }

    const { totalTry, months, startMonth } = transaction.installmentMeta;
    const installmentAmount = Number((totalTry / months).toFixed(2));

    for (let i = 0; i < months; i += 1) {
      const monthKey = addMonths(startMonth, i);
      expanded.push({
        ...transaction,
        id: `${transaction.id}-${i + 1}`,
        amountTry: installmentAmount,
        date: `${monthKey}-05`,
        title: `${transaction.title} (${i + 1}/${months})`,
        isInstallment: false,
        installmentMeta: undefined,
      });
    }
  });

  return expanded;
};

export const buildBudgets = (
  salaryUsd: number,
  usdTryRate: number,
  transactions: Transaction[],
) => {
  const incomeTry = Number((salaryUsd * usdTryRate).toFixed(2));

  return monthOrder.map((monthKey) => {
    const monthTransactions = transactions.filter((transaction) =>
      transaction.date.startsWith(monthKey),
    );

    const expensesTry = monthTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((total, transaction) => total + transaction.amountTry, 0);

    const categories = Object.entries(CATEGORY_LIMITS).map(
      ([category, limitTry]) => {
        const spentTry = monthTransactions
          .filter((transaction) => transaction.category === category)
          .reduce((total, transaction) => total + transaction.amountTry, 0);
        return {
          category,
          limitTry,
          spentTry,
        } satisfies BudgetCategory;
      },
    );

    return {
      month: monthKey,
      label: monthLabels[monthKey] ?? monthKey,
      incomeTry,
      expensesTry,
      netSavingsTry: incomeTry - expensesTry,
      categories,
    } satisfies BudgetMonth;
  });
};

export const getMonthlyTransactions = (
  monthKey: string,
  transactions: Transaction[],
) =>
  transactions
    .filter((transaction) => transaction.date.startsWith(monthKey))
    .sort((a, b) => b.date.localeCompare(a.date));

export const formatCurrency = (value: number, currency = "TRY") =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 4,
  }).format(value);

export const formatCurrencyWithPrecision = (
  value: number,
  currency = "TRY",
  fractionDigits = 4,
) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);

export const formatCurrencyTrimZeros = (
  value: number,
  currency = "TRY",
  maxFractionDigits = 4,
) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  }).format(value);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 2,
  }).format(value);

export const getInstallmentSummary = (transactions: Transaction[]) =>
  transactions.filter((transaction) => transaction.category === "Installment");
