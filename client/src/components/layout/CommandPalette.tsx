"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Calculator,
  CreditCard,
  LayoutGrid,
  PieChart,
  Plus,
  Search,
  TrendingUp,
  Wallet,
  Tag,
  ArrowRight,
  History,
  LucideIcon,
} from "lucide-react";
import { Command } from "cmdk";

import { authFetch } from "@/lib/auth";
import { parseApiResponse } from "@/lib/api";
import { Transaction, API, CategoryMeta, InvestmentAsset } from "@/lib/fintrack";

interface PageDto<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [results, setResults] = React.useState<{
    transactions: Transaction[];
    categories: CategoryMeta[];
    investments: InvestmentAsset[];
  }>({
    transactions: [],
    categories: [],
    investments: [],
  });
  const [loading, setLoading] = React.useState(false);
  const [recentCommands, setRecentCommands] = React.useState<{ label: string; href: string; icon: string }[]>([]);
  const router = useRouter();

  // Load recent commands from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem("fintrack_recent_commands");
    if (saved) {
      try {
        setRecentCommands(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse recent commands", e);
      }
    }
  }, []);

  const saveRecentCommand = React.useCallback((label: string, href: string, iconName: string) => {
    setRecentCommands((prev) => {
      const filtered = prev.filter((cmd) => cmd.href !== href);
      const updated = [{ label, href, icon: iconName }, ...filtered].slice(0, 3);
      localStorage.setItem("fintrack_recent_commands", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Toggle the menu when ⌘K is pressed
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => void, label?: string, href?: string, iconName?: string) => {
    setOpen(false);
    if (label && href && iconName) {
      saveRecentCommand(label, href, iconName);
    }
    command();
    setSearch("");
  }, [saveRecentCommand]);

  const navItems = React.useMemo(() => [
    { label: "Dashboard", icon: LayoutGrid, href: "/", iconName: "LayoutGrid" },
    { label: "Budget Entry", icon: Wallet, href: "/budget", iconName: "Wallet" },
    { label: "Investments", icon: TrendingUp, href: "/investment", iconName: "TrendingUp" },
    { label: "Reports", icon: PieChart, href: "/reports", iconName: "PieChart" },
  ], []);

  React.useEffect(() => {
    if (search.length < 2) {
      setResults({ transactions: [], categories: [], investments: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // Parallel fetching for better performance
        const [txRes, catRes, invRes] = await Promise.all([
          authFetch(API.transactions.list(search, 5)),
          authFetch(`/api/v1/metadata/categories`),
          authFetch(`/api/v1/investments`),
        ]);

        const [txData, catData, invData] = await Promise.all([
          parseApiResponse<PageDto<Transaction>>(txRes),
          parseApiResponse<CategoryMeta[]>(catRes),
          parseApiResponse<InvestmentAsset[]>(invRes),
        ]);

        // Filter local results for categories and investments since they don't have dedicated search endpoints yet
        const filteredCats = (catData ?? []).filter(c => 
          c.label.toLowerCase().includes(search.toLowerCase())
        ).slice(0, 3);

        const filteredInvs = (invData ?? []).filter(i => 
          i.symbol.toLowerCase().includes(search.toLowerCase()) || 
          i.name.toLowerCase().includes(search.toLowerCase())
        ).slice(0, 3);

        setResults({
          transactions: txData.content ?? [],
          categories: filteredCats,
          investments: filteredInvs,
        });
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const getIconComponent = (name: string): LucideIcon => {
    const icons: Record<string, LucideIcon> = {
      LayoutGrid, Wallet, TrendingUp, PieChart, CreditCard, Tag, Search
    };
    return icons[name] || Search;
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group relative flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted-foreground border border-border bg-muted/20 hover:bg-muted/40 hover:text-foreground transition-all duration-200"
      >
        <Search className="h-4 w-4 transition-transform group-hover:scale-110" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-background/40 backdrop-blur-md transition-all animate-in fade-in duration-300">
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4">
            <Command
              className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] animate-in slide-in-from-top-4 duration-300"
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
              }}
            >
              <div className="flex items-center border-b border-border px-4 py-4">
                <Search className="mr-3 h-5 w-5 shrink-0 text-primary" />
                <Command.Input
                  autoFocus
                  placeholder="Search transactions, categories, or navigation..."
                  className="flex h-10 w-full rounded-md bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground"
                  value={search}
                  onValueChange={setSearch}
                />
                {search && (
                  <button 
                    onClick={() => setSearch("")}
                    className="p-1 hover:bg-muted rounded-full text-muted-foreground transition-colors"
                  >
                    <Plus className="h-4 w-4 rotate-45" />
                  </button>
                )}
                <div className="ml-4 flex items-center gap-1">
                  <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border border-border bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground">
                    ESC
                  </kbd>
                </div>
              </div>

              <Command.List className="max-h-[450px] overflow-y-auto p-3 scrollbar-none">
                <Command.Empty className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 rounded-full bg-muted/50 text-muted-foreground">
                      <Search className="h-6 w-6" />
                    </div>
                    <p className="text-sm text-muted-foreground">No results found for &quot;{search}&quot;</p>
                  </div>
                </Command.Empty>

                {!search && recentCommands.length > 0 && (
                  <>
                    <Command.Group
                      heading={
                        <div className="flex items-center gap-2 px-2 py-2">
                          <History className="h-3 w-3" />
                          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Recent</span>
                        </div>
                      }
                    >
                      {recentCommands.map((cmd) => {
                        const Icon = getIconComponent(cmd.icon);
                        return (
                          <Command.Item
                            key={cmd.href}
                            onSelect={() => runCommand(() => router.push(cmd.href))}
                            className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm text-foreground hover:bg-primary/10 aria-selected:bg-primary/10 aria-selected:text-primary transition-all"
                          >
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span>{cmd.label}</span>
                          </Command.Item>
                        );
                      })}
                    </Command.Group>
                    <Command.Separator className="my-2 h-px bg-border/50" />
                  </>
                )}

                <Command.Group
                  heading={
                    <div className="flex items-center gap-2 px-2 py-2">
                      <ArrowRight className="h-3 w-3" />
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Navigation</span>
                    </div>
                  }
                >
                  {navItems.map((item) => (
                    <Command.Item
                      key={item.href}
                      onSelect={() => runCommand(() => router.push(item.href), item.label, item.href, item.iconName)}
                      className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm text-foreground hover:bg-primary/10 aria-selected:bg-primary/10 aria-selected:text-primary transition-all group"
                    >
                      <item.icon className="h-4 w-4 text-muted-foreground group-aria-selected:text-primary transition-colors" />
                      <span className="flex-1">{item.label}</span>
                      <kbd className="hidden sm:inline-flex opacity-0 group-aria-selected:opacity-100 transition-opacity pointer-events-none h-5 select-none items-center gap-1 rounded bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                        ENTER
                      </kbd>
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Separator className="my-2 h-px bg-border/50" />

                <Command.Group
                  heading={
                    <div className="flex items-center gap-2 px-2 py-2">
                      <Plus className="h-3 w-3" />
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Quick Actions</span>
                    </div>
                  }
                >
                  <Command.Item
                    onSelect={() => runCommand(() => router.push("/budget?action=new"))}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm text-foreground hover:bg-primary/10 aria-selected:bg-primary/10 aria-selected:text-primary transition-all"
                  >
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                    <span>Add New Transaction</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => router.push("/investment"))}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm text-foreground hover:bg-primary/10 aria-selected:bg-primary/10 aria-selected:text-primary transition-all"
                  >
                    <Plus className="h-4 w-4 text-muted-foreground" />
                    <span>Add New Investment</span>
                  </Command.Item>
                </Command.Group>

                {results.categories.length > 0 && (
                  <>
                    <Command.Separator className="my-2 h-px bg-border/50" />
                    <Command.Group
                      heading={
                        <div className="flex items-center gap-2 px-2 py-2">
                          <Tag className="h-3 w-3" />
                          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Categories</span>
                        </div>
                      }
                    >
                      {results.categories.map((cat) => (
                        <Command.Item
                          key={cat.id}
                          onSelect={() => runCommand(() => router.push(`/budget?category=${cat.id}`))}
                          className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm text-foreground hover:bg-primary/10 aria-selected:bg-primary/10 aria-selected:text-primary transition-all"
                        >
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <span>{cat.label}</span>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  </>
                )}

                {results.investments.length > 0 && (
                  <>
                    <Command.Separator className="my-2 h-px bg-border/50" />
                    <Command.Group
                      heading={
                        <div className="flex items-center gap-2 px-2 py-2">
                          <TrendingUp className="h-3 w-3" />
                          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Investments</span>
                        </div>
                      }
                    >
                      {results.investments.map((inv) => (
                        <Command.Item
                          key={inv.symbol}
                          onSelect={() => runCommand(() => router.push(`/investment`))}
                          className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-sm text-foreground hover:bg-primary/10 aria-selected:bg-primary/10 aria-selected:text-primary transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span>{inv.symbol} - {inv.name}</span>
                          </div>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  </>
                )}

                {results.transactions.length > 0 && (
                  <>
                    <Command.Separator className="my-2 h-px bg-border/50" />
                    <Command.Group
                      heading={
                        <div className="flex items-center gap-2 px-2 py-2">
                          <CreditCard className="h-3 w-3" />
                          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Transactions</span>
                        </div>
                      }
                    >
                      {results.transactions.map((tx) => (
                        <Command.Item
                          key={tx.id}
                          onSelect={() => runCommand(() => router.push(`/budget?id=${tx.id}`))}
                          className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-sm text-foreground hover:bg-primary/10 aria-selected:bg-primary/10 aria-selected:text-primary transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span>{tx.title}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(tx.date).toLocaleDateString()}
                          </span>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  </>
                )}

                {loading && (
                  <div className="flex items-center justify-center py-6">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                )}
              </Command.List>

              <div className="border-t border-border p-3 bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                <div className="flex gap-4">
                  <span className="flex items-center gap-1"><kbd className="border bg-background px-1 rounded">↑↓</kbd> Navigate</span>
                  <span className="flex items-center gap-1"><kbd className="border bg-background px-1 rounded">↵</kbd> Select</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>FinTrack Command Palette</span>
                </div>
              </div>
            </Command>
          </div>
        </div>
      )}
    </>
  );
}
