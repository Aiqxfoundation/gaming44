import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { notify } from "@/lib/notify";
import { format } from "date-fns";
import {
  useGetWallet, useGetDepositsFull, useGetMyWithdrawals, useCreateWithdrawal,
} from "@workspace/api-client-react";
import { formatCurrency, cn } from "@/lib/utils";
import {
  ArrowLeft, ArrowDownLeft, ArrowUpRight, ChevronRight,
  Lock, ShieldCheck, AlertCircle, X, History
} from "lucide-react";

const USDT_LOGO = "/images/usdt-logo.png";
const WITHDRAWAL_ETR_FEE = 0.1;

// ── Inline modal shell ────────────────────────────────────────────────────────
function Sheet({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed z-50 inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center pointer-events-none"
          >
            <div className="pointer-events-auto w-full md:max-w-sm mx-auto rounded-t-[32px] md:rounded-[32px] flex flex-col overflow-hidden bg-[#0b0c10] border border-white/[0.08]"
              style={{ maxHeight: "90vh" }}>
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.04] shrink-0">
                <h3 className="font-bold text-white text-lg">{title}</h3>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.1] transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 custom-scrollbar">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Withdraw Sheet ────────────────────────────────────────────────────────────
function WithdrawSheet({ usdtBalance, etrBalance, isVerified, onClose }: {
  usdtBalance: number; etrBalance: number; isVerified: boolean; onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const { mutate: withdraw, isPending } = useCreateWithdrawal();
  const [, navigate] = useLocation();

  const hasFee = etrBalance >= WITHDRAWAL_ETR_FEE;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount);
    if (!n || n < 1) { notify.error("Minimum Withdrawal", "The minimum USDT withdrawal amount is $1.00."); return; }
    if (n > usdtBalance) { notify.error("Insufficient Balance", "You don't have enough USDT to cover this withdrawal."); return; }
    if (!address.trim()) { notify.error("Address Required", "Please enter your BSC destination wallet address."); return; }
    withdraw({ data: { currency: "usdt", amount: n, walletAddress: address.trim() } }, {
      onSuccess: () => {
        notify.withdrawalSubmitted();
        queryClient.invalidateQueries();
        onClose();
      },
      onError: (err: any) => notify.error("Withdrawal Failed", err?.data?.error || err?.message || "Could not submit your withdrawal. Please try again."),
    });
  };

  if (!isVerified) {
    return (
      <div className="p-6 space-y-6">
        <div className="py-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/15 flex items-center justify-center mx-auto">
            <ShieldCheck size={28} className="text-primary" />
          </div>
          <div>
            <p className="font-bold text-white text-lg">Verification Required</p>
            <p className="text-sm text-white/50 mt-2 leading-relaxed">
              USDT withdrawals are only available to verified miners. Mint your Verification Badge to unlock.
            </p>
          </div>
        </div>
        <button onClick={() => { onClose(); navigate("/verify"); }}
          className="w-full py-4 rounded-2xl bg-primary text-black font-bold text-base hover:brightness-105 transition-all">
          Mint Verification Badge
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      {/* Fee notice */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
        <AlertCircle size={16} className="text-white/40 shrink-0" />
        <p className="text-xs text-white/50 leading-relaxed">
          Processing fee: <span className="text-white font-semibold">0.1 PTC</span>
          <br/>Balance: {etrBalance.toFixed(4)} PTC
          {!hasFee && <span className="text-primary"> (insufficient)</span>}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Amount (USDT)</label>
          <button type="button" onClick={() => setAmount(String(usdtBalance))}
            className="text-xs text-primary font-bold hover:underline">
            MAX: {formatCurrency(usdtBalance)}
          </button>
        </div>
        <input
          type="number" step="0.01" min="1" value={amount}
          onChange={e => setAmount(e.target.value)} required placeholder="0.00"
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-4 text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors text-lg"
        />
      </div>

      <div>
        <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2.5 block">Destination Address</label>
        <input
          value={address} onChange={e => setAddress(e.target.value)} required placeholder="0x..."
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-4 text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      <p className="text-xs text-white/30 leading-relaxed">
        Withdrawals are irreversible once approved. Double-check your address before submitting.
      </p>

      <button type="submit" disabled={isPending || !hasFee}
        className="w-full py-4 rounded-2xl bg-primary text-black font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:brightness-105 active:scale-[0.98]">
        {isPending ? "Submitting…" : "Withdraw USDT"}
      </button>
    </form>
  );
}

// ── Transaction row ───────────────────────────────────────────────────────────
function TxRow({ type, amount, status, date, isDeposit }: {
  type: string; amount: string; status: string; date: string; isDeposit: boolean;
}) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-white/[0.04] last:border-0">
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
        isDeposit ? "bg-emerald-500/10 text-emerald-400" : "bg-white/[0.04] text-white/50"
      )}>
        {isDeposit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-bold text-white truncate">{type}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-white/40 truncate">{date}</p>
          {status && status !== 'approved' && (
             <span className="text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm bg-white/10 text-white/60">
               {status}
             </span>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className={cn("text-base font-bold font-mono", isDeposit ? "text-emerald-400" : "text-white")}>
          {isDeposit ? "+" : "-"}{amount}
        </p>
      </div>
    </div>
  );
}

// ── Main USDT Page ────────────────────────────────────────────────────────────
export default function UsdtPage() {
  const [, navigate] = useLocation();
  const [sheet, setSheet] = useState<"withdraw" | null>(null);
  const { data: wallet } = useGetWallet();
  const { data: deposits } = useGetDepositsFull();
  const { data: withdrawals } = useGetMyWithdrawals();

  const usdtBalance  = wallet?.usdtBalance ?? 0;
  const etrBalance   = wallet?.etrBalance ?? 0;
  const isVerified   = (wallet as any)?.isVerified ?? false;

  const usdtWithdrawals = (withdrawals ?? []).filter((w: any) => w.currency === "usdt");
  const allTx = [
    ...(deposits ?? []).map((d: any) => ({ ...d, _type: "deposit" })),
    ...usdtWithdrawals.map((w: any) => ({ ...w, _type: "withdrawal" })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="max-w-md mx-auto pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 bg-background/80 backdrop-blur-md border-b border-white/[0.04]">
        <button onClick={() => navigate("/wallet")}
          className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <img src={USDT_LOGO} alt="USDT" className="w-8 h-8 rounded-full" />
          <div>
            <p className="text-base font-bold text-white leading-tight">Tether USD</p>
            <p className="text-xs text-white/40">USDT</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-8 space-y-8">
        {/* Balance */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">USDT Balance</p>
          <p className="text-5xl font-black text-white tracking-tighter tabular-nums">{formatCurrency(usdtBalance)}</p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 gap-3"
        >
          <button
            onClick={() => navigate("/wallet/usdt/deposit")}
            className="flex flex-col items-center justify-center gap-3 py-6 rounded-[24px] bg-primary text-black font-bold hover:brightness-105 transition-all active:scale-[0.98]"
          >
            <ArrowDownLeft size={24} />
            <span className="text-base">Deposit</span>
          </button>

          <button
            onClick={() => setSheet("withdraw")}
            className="flex flex-col items-center justify-center gap-3 py-6 rounded-[24px] bg-[#0b0c10] border border-white/[0.08] text-white font-bold hover:bg-white/[0.04] transition-all active:scale-[0.98]"
          >
            {isVerified ? <ArrowUpRight size={24} /> : <Lock size={24} className="text-white/40" />}
            <span className={cn("text-base", !isVerified && "text-white/50")}>Withdraw</span>
          </button>
        </motion.div>

        {/* Verified unlock notice */}
        {!isVerified && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            onClick={() => navigate("/verify")}
            className="w-full flex items-center gap-4 p-4 rounded-3xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Unlock Withdrawals</p>
              <p className="text-xs text-white/40 mt-0.5">Mint Verification Badge to access</p>
            </div>
            <ChevronRight size={18} className="text-white/20" />
          </motion.button>
        )}

        {/* Transaction history */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="text-sm font-bold text-white mb-4 px-1">USDT History</h2>
          {!allTx.length ? (
            <div className="py-12 text-center bg-[#0b0c10] border border-white/[0.06] rounded-3xl">
              <History size={28} className="mx-auto text-white/20 mb-3" />
              <p className="text-sm text-white/40">No transactions yet</p>
            </div>
          ) : (
            <div className="bg-[#0b0c10] border border-white/[0.06] rounded-3xl px-4 py-2">
              {allTx.map((tx: any) => (
                <TxRow
                  key={`${tx._type}-${tx.id}`}
                  type={tx._type === "deposit" ? "Deposit" : "Withdrawal"}
                  amount={tx._type === "deposit"
                    ? `${tx.amountUsdt.toFixed(2)}`
                    : `${tx.amount.toFixed(2)}`
                  }
                  status={tx.status}
                  date={format(new Date(tx.createdAt), "MMM d, HH:mm")}
                  isDeposit={tx._type === "deposit"}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <Sheet open={sheet === "withdraw"} onClose={() => setSheet(null)} title="Withdraw USDT">
        <WithdrawSheet
          usdtBalance={usdtBalance} etrBalance={etrBalance}
          isVerified={isVerified}
          onClose={() => setSheet(null)}
        />
      </Sheet>
    </div>
  );
}
