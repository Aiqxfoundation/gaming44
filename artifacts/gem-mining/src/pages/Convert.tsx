import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { notify } from "@/lib/notify";
import { useGetMyConversions, useCreateConversion, useGetSystemStats, useGetWallet } from "@workspace/api-client-react";
import { formatGems, cn } from "@/lib/utils";
import { ArrowDown, History, X, BarChart3, Zap, ArrowLeft, ArrowRight } from "lucide-react";
import { GemIcon } from "@/components/GemIcon";

const PTC_LOGO = "/images/ptc-logo.png";

export default function Convert() {
  const [amount, setAmount]           = useState("");
  const [sheet, setSheet]             = useState<"history" | "rate" | null>(null);
  const queryClient                   = useQueryClient();
  const [, setLocation]               = useLocation();

  const { data: conversions, isLoading: isLoadingHistory } = useGetMyConversions();
  const { data: stats }    = useGetSystemStats();
  const { data: wallet }   = useGetWallet();
  const { mutate: convert, isPending } = useCreateConversion();

  const currentRate   = stats?.conversionRateGemsPerEtr || 100000;
  const gemBalance    = wallet?.gemsBalance ?? 0;
  const numAmount     = Number(amount);
  const expectedPtc   = numAmount > 0 ? numAmount / currentRate : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) { notify.error("Invalid Amount", "Please enter a valid gem amount greater than zero."); return; }
    if (numAmount > gemBalance) { notify.error("Insufficient Balance", "You don't have enough gems for this conversion."); return; }
    convert({ data: { gemsAmount: numAmount, outputType: "etr" } }, {
      onSuccess: () => {
        notify.gemsConverted();
        setAmount("");
        queryClient.invalidateQueries();
      },
      onError: (err: any) => notify.conversionError(err.error),
    });
  };

  return (
    <div className="max-w-md mx-auto pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 bg-background/80 backdrop-blur-md border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <button onClick={() => setLocation("/wallet")}
            className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-base font-bold text-white leading-tight">Convert Gems</p>
            <p className="text-xs text-white/40">Gems to PTC</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSheet(sheet === "rate" ? null : "rate")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all",
              sheet === "rate" ? "bg-primary/20 text-primary border border-primary/30" : "bg-white/[0.04] text-white/50 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white"
            )}
          >
            <BarChart3 size={14} /> Rate
          </button>
          <button
            onClick={() => setSheet(sheet === "history" ? null : "history")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all",
              sheet === "history" ? "bg-primary/20 text-primary border border-primary/30" : "bg-white/[0.04] text-white/50 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white"
            )}
          >
            <History size={14} /> History
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        
        {/* Panels */}
        <AnimatePresence mode="sync">
          {sheet === "rate" && (
            <motion.div
              key="rate-panel"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-[24px] p-5 bg-primary/10 border border-primary/20"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-primary/70">Conversion Rate</p>
                <button onClick={() => setSheet(null)} className="text-primary/50 hover:text-primary transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-primary tabular-nums">
                  {formatGems(currentRate)}
                </span>
                <span className="text-sm font-bold text-primary/60">gems = 1 PTC</span>
              </div>
              {stats?.isDynamicRateActive && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-primary/20">
                  <Zap size={14} className="text-primary" />
                  <p className="text-xs font-bold text-primary/80">
                    Dynamic Halving active
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {sheet === "history" && (
            <motion.div
              key="history-panel"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-[24px] overflow-hidden bg-[#0b0c10] border border-white/[0.06]"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
                <p className="text-xs font-bold uppercase tracking-widest text-white/40">Conversion History</p>
                <button onClick={() => setSheet(null)} className="text-white/40 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
              {isLoadingHistory ? (
                <div className="py-8 flex justify-center">
                  <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                </div>
              ) : !conversions?.length ? (
                <div className="py-8 text-center text-sm text-white/40 font-bold">
                  No conversions yet
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04] max-h-64 overflow-y-auto custom-scrollbar">
                  {conversions.map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-5 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white/60 font-mono">−{formatGems(c.gemsSpent)}</span>
                          <ArrowRight size={12} className="text-white/30" />
                          <span className="text-sm font-bold text-primary font-mono">+{c.outputAmount.toFixed(4)} PTC</span>
                        </div>
                        <p className="text-xs text-white/30 mt-1 font-mono">
                          {format(new Date(c.createdAt), "MMM d, HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Balance */}
        <div className="flex items-center justify-between px-5 py-4 rounded-[24px] bg-[#0b0c10] border border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
               <GemIcon size={20} className="text-primary" />
            </div>
            <span className="text-sm font-bold text-white/50">Available Balance</span>
          </div>
          <span className="text-xl font-black font-mono text-white tabular-nums">
            {formatGems(gemBalance)}
          </span>
        </div>

        {/* Converter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[32px] overflow-hidden bg-[#0b0c10] border border-white/[0.06]"
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-6">

            {/* Gem input */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40">Gems</label>
                <button type="button" onClick={() => setAmount(String(Math.floor(gemBalance)))}
                  className="text-xs font-bold text-primary hover:underline">
                  MAX
                </button>
              </div>
              <div className="relative">
                <input
                  type="number" min="1" step="1" value={amount}
                  onChange={e => setAmount(e.target.value)} required placeholder="0"
                  className={cn(
                    "w-full rounded-2xl px-5 py-5 text-white text-3xl font-black font-mono placeholder:text-white/10 focus:outline-none transition-colors pr-16",
                    numAmount > 0 && numAmount <= gemBalance ? "bg-primary/10 border border-primary/30" : numAmount > gemBalance ? "bg-red-500/10 border border-red-500/30" : "bg-white/[0.04] border border-white/[0.08] focus:border-primary/50"
                  )}
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-primary/50">
                  <GemIcon size={24} />
                </div>
              </div>
              {numAmount > gemBalance && numAmount > 0 && (
                <p className="text-xs font-bold text-red-400 mt-2 px-1">Exceeds your balance</p>
              )}
            </div>

            <div className="flex justify-center -my-2 relative z-10">
              <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center border border-white/[0.06]">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ArrowDown size={20} className="text-primary" />
                </div>
              </div>
            </div>

            {/* PTC output */}
            <div className={cn(
              "rounded-2xl p-5 transition-colors",
              numAmount > 0 && numAmount <= gemBalance ? "bg-primary/10 border border-primary/20" : "bg-white/[0.02] border border-white/[0.04]"
            )}>
              <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">You Receive</p>
              <div className="flex items-center gap-4">
                <img src={PTC_LOGO} alt="PTC" className="w-10 h-10 rounded-full shrink-0" />
                <span className={cn(
                  "text-3xl font-black font-mono tabular-nums",
                  numAmount > 0 && numAmount <= gemBalance ? "text-primary" : "text-white/20"
                )}>
                  {numAmount > 0 && numAmount <= gemBalance ? `${expectedPtc.toFixed(4)} PTC` : "— PTC"}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending || numAmount <= 0 || numAmount > gemBalance}
              className="w-full py-5 rounded-2xl font-bold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-primary text-black hover:brightness-105 active:scale-[0.98]"
            >
              {isPending ? "Converting…" : numAmount > 0 && numAmount <= gemBalance ? `Convert to PTC` : "Enter Amount"}
            </button>
            
          </form>
        </motion.div>

      </div>
    </div>
  );
}
