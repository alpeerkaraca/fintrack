import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BudgetEntryClient from '@/components/budget/BudgetEntryClient';
import { authFetch } from '@/lib/auth';
import { parseApiResponse } from '@/lib/api';
import { useSearchParams } from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
}));

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

const mockTransactions = [
  { id: '1', title: 'Salary', amountTry: 5000, date: '2026-03-01', category: 'OTHER', type: 'income' },
  { id: '2', title: 'Rent', amountTry: 2000, date: '2026-03-02', category: 'Housing', type: 'expense' },
];

const mockCategories = [
  { id: 'Housing', label: 'Housing' },
  { id: 'Food', label: 'Food' },
];

const mockMonthOptions = [
  { value: '2026-03', label: 'Mar 2026' },
];

describe('BudgetEntryClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSearchParams as any).mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    });
    
    (authFetch as any).mockResolvedValue({ ok: true });
    
    // Default mock responses
    (parseApiResponse as any).mockImplementation((response: any) => {
        // We will override this in specific tests if needed
    });
  });

  it('renders budget entry page correctly', async () => {
    (parseApiResponse as any)
      .mockResolvedValueOnce(mockMonthOptions) // available-months
      .mockResolvedValueOnce({ content: mockTransactions }) // transactions
      .mockResolvedValueOnce(mockCategories); // categories

    render(<BudgetEntryClient />);

    await waitFor(() => {
      expect(screen.getByText('Budget Entry')).toBeInTheDocument();
      expect(screen.getByText('Salary')).toBeInTheDocument();
      expect(screen.getByText('Rent')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Income')).toBeInTheDocument();
    expect(screen.getByText('Total Expenses')).toBeInTheDocument();
  });

  it('opens and closes the add entry form', async () => {
    (parseApiResponse as any)
      .mockResolvedValueOnce(mockMonthOptions)
      .mockResolvedValueOnce({ content: [] })
      .mockResolvedValueOnce(mockCategories);

    render(<BudgetEntryClient />);

    const addButton = screen.getByRole('button', { name: /Add Entry/i });
    fireEvent.click(addButton);

    expect(screen.getByText('// Add New Transaction')).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('// Add New Transaction')).not.toBeInTheDocument();
    });
  });

  it('submits a new transaction successfully', async () => {
    (parseApiResponse as any)
      .mockResolvedValueOnce(mockMonthOptions)
      .mockResolvedValueOnce({ content: [] })
      .mockResolvedValueOnce(mockCategories);

    render(<BudgetEntryClient />);

    fireEvent.click(screen.getByRole('button', { name: /Add Entry/i }));

    fireEvent.change(screen.getByLabelText(/Transaction Title/i), { target: { value: 'New Test' } });
    fireEvent.change(screen.getByLabelText(/Amount \(TRY\)/i), { target: { value: '100' } });
    
    // Submit
    (parseApiResponse as any).mockResolvedValueOnce({ id: '3', title: 'New Test', amountTry: 100 }); // POST response
    (parseApiResponse as any).mockResolvedValueOnce({ content: [...mockTransactions, { id: '3', title: 'New Test', amountTry: 100 }] }); // Reload

    fireEvent.click(screen.getByRole('button', { name: /Confirm Transaction/i }));

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith('/api/v1/transactions', expect.objectContaining({ method: 'POST' }));
    });
  });

  it('handles bulk delete', async () => {
    (parseApiResponse as any)
      .mockResolvedValueOnce(mockMonthOptions)
      .mockResolvedValueOnce({ content: mockTransactions })
      .mockResolvedValueOnce(mockCategories);

    render(<BudgetEntryClient />);

    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument();
    });

    // Find checkboxes
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // Select first transaction (index 0 is Select All, but there are multiple checkboxes in table)
    // Actually, based on the component, there is a select all in the header.
    
    // Select the first row's checkbox
    const firstRowCheckbox = screen.getAllByRole('checkbox')[1]; 
    fireEvent.click(firstRowCheckbox);

    const deleteButton = screen.getByText((content) => content.includes('Delete Selected'));
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith('/api/v1/transactions/bulk', expect.objectContaining({ method: 'DELETE' }));
    });
  });

  it('verifies brutalist styling', () => {
    const { container } = render(<BudgetEntryClient />);
    const mainTitle = container.querySelector('h1.italic.font-black');
    expect(mainTitle).toBeInTheDocument();
    expect(mainTitle).toHaveClass('uppercase');
  });
});
