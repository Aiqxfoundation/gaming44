import React, { useMemo } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  useGetWallet, useGetDepositsFull, useGetMyWithdrawals, useGetMyConversions, useGetEixWallet
} from "@workspace/api-client-react";
import { formatCurrency, formatGems, cn } from "@/lib/utils";
import {
  ChevronRight, ShieldCheck, ArrowRightLeft, ArrowDownLeft, ArrowUpRight, Send, Lock, History
} from "lucide-react";
import { GemIcon } from "@/components/GemIcon";
import { EixLogo } from "@/components/EixLogo";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import { format } from "date-fns";

const PTC_LOGO  = "/images/ptc-logo.png";
const USDT_LOGO = "/images/usdt-logo.png";

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

function TxRow({ title, subtitle, amount, amountUsd, isPositive, status }: any) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0">
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
        isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-white/[0.04] text-white/50"
      )}>
        {isPositive ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-white/40 truncate">{subtitle}</p>
          {status && status !== 'approved' && (
             <span className="text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm bg-white/10 text-white/60">
               {status}
             </span>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className={cn("text-sm font-bold font-mono", isPositive ? "text-emerald-400" : "text-white")}>
          {isPositive ? "+" : ""}{amount}
        </p>
        {amountUsd && <p className="text-xs text-white/40 font-mono mt-0.5">{amountUsd}</p>}
      </div>
    </div>
  );
}

export default function Wallet() {
  const [, navigate] = useLocation();
  const { data: wallet, isLoading } = useGetWallet();
  
  const { data: deposits } = useGetDepositsFull();
  const { data: withdrawals } = useGetMyWithdrawals();
  const { data: conversions } = useGetMyConversions();
  const { data: eixWallet } = useGetEixWallet();
  const eixBalance = eixWallet?.eixBalance ?? 0;

  const gemsBalance = wallet?.gemsBalance ?? 0;
  const usdtBalance = wallet?.usdtBalance ?? 0;
  const etrBalance  = wallet?.etrBalance ?? 0;
  const isVerified  = (wallet as any)?.isVerified ?? false;
  const totalUsd    = usdtBalance;

  const recentTx = useMemo(() => {
    const all = [
      ...(deposits || []).map((d: any) => ({ ...d, _type: 'deposit' })),
      ...(withdrawals || []).map((w: any) => ({ ...w, _type: 'withdrawal' })),
      ...(conversions || []).map((c: any) => ({ ...c, _type: 'conversion' }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return all.slice(0, 5);
  }, [deposits, withdrawals, conversions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-8 pb-24">
      {/* Web3 wallet connection */}
      <div className="flex justify-end pt-2">
        <ConnectWalletButton />
      </div>

      {/* Total Balance */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center pt-2">
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Total Balance</p>
        <h1 className="text-5xl font-black text-white tracking-tighter tabular-nums">
          {formatCurrency(totalUsd)}
        </h1>
        <div className="flex items-center justify-center gap-2 mt-4">
          {isVerified ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <ShieldCheck size={12} className="text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Verified</span>
            </div>
          ) : (
            <button onClick={() => navigate("/verify")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] transition-colors">
              <Lock size={12} className="text-white/40" />
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Unverified</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="flex items-start justify-center gap-5 px-2">
          <ActionBtn icon={<ArrowDownLeft size={22} />} label="Deposit" onClick={() => navigate("/wallet/usdt/deposit")} />
          <ActionBtn icon={<ArrowUpRight size={22} />} label="Withdraw" onClick={() => navigate("/wallet/usdt")} />
          <ActionBtn icon={<Send size={22} />} label="Transfer" onClick={() => navigate("/wallet/etr")} />
          <ActionBtn icon={<ArrowRightLeft size={22} />} label="Convert" onClick={() => navigate("/wallet/convert")} />
        </div>
      </motion.div>

      {/* Assets */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h2 className="text-sm font-bold text-white mb-3 px-1">Assets</h2>
        <div className="bg-[#0b0c10] border border-white/[0.06] rounded-3xl overflow-hidden p-2">
          
          <button onClick={() => navigate("/wallet/usdt")} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.04] transition-colors text-left">
            <img src={USDT_LOGO} alt="USDT" className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-white">Tether</p>
              <p className="text-xs text-white/40">USDT</p>
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-white tabular-nums">{usdtBalance.toFixed(2)}</p>
              <p className="text-xs text-white/40">{formatCurrency(usdtBalance)}</p>
            </div>
          </button>

          <button onClick={() => navigate("/wallet/etr")} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.04] transition-colors text-left mt-1">
            <img src={PTC_LOGO} alt="PTC" className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-white">Peridot</p>
              <p className="text-xs text-white/40">PTC</p>
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-white tabular-nums">{etrBalance.toFixed(4)}</p>
              <p className="text-xs text-white/40">—</p>
            </div>
          </button>

          <button onClick={() => navigate("/wallet/convert")} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.04] transition-colors text-left mt-1">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <GemIcon size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-white">Gems</p>
              <p className="text-xs text-white/40">Convertible</p>
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-white tabular-nums">{formatGems(gemsBalance)}</p>
            </div>
          </button>

          <button onClick={() => navigate("/eix")} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.04] transition-colors text-left mt-1">
            <div className="w-10 h-10 rounded-full bg-orange-500/15 flex items-center justify-center shrink-0">
              <EixLogo size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-white">EthicX</p>
              <p className="text-xs text-white/40">EIX</p>
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-white tabular-nums">{formatGems(Math.floor(eixBalance))}</p>
            </div>
          </button>

        </div>
      </motion.div>

      {/* Verification nudge */}
      {!isVerified && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <button onClick={() => navigate("/verify")} className="w-full flex items-center gap-4 p-4 rounded-3xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors text-left">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Complete Verification</p>
              <p className="text-xs text-white/40 mt-0.5">Unlock withdrawals and transfers</p>
            </div>
            <ChevronRight size={18} className="text-white/20" />
          </button>
        </motion.div>
      )}

      {/* Recent History */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-sm font-bold text-white mb-3 px-1">Recent Transactions</h2>
        {recentTx.length === 0 ? (
          <div className="text-center py-10 bg-[#0b0c10] border border-white/[0.06] rounded-3xl">
            <History size={24} className="mx-auto text-white/20 mb-2" />
            <p className="text-sm text-white/40">No transactions yet</p>
          </div>
        ) : (
          <div className="bg-[#0b0c10] border border-white/[0.06] rounded-3xl p-4">
            {recentTx.map((tx: any, i) => {
              const d = format(new Date(tx.createdAt), "MMM d, HH:mm");
              if (tx._type === 'deposit') {
                return <TxRow key={i} title="Deposit USDT" subtitle={d} amount={tx.amountUsdt.toFixed(2)} amountUsd={formatCurrency(tx.amountUsdt)} isPositive status={tx.status} />;
              }
              if (tx._type === 'withdrawal') {
                return <TxRow key={i} title={`Withdraw ${tx.currency.toUpperCase()}`} subtitle={d} amount={tx.amount.toFixed(4)} isPositive={false} status={tx.status} />;
              }
              if (tx._type === 'conversion') {
                return <TxRow key={i} title="Convert Gems" subtitle={d} amount={tx.outputAmount.toFixed(4)} isPositive status="approved" />;
              }
              return null;
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
