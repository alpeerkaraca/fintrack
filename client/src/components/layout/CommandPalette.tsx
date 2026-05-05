"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Calculator,
  Calendar,
  CreditCard,
  LayoutGrid,
  PieChart,
  Search,
  Settings,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import { Command } from "cmdk";

import { authFetch } from "@/lib/auth";
import { parseApiResponse } from "@/lib/api";
import { Transaction, API } from "@/lib/fintrack";
import { cn } from "@/lib/utils";

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
  const [results, setResults] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

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

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  React.useEffect(() => {
    if (search.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await authFetch(API.transactions.list(search, 5));
        const data = await parseApiResponse<PageDto<Transaction>>(response);
        setResults(data.content);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground border border-border rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all animate-in fade-in duration-200">
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[20vh]">
            <Command
              className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200"
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
              }}
            >
              <div className="flex items-center border-b border-border px-4 py-3">
                <Search className="mr-3 h-5 w-5 shrink-0 text-muted-foreground" />
                <Command.Input
                  autoFocus
                  placeholder="Search everything..."
                  className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  value={search}
                  onValueChange={setSearch}
                />
                <button
                  onClick={() => setOpen(false)}
                  className="ml-2 rounded-md p-1 hover:bg-muted text-muted-foreground"
                >
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    ESC
                  </kbd>
                </button>
              </div>

              <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-muted">
                <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                  No results found.
                </Command.Empty>

                <Command.Group
                  heading="Navigation"
                  className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  <Command.Item
                    onSelect={() => runCommand(() => router.push("/"))}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors aria-selected:bg-primary/10 aria-selected:text-primary"
                  >
                    <LayoutGrid className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => router.push("/budget"))}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors aria-selected:bg-primary/10 aria-selected:text-primary"
                  >
                    <Wallet className="h-4 w-4" />
                    <span>Budget Entry</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => router.push("/investment"))}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors aria-selected:bg-primary/10 aria-selected:text-primary"
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Investments</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => router.push("/reports"))}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors aria-selected:bg-primary/10 aria-selected:text-primary"
                  >
                    <PieChart className="h-4 w-4" />
                    <span>Reports</span>
                  </Command.Item>
                </Command.Group>

                {results.length > 0 && (
                  <Command.Group
                    heading="Transactions"
                    className="mt-2 px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    {results.map((tx) => (
                      <Command.Item
                        key={tx.id}
                        onSelect={() => runCommand(() => router.push(`/budget?id=${tx.id}`))}
                        className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors aria-selected:bg-primary/10 aria-selected:text-primary"
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-4 w-4" />
                          <span>{tx.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString()}
                        </span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {loading && (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                )}
              </Command.List>
            </Command>
          </div>
        </div>
      )}
    </>
  );
}
