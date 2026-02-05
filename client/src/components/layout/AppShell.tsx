"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeDollarSign,
  LogOut,
  LayoutGrid,
  PieChart,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { USD_TRY_RATE } from "@/lib/fintrack";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutGrid, href: "/" },
  { label: "Budget Entry", icon: Wallet, href: "/budget" },
  { label: "Investments", icon: TrendingUp, href: "/investment" },
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

  if (isAuthPage) {
    return <main className="min-h-screen bg-background text-foreground">{children}</main>;
  }

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex flex-col lg:flex-row">
        <aside className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-border bg-card/60">
          <div className="px-6 py-7 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary grid place-items-center font-semibold">
              FT
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Personal Finance</p>
              <h1 className="text-lg font-semibold">FinTrack</h1>
            </div>
          </div>
          <nav className="px-4 pb-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition",
                  isActivePath(pathname, item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="px-6 pb-8">
            <div className="rounded-2xl border border-border bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Live FX
              </p>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">USD/TRY</p>
                  <p className="text-2xl font-semibold">{USD_TRY_RATE}</p>
                </div>
                <BadgeDollarSign className="h-6 w-6 text-primary" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Mocked exchange rate update every session.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background/70 px-4 py-2.5 text-sm text-muted-foreground transition hover:text-foreground hover:bg-muted/50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
