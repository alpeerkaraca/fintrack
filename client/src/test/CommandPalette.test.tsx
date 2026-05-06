import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { authFetch } from '@/lib/auth';
import { parseApiResponse } from '@/lib/api';
import { useRouter } from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock lib/auth
vi.mock('@/lib/auth', () => ({
  authFetch: vi.fn(),
}));

// Mock lib/api
vi.mock('@/lib/api', () => ({
  parseApiResponse: vi.fn(),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Calculator: () => <span>Calculator</span>,
  CreditCard: () => <span>CreditCard</span>,
  LayoutGrid: () => <span>LayoutGrid</span>,
  PieChart: () => <span>PieChart</span>,
  Plus: () => <span>Plus</span>,
  Search: () => <span>Search</span>,
  ArrowUpRight: () => <span>ArrowUpRight</span>,
  Wallet: () => <span>Wallet</span>,
  Tag: () => <span>Tag</span>,
  ArrowRight: () => <span>ArrowRight</span>,
  History: () => <span>History</span>,
}));

describe('CommandPalette', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({
      push: mockPush,
    });
    
    // Clear localStorage
    localStorage.clear();
  });

  it('renders search button correctly', () => {
    render(<CommandPalette />);
    expect(screen.getByText('Execute_Command...')).toBeInTheDocument();
  });

  it('opens the palette when button is clicked', () => {
    render(<CommandPalette />);
    fireEvent.click(screen.getByText('Execute_Command...'));
    expect(screen.getByPlaceholderText(/SYSOP@FINTRACK/i)).toBeInTheDocument();
  });

  it('opens the palette when Ctrl+K is pressed', () => {
    render(<CommandPalette />);
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(screen.getByPlaceholderText(/SYSOP@FINTRACK/i)).toBeInTheDocument();
  });

  it('performs search after typing enough characters', async () => {
    (authFetch as any).mockResolvedValue({ ok: true });
    (parseApiResponse as any).mockResolvedValueOnce({ content: [{ id: '1', title: 'Test Tx', date: '2026-03-23' }] }) // transactions
                             .mockResolvedValueOnce([{ id: '1', label: 'Food' }]) // categories
                             .mockResolvedValueOnce([]); // investments

    render(<CommandPalette />);
    fireEvent.click(screen.getByText('Execute_Command...'));
    
    const input = screen.getByPlaceholderText(/SYSOP@FINTRACK/i);
    fireEvent.change(input, { target: { value: 'test' } });

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalled();
      expect(screen.getByText('Test Tx')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('navigates when an item is selected and saves to recent', async () => {
    render(<CommandPalette />);
    fireEvent.click(screen.getByText('Execute_Command...'));
    
    const dashboardLink = screen.getByText('Dashboard');
    fireEvent.click(dashboardLink);

    expect(mockPush).toHaveBeenCalledWith('/');
    
    // Check if saved to recent
    const saved = JSON.parse(localStorage.getItem('fintrack_recent_commands') || '[]');
    expect(saved[0].label).toBe('Dashboard');
  });

  it('shows recent commands from localStorage', () => {
    localStorage.setItem('fintrack_recent_commands', JSON.stringify([{ label: 'Reports', href: '/reports', icon: 'PieChart' }]));
    
    render(<CommandPalette />);
    fireEvent.click(screen.getByText('Execute_Command...'));
    
    expect(screen.getByText('Recent_Buffer')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });
});
