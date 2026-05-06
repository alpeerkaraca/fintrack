import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { authFetch } from '@/lib/auth';
import { parseApiResponse } from '@/lib/api';

// Mock lib/auth
vi.mock('@/lib/auth', () => ({
  authFetch: vi.fn(),
}));

// Mock lib/api
vi.mock('@/lib/api', () => ({
  parseApiResponse: vi.fn(),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  ArrowUpRight: () => <span>ArrowUpRight</span>,
  ArrowDownRight: () => <span>ArrowDownRight</span>,
  Wallet: () => <span>Wallet</span>,
  CreditCard: () => <span>CreditCard</span>,
  Calendar: () => <span>Calendar</span>,
  Coins: () => <span>Coins</span>,
  DollarSign: () => <span>DollarSign</span>,
  TurkishLira: () => <span>TurkishLira</span>,
}));

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => <div>Area</div>,
  XAxis: () => <div>XAxis</div>,
  YAxis: () => <div>YAxis</div>,
  Tooltip: () => <div>Tooltip</div>,
}));

const mockDashboardData = {
  summary: {
    income: 10000,
    expense: 5000,
    savings: 5000,
    creditCardLimit: 20000,
    usdRate: 30,
  },
  forecast: [
    { month: '2026-03', label: 'Mar 2026', savings: 5000 },
    { month: '2026-04', label: 'Apr 2026', savings: 6000 },
  ],
  categoryWatchlist: [
    { category: 'Food', limitTry: 2000, spentTry: 1500 },
    { category: 'Rent', limitTry: 5000, spentTry: 5000 },
  ],
  investments: [
    { symbol: 'AAPL', name: 'Apple Inc.', quantity: 10, avgCostTry: 5000, currentPriceTry: 5500, changePercent: 10, profitLossTry: 5000 },
  ],
  savingsGoals: [
    { id: '1', title: 'New Car', targetAmount: 100000, currentAmount: 20000, progressPercent: 20, currency: 'TRY' },
  ],
  recentTransactions: {
    content: [
      { id: 't1', title: 'Grocery', amountTry: 200, date: '2026-03-23', category: 'Food', type: 'expense' },
    ],
  },
};

const mockMonthOptions = [
  { value: '2026-03', label: 'Mar 2026' },
  { value: '2026-04', label: 'Apr 2026' },
];

const mockCategories = [
  { id: 'Food', label: 'Groceries' },
  { id: 'Rent', label: 'Housing' },
];

describe('DashboardClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (authFetch as any).mockImplementation((url: string) => {
      if (url.includes('available-months')) return Promise.resolve({ ok: true });
      if (url.includes('overview')) return Promise.resolve({ ok: true });
      if (url.includes('categories')) return Promise.resolve({ ok: true });
      return Promise.resolve({ ok: true });
    });

    (parseApiResponse as any).mockImplementation((response: any) => {
      // We need a way to distinguish which call it is based on some context, 
      // but parseApiResponse only takes the response.
      // In DashboardClient, it's called sequentially.
      // Actually we can use mockResolvedValueOnce in order.
    });
  });

  it('renders loading state initially', async () => {
    // Make parseApiResponse hang or return nothing yet
    (parseApiResponse as any).mockReturnValue(new Promise(() => {}));
    
    render(<DashboardClient />);
    expect(screen.getByTestId('dashboard-loading-spinner')).toBeInTheDocument();
  });

  it('renders dashboard data correctly after loading', async () => {
    (parseApiResponse as any)
      .mockResolvedValueOnce(mockMonthOptions) // available-months
      .mockResolvedValueOnce(mockDashboardData) // overview
      .mockResolvedValueOnce(mockCategories); // categories

    render(<DashboardClient />);

    await waitFor(() => {
      expect(screen.getByText('System_Overview')).toBeInTheDocument();
      expect(screen.getByText(/Total_Income/i)).toBeInTheDocument();
      // Multiple elements might have this text (card and recent activity)
      const incomeElements = screen.getAllByText(/10.000,00/);
      expect(incomeElements.length).toBeGreaterThan(0);
    });

    expect(screen.getByText('Groceries')).toBeInTheDocument(); // mapped from mockCategories
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('New Car')).toBeInTheDocument();
    expect(screen.getByText('Grocery')).toBeInTheDocument();
  });

  it('changes month when a month button is clicked', async () => {
    (parseApiResponse as any)
      .mockResolvedValueOnce(mockMonthOptions)
      .mockResolvedValue(mockDashboardData) // For subsequent calls
      .mockResolvedValue(mockCategories);

    render(<DashboardClient />);

    await waitFor(() => {
      expect(screen.getByText('MAR 2026')).toBeInTheDocument();
    });

    const aprButton = screen.getByRole('button', { name: /APR 2026/i });
    fireEvent.click(aprButton);

    await waitFor(() => {
      // Verify authFetch was called with the new month
      expect(authFetch).toHaveBeenCalledWith(expect.stringContaining('month=4&year=2026'));
    });
  });

  it('shows Boss Fight Status as CRITICAL_RISK when expenses are high', async () => {
    const highExpenseData = {
      ...mockDashboardData,
      summary: {
        ...mockDashboardData.summary,
        income: 10000,
        expense: 9000, // 90% > 85%
      }
    };

    (parseApiResponse as any)
      .mockResolvedValueOnce(mockMonthOptions)
      .mockResolvedValueOnce(highExpenseData)
      .mockResolvedValueOnce(mockCategories);

    render(<DashboardClient />);

    await waitFor(() => {
      expect(screen.getByText('CRITICAL_RISK')).toBeInTheDocument();
      expect(screen.getByText(/EXPENDITURE EXCEEDS 85%/)).toBeInTheDocument();
    });
  });

  it('verifies brutalist styling', async () => {
    (parseApiResponse as any)
      .mockResolvedValueOnce(mockMonthOptions)
      .mockResolvedValueOnce(mockDashboardData)
      .mockResolvedValueOnce(mockCategories);

    const { container } = render(<DashboardClient />);

    await waitFor(() => {
      const borders = container.querySelectorAll('.border-4.border-slate-900');
      expect(borders.length).toBeGreaterThan(0);
      
      const shadows = container.querySelectorAll('.shadow-\\[8px_8px_0px_0px_rgba\\(0\\,0\\,0\\,1\\)\\]');
      expect(shadows.length).toBeGreaterThan(0);
    });
  });
});
