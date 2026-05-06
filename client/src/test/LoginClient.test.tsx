import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginClient from '@/components/auth/LoginClient';
import { login } from '@/lib/auth';
import { useRouter } from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock @/lib/auth
vi.mock('@/lib/auth', () => ({
  login: vi.fn(),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('LoginClient', () => {
  const mockPush = vi.fn();
  const mockReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
  });

  it('renders login form correctly', () => {
    render(<LoginClient />);
    
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByLabelText(/Username_/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password_/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Execute_Login/i })).toBeInTheDocument();
  });

  it('shows error if username or password is empty', async () => {
    render(<LoginClient />);
    
    const submitButton = screen.getByRole('button', { name: /Execute_Login/i });
    fireEvent.click(submitButton);

    // Use a very broad matcher to see if anything appears
    const errorElement = await screen.findByText(/REQUIRED/i);
    expect(errorElement).toBeInTheDocument();
  });

  it('calls login function and redirects on success', async () => {
    (login as any).mockResolvedValueOnce({ id: '1', username: 'testuser' });
    
    render(<LoginClient />);
    
    fireEvent.change(screen.getByLabelText(/Username_/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Password_/i), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Execute_Login/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({ username: 'testuser', password: 'password123' });
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('shows error message on login failure', async () => {
    (login as any).mockRejectedValueOnce(new Error('Invalid credentials'));
    
    render(<LoginClient />);
    
    fireEvent.change(screen.getByLabelText(/Username_/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Password_/i), { target: { value: 'wrongpassword' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Execute_Login/i }));

    await waitFor(() => {
      expect(screen.getByText(/ERROR: INVALID CREDENTIALS/i)).toBeInTheDocument();
    });
  });

  it('verifies brutalist aesthetic elements', () => {
    const { container } = render(<LoginClient />);
    
    // Check for rounded-none and border-2
    const loginBox = container.querySelector('.rounded-none.border-2');
    expect(loginBox).toBeInTheDocument();
    
    // Check for font-mono on the main container
    expect(container.firstChild).toHaveClass('font-mono');
  });
});
