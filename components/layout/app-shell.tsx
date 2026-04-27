"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Menu, PieChart, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { SignOutButton } from "@/components/layout/sign-out-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { getPageTitle } from "@/lib/navigation";
import { APP_NAME, NAV_ITEMS } from "@/lib/constants";
import { cn, getInitials } from "@/lib/utils";

export function AppShell({
  children,
  userName,
  email,
}: {
  children: ReactNode;
  userName: string;
  email: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);

  const navContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <PieChart className="h-5 w-5" />
        </div>
        <div>
          <p className="font-display text-xl font-semibold">{APP_NAME}</p>
          <p className="text-sm text-muted-foreground">Financas pessoais</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                isActive ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-4 border-t border-border/70 px-6 py-6">
        <div className="rounded-3xl border border-border/70 bg-secondary/60 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card text-sm font-semibold text-foreground shadow-sm">
              {getInitials(userName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{userName}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      <div className="flex min-h-screen">
        <aside className="hidden w-[280px] border-r border-border/70 bg-card/70 backdrop-blur lg:block">{navContent}</aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
            <div className="container flex h-20 items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className={cn(buttonVariants({ variant: "outline", size: "icon" }), "lg:hidden")}
                  aria-label="Abrir menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Area privada</p>
                  <h1 className="text-2xl font-semibold">{pageTitle}</h1>
                </div>
              </div>
              <div className="hidden items-center gap-3 lg:flex">
                <ThemeToggle />
                <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-2 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-sm font-semibold">
                    {getInitials(userName)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{userName}</p>
                    <p className="truncate text-xs text-muted-foreground">{email}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="container flex-1 py-8">{children}</main>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/50 lg:hidden">
          <div className="absolute inset-y-0 left-0 w-full max-w-[300px] border-r border-border bg-card shadow-panel">
            <div className="flex items-center justify-between border-b border-border/70 px-6 py-5">
              <p className="font-display text-xl font-semibold">{APP_NAME}</p>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className={buttonVariants({ variant: "ghost", size: "icon" })}
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {navContent}
          </div>
        </div>
      ) : null}
    </div>
  );
}
