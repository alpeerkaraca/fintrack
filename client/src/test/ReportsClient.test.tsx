import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReportsClient from '@/components/reports/ReportsClient';
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

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
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
  ArrowLeft: () => <span>ArrowLeft</span>,
  Calendar: () => <span>Calendar</span>,
  Download: () => <span>Download</span>,
  PieChart: () => <span>PieChartIcon</span>,
  ArrowUpRight: () => <span>ArrowUpRight</span>,
  ArrowDownRight: () => <span>ArrowDownRight</span>,
}));

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => <div>Line</div>,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => <div>Bar</div>,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => <div>Pie</div>,
  Cell: () => <div>Cell</div>,
  XAxis: () => <div>XAxis</div>,
  YAxis: () => <div>YAxis</div>,
  CartesianGrid: () => <div>CartesianGrid</div>,
  Tooltip: () => <div>Tooltip</div>,
  Legend: () => <div>Legend</div>,
}));

const mockReportSummary = {
  currency: 'TRY',
  range: { start: '2026-01-01', end: '2026-03-31' },
  totals: {
    incomeTry: 30000,
    expenseTry: 15000,
    netSavingsTry: 15000,
    savingsRatePct: 50,
  },
  averages: {
    monthlyIncomeTry: 10000,
    monthlyExpenseTry: 5000,
    monthlySavingsTry: 5000,
  },
  monthlySeries: [
    { month: '2026-01', label: 'Jan 2026', incomeTry: 10000, expenseTry: 5000, netSavingsTry: 5000 },
    { month: '2026-02', label: 'Feb 2026', incomeTry: 10000, expenseTry: 5000, netSavingsTry: 5000 },
    { month: '2026-03', label: 'Mar 2026', incomeTry: 10000, expenseTry: 5000, netSavingsTry: 5000 },
  ],
  categoryBreakdown: [
    { categoryId: 'Housing', categoryLabel: 'Housing', totalTry: 6000 },
    { categoryId: 'Food', categoryLabel: 'Food', totalTry: 4000 },
  ],
  topCategory: { categoryId: 'Housing', categoryLabel: 'Housing', totalTry: 6000 },
  metadata: { generatedAt: '2026-03-23T12:00:00Z' },
};

describe('ReportsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (authFetch as any).mockResolvedValue({ ok: true });
    (parseApiResponse as any).mockResolvedValue(mockReportSummary);
    
    // Mock URL methods for export
    global.URL.createObjectURL = vi.fn();
    global.URL.revokeObjectURL = vi.fn();
  });

  it('renders report data correctly after loading', async () => {
    render(<ReportsClient />);

    await waitFor(() => {
      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText(/30\.000,00/)).toBeInTheDocument(); // total income
    });

    expect(screen.getByText(/50%/)).toBeInTheDocument(); // savings rate
    expect(screen.getByText(/Housing \/\/ 6\.000,00/)).toBeInTheDocument(); // insight
  });

  it('switches between report views', async () => {
    render(<ReportsClient />);

    await waitFor(() => {
      expect(screen.getByText('Income vs Expenses vs Savings')).toBeInTheDocument();
    });

    const categoryBtn = screen.getByRole('button', { name: /CATEGORY/i });
    fireEvent.click(categoryBtn);

    expect(screen.getByText('Sector Breakdown')).toBeInTheDocument();

    const forecastBtn = screen.getByRole('button', { name: /FORECAST/i });
    fireEvent.click(forecastBtn);

    expect(screen.getByText('Savings Forecast')).toBeInTheDocument();
  });

  it('triggers report reload when clicking Run', async () => {
    render(<ReportsClient />);
    
    await waitFor(() => {
        expect(authFetch).toHaveBeenCalledTimes(1);
    });

    const runBtn = screen.getByRole('button', { name: /Run/i });
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledTimes(2);
    });
  });

  it('handles export JSON', async () => {
    const mockClick = vi.fn();
    const mockAppendChild = vi.spyOn(document.body, 'appendChild').mockImplementation(vi.fn());
    const mockRemoveChild = vi.spyOn(document.body, 'removeChild').mockImplementation(vi.fn());
    
    // Partially mock createElement for the anchor tag
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'a') {
            return {
                click: mockClick,
                href: '',
                download: '',
                style: {}
            } as any;
        }
        return originalCreateElement(tagName);
    });

    render(<ReportsClient />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Export .JSON/i })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Export .JSON/i }));

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
  });

  it('verifies brutalist styling', () => {
    const { container } = render(<ReportsClient />);
    const cards = container.querySelectorAll('.border-2.border-black.shadow-\\[4px_4px_0px_0px_rgba\\(0\\,0\\,0\\,1\\)\\]');
    expect(cards.length).toBeGreaterThan(0);
  });
});
