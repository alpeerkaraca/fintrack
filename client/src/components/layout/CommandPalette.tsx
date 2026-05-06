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
  ArrowUpRight,
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
    { label: "Investments", icon: ArrowUpRight, href: "/investment", iconName: "ArrowUpRight" },
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
      LayoutGrid, Wallet, ArrowUpRight, PieChart, CreditCard, Tag, Search
    };
    return icons[name] || Search;
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group relative flex w-full items-center gap-3 px-4 py-3 rounded-none text-sm font-mono font-bold text-slate-900 border-2 border-slate-900 bg-white hover:bg-yellow-300 transition-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
      >
        <Search className="h-4 w-4 stroke-[2.5px]" />
        <span className="flex-1 text-left uppercase tracking-tighter">Execute_Command...</span>
        <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded-none border-2 border-slate-900 bg-black px-1.5 font-mono text-[10px] font-bold text-white">
          <span className="text-xs">^</span>K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-none transition-none animate-in fade-in duration-0">
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4">
            <Command
              className="relative w-full max-w-xl overflow-hidden rounded-none border-4 border-slate-900 bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-top-4 duration-200"
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
              }}
            >
              <div className="flex items-center border-b-4 border-slate-900 px-4 py-4 bg-slate-50">
                <Search className="mr-3 h-6 w-6 shrink-0 text-slate-900 stroke-[3px]" />
                <Command.Input
                  autoFocus
                  placeholder="SYSOP@FINTRACK:~$ SEARCH_TARGET"
                  className="flex h-12 w-full rounded-none bg-transparent py-3 text-lg font-mono font-bold uppercase tracking-tight outline-none placeholder:text-slate-400"
                  value={search}
                  onValueChange={setSearch}
                />
                {search && (
                  <button 
                    onClick={() => setSearch("")}
                    className="p-2 hover:bg-red-500 hover:text-white rounded-none border-2 border-slate-900 transition-none"
                  >
                    <Plus className="h-5 w-5 rotate-45 stroke-[3px]" />
                  </button>
                )}
                <div className="ml-4 flex items-center gap-1">
                  <kbd className="pointer-events-none inline-flex h-7 select-none items-center gap-1 rounded-none border-2 border-slate-900 bg-black px-2 font-mono text-[10px] font-bold text-white">
                    ESC
                  </kbd>
                </div>
              </div>

              <Command.List className="max-h-[450px] overflow-y-auto p-0 scrollbar-none">
                <Command.Empty className="py-16 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 rounded-none border-4 border-slate-900 bg-red-100 text-red-600">
                      <Search className="h-10 w-10 stroke-[3px]" />
                    </div>
                    <p className="text-sm font-mono font-black uppercase tracking-widest text-slate-900">Error: No_Results_Found</p>
                    <p className="text-xs font-mono text-slate-500">Query &quot;{search}&quot; returned 0 bytes</p>
                  </div>
                </Command.Empty>

                {!search && recentCommands.length > 0 && (
                  <>
                    <Command.Group
                      heading={
                        <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-slate-900 bg-slate-100">
                          <History className="h-4 w-4 stroke-[2.5px]" />
                          <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-slate-900">Recent_Buffer</span>
                        </div>
                      }
                    >
                      {recentCommands.map((cmd) => {
                        const Icon = getIconComponent(cmd.icon);
                        return (
                          <Command.Item
                            key={cmd.href}
                            onSelect={() => runCommand(() => router.push(cmd.href))}
                            className="flex cursor-pointer items-center gap-4 px-6 py-4 text-sm font-mono font-bold uppercase border-b-2 border-slate-900 aria-selected:bg-black aria-selected:text-white transition-none"
                          >
                            <Icon className="h-5 w-5 stroke-[2.5px]" />
                            <span>{cmd.label}</span>
                          </Command.Item>
                        );
                      })}
                    </Command.Group>
                  </>
                )}

                <Command.Group
                  heading={
                    <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-slate-900 bg-slate-100">
                      <ArrowRight className="h-4 w-4 stroke-[2.5px]" />
                      <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-slate-900">System_Links</span>
                    </div>
                  }
                >
                  {navItems.map((item) => (
                    <Command.Item
                      key={item.href}
                      onSelect={() => runCommand(() => router.push(item.href), item.label, item.href, item.iconName)}
                      className="flex cursor-pointer items-center gap-4 px-6 py-4 text-sm font-mono font-bold uppercase border-b-2 border-slate-900 aria-selected:bg-black aria-selected:text-white transition-none"
                    >
                      <item.icon className="h-5 w-5 stroke-[2.5px]" />
                      <span className="flex-1">{item.label}</span>
                      <kbd className="hidden sm:inline-flex opacity-0 group-aria-selected:opacity-100 transition-none pointer-events-none h-6 select-none items-center gap-1 rounded-none border-2 border-white bg-black px-1.5 font-mono text-[10px] font-bold text-white uppercase">
                        Enter
                      </kbd>
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Group
                  heading={
                    <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-slate-900 bg-slate-100">
                      <Plus className="h-4 w-4 stroke-[2.5px]" />
                      <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-slate-900">Quick_Access_Layer</span>
                    </div>
                  }
                >
                  <Command.Item
                    onSelect={() => runCommand(() => router.push("/budget?action=new"))}
                    className="flex cursor-pointer items-center gap-4 px-6 py-4 text-sm font-mono font-bold uppercase border-b-2 border-slate-900 aria-selected:bg-black aria-selected:text-white transition-none"
                  >
                    <Calculator className="h-5 w-5 stroke-[2.5px]" />
                    <span>Post_New_Transaction</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => router.push("/investment"))}
                    className="flex cursor-pointer items-center gap-4 px-6 py-4 text-sm font-mono font-bold uppercase border-b-2 border-slate-900 aria-selected:bg-black aria-selected:text-white transition-none"
                  >
                    <Plus className="h-5 w-5 stroke-[2.5px]" />
                    <span>Initialize_New_Asset</span>
                  </Command.Item>
                </Command.Group>

                {results.categories.length > 0 && (
                  <Command.Group
                    heading={
                      <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-slate-900 bg-slate-100">
                        <Tag className="h-4 w-4 stroke-[2.5px]" />
                        <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-slate-900">Index_Categories</span>
                      </div>
                    }
                  >
                    {results.categories.map((cat) => (
                      <Command.Item
                        key={cat.id}
                        onSelect={() => runCommand(() => router.push(`/budget?category=${cat.id}`))}
                        className="flex cursor-pointer items-center gap-4 px-6 py-4 text-sm font-mono font-bold uppercase border-b-2 border-slate-900 aria-selected:bg-black aria-selected:text-white transition-none"
                      >
                        <Tag className="h-5 w-5 stroke-[2.5px]" />
                        <span>{cat.label}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {results.investments.length > 0 && (
                  <Command.Group
                    heading={
                      <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-slate-900 bg-slate-100">
                        <ArrowUpRight className="h-4 w-4 stroke-[2.5px]" />
                        <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-slate-900">Active_Instruments</span>
                      </div>
                    }
                  >
                    {results.investments.map((inv) => (
                      <Command.Item
                        key={inv.symbol}
                        onSelect={() => runCommand(() => router.push(`/investment`))}
                        className="flex cursor-pointer items-center justify-between px-6 py-4 border-b-2 border-slate-900 aria-selected:bg-black aria-selected:text-white transition-none"
                      >
                        <div className="flex items-center gap-4">
                          <ArrowUpRight className="h-5 w-5 stroke-[2.5px]" />
                          <span className="text-sm font-mono font-bold uppercase">{inv.symbol} // {inv.name}</span>
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {results.transactions.length > 0 && (
                  <Command.Group
                    heading={
                      <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-slate-900 bg-slate-100">
                        <CreditCard className="h-4 w-4 stroke-[2.5px]" />
                        <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-slate-900">Transaction_Log</span>
                      </div>
                    }
                  >
                    {results.transactions.map((tx) => (
                      <Command.Item
                        key={tx.id}
                        onSelect={() => runCommand(() => router.push(`/budget?id=${tx.id}`))}
                        className="flex cursor-pointer items-center justify-between px-6 py-4 border-b-2 border-slate-900 aria-selected:bg-black aria-selected:text-white transition-none"
                      >
                        <div className="flex items-center gap-4">
                          <CreditCard className="h-5 w-5 stroke-[2.5px]" />
                          <span className="text-sm font-mono font-bold uppercase">{tx.title}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold opacity-70">
                          {new Date(tx.date).toLocaleDateString()}
                        </span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {loading && (
                  <div className="flex items-center justify-center py-10 bg-slate-50">
                    <div className="h-8 w-8 animate-spin rounded-none border-4 border-black border-t-yellow-300" />
                    <span className="ml-4 font-mono font-black text-xs uppercase animate-pulse">Processing_Request...</span>
                  </div>
                )}
              </Command.List>

              <div className="border-t-4 border-slate-900 p-4 bg-black flex items-center justify-between text-[10px] text-white font-mono font-black uppercase tracking-widest">
                <div className="flex gap-6">
                  <span className="flex items-center gap-2"><kbd className="border-2 border-white bg-slate-800 px-1 font-bold">↑↓</kbd> NAVIGATE</span>
                  <span className="flex items-center gap-2"><kbd className="border-2 border-white bg-slate-800 px-1 font-bold">↵</kbd> SELECT</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-300">FINTRACK_CORE_V1.0</span>
                </div>
              </div>
            </Command>
          </div>
        </div>
      )}
    </>
  );
}
