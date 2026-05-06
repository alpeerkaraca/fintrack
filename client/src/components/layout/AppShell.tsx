"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeDollarSign,
  LogOut,
  LayoutGrid,
  PieChart,
  ArrowUpRight,
  Wallet,
} from "lucide-react";

import { USD_TRY_RATE, API } from "@/lib/fintrack";
import { cn } from "@/lib/utils";
import { authFetch, signOut } from "@/lib/auth";
import { parseApiResponse } from "@/lib/api";
import { CommandPalette } from "./CommandPalette";
import { ThemeToggle } from "../ui/ThemeToggle";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutGrid, href: "/" },
  { label: "Budget Entry", icon: Wallet, href: "/budget" },
  { label: "Investments", icon: ArrowUpRight, href: "/investment" },
  { label: "Reports", icon: PieChart, href: "/reports" },
];

const isActivePath = (pathname: string, href: string) => {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname.startsWith(href);
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const [usdRate, setUsdRate] = useState<number | null>(null);
  const [isRateLoading, setIsRateLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadRate = async () => {
      setIsRateLoading(true);
      try {
        const response = await authFetch(API.marketData.usdTry());
        const payload = await parseApiResponse<{ usdTry: number }>(response);
        const rate = payload?.usdTry;
        if (isActive) {
          setUsdRate(typeof rate === "number" ? rate : USD_TRY_RATE);
        }
      } catch {
        if (isActive) {
          setUsdRate(USD_TRY_RATE);
        }
      } finally {
        if (isActive) {
          setIsRateLoading(false);
        }
      }
    };

    loadRate();
    return () => {
      isActive = false;
    };
  }, []);

  if (isAuthPage) {
    return <main className="min-h-screen bg-background text-foreground">{children}</main>;
  }

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-yellow-300 transition-colors duration-300">
      <div className="flex flex-col lg:flex-row">
        <aside className="flex h-full w-full flex-col border-b-2 border-slate-900 dark:border-white bg-background lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:border-b-0 lg:border-r-2">
          <div className="px-6 py-8 flex items-center justify-between border-b-2 border-slate-900 dark:border-white">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-none border-2 border-slate-900 dark:border-white bg-foreground text-background grid place-items-center font-mono font-bold text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
                FT
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">System.Finance</p>
                <h1 className="text-xl font-black uppercase tracking-tighter">FinTrack</h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <div className="px-6 py-6 border-b-2 border-slate-900 dark:border-white bg-muted/30">
            <CommandPalette />
          </div>
          <nav className="flex-1 px-0 py-0 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "w-full flex items-center gap-4 px-6 py-4 border-b-2 border-slate-900 dark:border-white text-sm font-bold uppercase tracking-tight transition-none",
                    active
                      ? "bg-foreground text-background"
                      : "text-foreground hover:bg-yellow-300 dark:hover:bg-yellow-400 dark:hover:text-black",
                  )}
                >
                  <item.icon className={cn("h-5 w-5 stroke-[2.5px]", active ? "text-background" : "text-foreground")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-6 border-t-2 border-slate-900 dark:border-white bg-muted/30">
            <div className="rounded-none border-2 border-slate-900 dark:border-white bg-background p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Live_Market_Data
              </p>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono font-bold text-foreground">USD/TRY</p>
                  {isRateLoading ? (
                    <div className="mt-1 h-8 w-24 bg-muted animate-pulse border border-slate-900 dark:border-white" />
                  ) : (
                    <p className="text-2xl font-mono font-black tracking-tighter">
                      {(usdRate ?? USD_TRY_RATE).toFixed(4)}
                    </p>
                  )}
                </div>
                <BadgeDollarSign className="h-8 w-8 text-foreground stroke-[2.5px]" />
              </div>
              <p className="mt-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 italic">
                sync_complete
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-none border-2 border-slate-900 dark:border-white bg-background px-4 py-3 text-xs font-black uppercase tracking-widest transition-none hover:bg-red-500 hover:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            >
              <LogOut className="h-4 w-4 stroke-[3px]" />
              Terminate Session
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 bg-muted/10 dark:bg-slate-950 transition-colors duration-300">{children}</main>
      </div>
    </div>
  );
}
