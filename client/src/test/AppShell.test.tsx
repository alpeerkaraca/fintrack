import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AppShell from '@/components/layout/AppShell';
import { authFetch, signOut } from '@/lib/auth';
import { parseApiResponse } from '@/lib/api';
import { usePathname, useRouter } from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock lib/auth
vi.mock('@/lib/auth', () => ({
  authFetch: vi.fn(),
  signOut: vi.fn(),
}));

// Mock lib/api
vi.mock('@/lib/api', () => ({
  parseApiResponse: vi.fn(),
}));

// Mock lib/fintrack
vi.mock('@/lib/fintrack', () => ({
  USD_TRY_RATE: 30.0,
  API: {
    marketData: {
      usdTry: () => '/api/v1/market-data/usd-try',
    },
  },
}));

// Mock CommandPalette
vi.mock('./CommandPalette', () => ({
  CommandPalette: () => <div>CommandPalette</div>,
}));

describe('AppShell', () => {
  const mockPush = vi.fn();
  const mockReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
    (usePathname as any).mockReturnValue('/');
    (authFetch as any).mockResolvedValue({ ok: true });
    (parseApiResponse as any).mockResolvedValue({ usdTry: 31.5 });
  });

  it('renders children correctly', async () => {
    render(
      <AppShell>
        <div data-testid="child">Child Content</div>
      </AppShell>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders navigation items', async () => {
    render(<AppShell>Content</AppShell>);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Budget Entry')).toBeInTheDocument();
    expect(screen.getByText('Investments')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('highlights the active navigation item', async () => {
    (usePathname as any).mockReturnValue('/budget');
    render(<AppShell>Content</AppShell>);

    const budgetLink = screen.getByRole('link', { name: /Budget Entry/i });
    expect(budgetLink).toHaveClass('bg-black text-white');
  });

  it('loads and displays the USD rate', async () => {
    render(<AppShell>Content</AppShell>);

    await waitFor(() => {
      expect(screen.getByText('31.5000')).toBeInTheDocument();
    });
  });

  it('handles sign out correctly', async () => {
    render(<AppShell>Content</AppShell>);

    const signOutBtn = screen.getByRole('button', { name: /Terminate Session/i });
    fireEvent.click(signOutBtn);

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  it('renders only children on auth pages', () => {
    (usePathname as any).mockReturnValue('/login');
    render(
      <AppShell>
        <div data-testid="login-content">Login Page</div>
      </AppShell>
    );

    expect(screen.getByTestId('login-content')).toBeInTheDocument();
    expect(screen.queryByText('FinTrack')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });
});
