import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InvestmentsClient from '@/components/investment/InvestmentsClient';
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
  Coins: () => <span>Coins</span>,
  DollarSign: () => <span>DollarSign</span>,
  Edit2: () => <span>Edit2</span>,
  Lock: () => <span>Lock</span>,
  Plus: () => <span>Plus</span>,
  TurkishLira: () => <span>TurkishLira</span>,
  ArrowDownRight: () => <span>ArrowDownRight</span>,
  ArrowUpRight: () => <span>ArrowUpRight</span>,
  Wallet: () => <span>Wallet</span>,
  X: () => <span>X</span>,
}));

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => <div>Pie</div>,
  Cell: () => <div>Cell</div>,
  Tooltip: () => <div>Tooltip</div>,
}));

const mockAssets = [
  { 
    id: '1', 
    symbol: 'AAPL', 
    name: 'Apple Inc.', 
    quantity: 10, 
    avgCostTry: 5000, 
    currentPriceTry: 5500, 
    changePercent: 10, 
    profitLossTry: 5000,
    assetType: 'STOCK',
    stockMarket: 'NASDAQ'
  },
];

const mockSupportedAssets = {
  FUND: [{ slug: 'TFA', label: 'TFA Fund' }],
};

const mockStockMarkets = [
  { id: 'NASDAQ', label: 'Nasdaq', suffix: '.US', currency: 'USD', supportedAssetTypes: ['STOCK'] },
];

describe('InvestmentsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (authFetch as any).mockResolvedValue({ ok: true });
  });

  it('renders investment data correctly after loading', async () => {
    (parseApiResponse as any)
      .mockResolvedValueOnce(mockAssets) // investments
      .mockResolvedValueOnce(mockSupportedAssets) // supported-assets
      .mockResolvedValueOnce(mockStockMarkets); // stock-markets

    render(<InvestmentsClient />);

    await waitFor(() => {
      expect(screen.getByText('Investments')).toBeInTheDocument();
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Invested')).toBeInTheDocument();
    expect(screen.getByText('50.000,00')).toBeInTheDocument(); // 10 * 5000
  });

  it('opens and closes the add asset form', async () => {
    (parseApiResponse as any)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce(mockStockMarkets);

    render(<InvestmentsClient />);

    const addButton = screen.getByRole('button', { name: /Add Asset/i });
    fireEvent.click(addButton);

    expect(screen.getByText('// Add Position')).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('// Add Position')).not.toBeInTheDocument();
    });
  });

  it('submits a new investment successfully', async () => {
    (parseApiResponse as any)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce(mockStockMarkets);

    render(<InvestmentsClient />);

    fireEvent.click(screen.getByRole('button', { name: /Add Asset/i }));

    // Fill form
    fireEvent.change(screen.getByLabelText(/Trading Symbol/i), { target: { value: 'TSLA' } });
    fireEvent.change(screen.getByLabelText(/Quantity/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/Avg Cost Basis/i), { target: { value: '800' } });

    (parseApiResponse as any).mockResolvedValueOnce({ id: '2', symbol: 'TSLA', quantity: 5, avgCostTry: 800, currentPriceTry: 850, changePercent: 6.25, profitLossTry: 250 });

    fireEvent.click(screen.getByRole('button', { name: /Open Position/i }));

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith('/api/v1/investments', expect.objectContaining({ method: 'POST' }));
    });
  });

  it('verifies brutalist styling', () => {
    const { container } = render(<InvestmentsClient />);
    const header = container.querySelector('.border-b-2.border-black');
    expect(header).toBeInTheDocument();
  });
});
