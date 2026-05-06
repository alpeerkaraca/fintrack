import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RegisterClient from '@/components/auth/RegisterClient';
import { register, isValidEmail, isValidPassword } from '@/lib/auth';
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
  register: vi.fn(),
  isValidEmail: vi.fn(),
  isValidPassword: vi.fn(),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('RegisterClient', () => {
  const mockReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({
      replace: mockReplace,
    });
    // Default validation behavior
    (isValidEmail as any).mockImplementation((email: string) => email.includes('@'));
    (isValidPassword as any).mockImplementation((pw: string) => pw.length >= 8);
  });

  it('renders register form correctly', () => {
    render(<RegisterClient />);
    
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.getByLabelText(/Username_/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email_/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password_/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Net_Salary_USD_/i)).toBeInTheDocument();
  });

  it('updates password checklist as user types', () => {
    render(<RegisterClient />);
    
    const passwordInput = screen.getByLabelText(/Password_/i);
    
    // Initially all unchecked (or text-slate-400)
    expect(screen.getByText(/\[ \] 8\+ CHARACTERS/i)).toHaveClass('text-slate-400');
    
    fireEvent.change(passwordInput, { target: { value: 'Pass123!' } });
    
    expect(screen.getByText(/\[X\] 8\+ CHARACTERS/i)).toHaveClass('text-green-600');
    expect(screen.getByText(/\[X\] UPPERCASE/i)).toHaveClass('text-green-600');
    expect(screen.getByText(/\[X\] NUMBER/i)).toHaveClass('text-green-600');
    expect(screen.getByText(/\[X\] SYMBOL/i)).toHaveClass('text-green-600');
  });

  it('shows error if email is invalid', async () => {
    (isValidEmail as any).mockReturnValue(false);
    render(<RegisterClient />);
    
    fireEvent.change(screen.getByLabelText(/Username_/i), { target: { value: 'user1' } });
    fireEvent.change(screen.getByLabelText(/Email_/i), { target: { value: 'invalid-email' } });
    fireEvent.change(screen.getByLabelText(/Password_/i), { target: { value: 'Pass123!' } });
    fireEvent.change(screen.getByLabelText(/Net_Salary_USD_/i), { target: { value: '5000' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Register_User/i }));

    // findByText is already async and handles most cases well
    const errorElement = await screen.findByText(/INVALID_EMAIL_FORMAT/);
    expect(errorElement).toBeInTheDocument();
  });

  it('calls register and redirects on success', async () => {
    (isValidEmail as any).mockReturnValue(true);
    (isValidPassword as any).mockReturnValue(true);
    (register as any).mockResolvedValueOnce({ id: '1' });
    
    render(<RegisterClient />);
    
    fireEvent.change(screen.getByLabelText(/Username_/i), { target: { value: 'user1' } });
    fireEvent.change(screen.getByLabelText(/Email_/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password_/i), { target: { value: 'Pass123!' } });
    fireEvent.change(screen.getByLabelText(/Net_Salary_USD_/i), { target: { value: '5000' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Register_User/i }));

    await waitFor(() => {
      expect(register).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('verifies brutalist aesthetic elements', () => {
    const { container } = render(<RegisterClient />);
    expect(container.firstChild).toHaveClass('font-mono');
    const registerBox = container.querySelector('.rounded-none.border-2');
    expect(registerBox).toBeInTheDocument();
    expect(registerBox).toHaveClass('shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]');
  });
});
