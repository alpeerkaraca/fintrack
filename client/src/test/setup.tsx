import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extends Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Mock ResizeObserver for cmdk and other components
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// Mock lucide-react globally as many components use it
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Search: () => <span>Search</span>,
    X: () => <span>X</span>,
    Plus: () => <span>Plus</span>,
    ArrowLeft: () => <span>ArrowLeft</span>,
    ArrowRight: () => <span>ArrowRight</span>,
    ArrowUpRight: () => <span>ArrowUpRight</span>,
    ArrowDownRight: () => <span>ArrowDownRight</span>,
    LayoutGrid: () => <span>LayoutGrid</span>,
    Wallet: () => <span>Wallet</span>,
    TrendingUp: () => <span>TrendingUp</span>,
    PieChart: () => <span>PieChart</span>,
    LogOut: () => <span>LogOut</span>,
    BadgeDollarSign: () => <span>BadgeDollarSign</span>,
    Calculator: () => <span>Calculator</span>,
    CreditCard: () => <span>CreditCard</span>,
    Tag: () => <span>Tag</span>,
    History: () => <span>History</span>,
    Calendar: () => <span>Calendar</span>,
    DollarSign: () => <span>DollarSign</span>,
    FileText: () => <span>FileText</span>,
    Filter: () => <span>Filter</span>,
    Trash2: () => <span>Trash2</span>,
    TrendingDown: () => <span>TrendingDown</span>,
    Coins: () => <span>Coins</span>,
    Edit2: () => <span>Edit2</span>,
    Lock: () => <span>Lock</span>,
  };
});
