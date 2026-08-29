import React from "react";
import { Link, useLocation } from "wouter";
import {
  Pickaxe, Wallet, Users, UserCircle,
  ShieldAlert, LogOut, Layers,
} from "lucide-react";
import { cn, formatGems } from "@/lib/utils";
import { useGetWallet, useLogout } from "@workspace/api-client-react";
import type { UserProfile } from "@workspace/api-client-react";
import { GemIcon } from "./GemIcon";
import { useEixBalanceSync } from "@/hooks/useEixBalanceSync";

const BOTTOM_TABS = [
  { href: "/mining",   label: "Mine",    icon: Pickaxe },
  { href: "/levels",   label: "Levels",  icon: Layers },
  { href: "/wallet",   label: "Wallet",  icon: Wallet },
  { href: "/referral", label: "Team",    icon: Users },
  { href: "/profile",  label: "Profile", icon: UserCircle },
];

export function Layout({ children, user }: { children: React.ReactNode; user: UserProfile }) {
  const [location] = useLocation();
  const { data: wallet } = useGetWallet();
  const { mutate: logout } = useLogout();
  const [, setLocation] = useLocation();

  // Keep the EIX balance live across the app while deposits are pending.
  useEixBalanceSync();

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        localStorage.removeItem("etr_token");
        setLocation("/login");
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-border"
        style={{ background: "rgba(10,11,17,0.95)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-2.5">
          <img
            src={`${import.meta.env.BASE_URL}images/logo-icon.png`}
            alt="Peridot"
            className="w-7 h-7 object-contain"
          />
          <span className="font-bold text-foreground text-sm tracking-tight">Peridot Mining</span>
        </div>

        <div className="flex items-center gap-2.5">
          {wallet && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)" }}>
              <GemIcon size={12} />
              <span className="font-mono text-xs font-bold" style={{ color: "#f97316" }}>
                {formatGems(wallet.gemsBalance)}
              </span>
            </div>
          )}

          {user.isAdmin && (
            <Link href="/admin">
              <button className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <ShieldAlert size={15} style={{ color: "rgba(239,68,68,0.7)" }} />
              </button>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <LogOut size={14} className="text-white/40" />
          </button>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 overflow-y-auto pb-20 custom-scrollbar">
        {children}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border"
        style={{ background: "rgba(10,11,17,0.97)", backdropFilter: "blur(16px)" }}>
        <div className="flex items-center justify-around px-1 py-1.5 max-w-2xl mx-auto">
          {BOTTOM_TABS.map((tab) => {
            const active = location === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center gap-0.5 px-2 py-1.5 min-w-[44px] flex-1"
              >
                <div className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-xl transition-all",
                  active ? "bg-primary/15" : "bg-transparent"
                )}>
                  <tab.icon
                    size={20}
                    className={cn(
                      "transition-colors",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-semibold transition-colors leading-none",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
