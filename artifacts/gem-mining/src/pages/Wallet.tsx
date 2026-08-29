import React, { useMemo } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  useGetWallet, useGetEixWallet, useGetEixDeposits, useGetMyAirdropRewards,
} from "@workspace/api-client-react";
import { formatGems, cn } from "@/lib/utils";
import {
  ChevronRight, ShieldCheck, Zap, Gift, Coins, ArrowDownLeft, History, Lock,
} from "lucide-react";
import { GemIcon } from "@/components/GemIcon";
import { EixLogo } from "@/components/EixLogo";

function ActionBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2.5 group">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white group-hover:bg-primary group-hover:border-primary group-hover:text-black transition-all">
        {icon}
      </div>
      <span className="text-[11px] font-bold text-white/50 group-hover:text-white transition-colors">{label}</span>
    </button>
  );
}

export default function Wallet() {
  const [, navigate] = useLocation();
  const { data: wallet, isLoading } = useGetWallet();
  const { data: eixWallet } = useGetEixWallet();
  const { data: eixDeposits } = useGetEixDeposits();
  const { data: airdropRewards } = useGetMyAirdropRewards();

  const eixBalance = eixWallet?.eixBalance ?? 0;
  const eixPrice = eixWallet?.eixPriceUsd ?? 10;
  const gemsBalance = wallet?.gemsBalance ?? 0;
  const powerCardPower = eixWallet?.powerCardPower ?? 0;
  const totalAirdropRewards = eixWallet?.totalAirdropRewards ?? 0;
  const isVerified = (wallet as any)?.isVerified ?? false;

  const recentEixPurchases = useMemo(() => {
    return (eixDeposits ?? []).slice().reverse().slice(0, 5);
  }, [eixDeposits]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6 pb-24">

      {/* EIX Balance Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 border border-orange-500/20"
        style={{ background: "linear-gradient(135deg, rgba(255,149,0,0.12) 0%, rgba(10,11,17,0.6) 60%)" }}
      >
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,149,0,0.06)" }} />
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-orange-400/80">EthicX • EIX</span>
            <span className="text-[10px] text-white/40 font-mono">${(eixBalance * eixPrice).toFixed(2)} USD</span>
          </div>
          <div className="flex items-end gap-2 mt-2">
            <EixLogo size={28} />
            <span className="text-4xl font-black text-white font-mono">{formatGems(Math.floor(eixBalance))}</span>
            <span className="text-lg font-bold text-orange-400 mb-1">EIX</span>
          </div>
          <p className="text-xs text-white/40 mt-1">Fixed value ${eixPrice.toFixed(2)} per EIX · Ecosystem Fuel</p>
          <button
            onClick={() => navigate("/eix")}
            className="mt-4 w-full h-11 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:from-orange-600 hover:to-orange-700 transition-all"
          >
            <Coins size={16} /> Buy EIX
          </button>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="flex items-start justify-center gap-5 px-2">
          <ActionBtn icon={<Coins size={22} />} label="Buy EIX" onClick={() => navigate("/eix")} />
          <ActionBtn icon={<Zap size={22} />} label="Power Cards" onClick={() => navigate("/power-cards")} />
          <ActionBtn icon={<Gift size={22} />} label="Airdrop" onClick={() => navigate("/airdrop")} />
        </div>
      </motion.div>

      {/* Asset Cards */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h2 className="text-sm font-bold text-white mb-3 px-1">Assets</h2>
        <div className="bg-[#0b0c10] border border-white/[0.06] rounded-3xl overflow-hidden p-2">

          {/* Gems */}
          <button onClick={() => navigate("/mining")} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.04] transition-colors text-left">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <GemIcon size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-white">Gems</p>
              <p className="text-xs text-white/40">Mining reward · contribute to airdrops</p>
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-white tabular-nums">{formatGems(gemsBalance)}</p>
            </div>
          </button>

          {/* Power */}
          <button onClick={() => navigate("/power-cards")} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.04] transition-colors text-left mt-1">
            <div className="w-10 h-10 rounded-full bg-orange-500/15 flex items-center justify-center shrink-0">
              <Zap size={18} className="text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-white">Mining Power</p>
              <p className="text-xs text-white/40">From Power Cards</p>
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-white tabular-nums">{formatGems(Math.floor(powerCardPower))}</p>
            </div>
          </button>

          {/* Airdrop Rewards */}
          <button onClick={() => navigate("/airdrop")} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.04] transition-colors text-left mt-1">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Gift size={18} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-white">Airdrop Rewards</p>
              <p className="text-xs text-white/40">Partner tokens earned</p>
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-white tabular-nums">{formatGems(Math.floor(totalAirdropRewards))}</p>
            </div>
          </button>

        </div>
      </motion.div>

      {/* Verification status */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        {isVerified ? (
          <div className="flex items-center gap-3 p-4 rounded-3xl bg-emerald-500/[0.06] border border-emerald-500/[0.12]">
            <ShieldCheck size={20} className="text-emerald-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Verified Miner</p>
              <p className="text-xs text-white/40 mt-0.5">Full ecosystem access unlocked</p>
            </div>
          </div>
        ) : (
          <button onClick={() => navigate("/verify")} className="w-full flex items-center gap-4 p-4 rounded-3xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors text-left">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Lock size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Mint Verification Badge</p>
              <p className="text-xs text-white/40 mt-0.5">Unlock full ecosystem access · 20 EIX</p>
            </div>
            <ChevronRight size={18} className="text-white/20" />
          </button>
        )}
      </motion.div>

      {/* Recent EIX Purchases */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-sm font-bold text-white mb-3 px-1">Recent EIX Purchases</h2>
        {recentEixPurchases.length === 0 ? (
          <div className="text-center py-10 bg-[#0b0c10] border border-white/[0.06] rounded-3xl">
            <History size={24} className="mx-auto text-white/20 mb-2" />
            <p className="text-sm text-white/40">No EIX purchases yet</p>
            <button onClick={() => navigate("/eix")} className="mt-2 text-xs text-orange-400 font-bold">Buy your first EIX →</button>
          </div>
        ) : (
          <div className="bg-[#0b0c10] border border-white/[0.06] rounded-3xl p-4 space-y-3">
            {recentEixPurchases.map((d) => (
              <div key={d.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                  <ArrowDownLeft size={16} className="text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white font-mono">{d.eixAmount.toFixed(2)} EIX</p>
                  <p className="text-xs text-white/40">{format(new Date(d.createdAt), "MMM d, HH:mm")} · {d.currency.toUpperCase()}</p>
                </div>
                <span className={cn(
                  "text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded",
                  d.status === "approved" && "bg-emerald-500/15 text-emerald-400",
                  d.status === "pending" && "bg-orange-500/15 text-orange-400",
                  d.status === "rejected" && "bg-red-500/15 text-red-400",
                )}>{d.status}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

    </div>
  );
}
