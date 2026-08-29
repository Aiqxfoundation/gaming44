import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { notify } from "@/lib/notify";
import { format } from "date-fns";
import {
  useGetWallet, useGetMyWithdrawals, useTransferEtr,
} from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, ArrowUpRight, Send, X, Lock, ShieldCheck, ChevronRight, History
} from "lucide-react";

const PTC_LOGO = "/images/ptc-logo.png";

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

// ── Transfer Sheet ────────────────────────────────────────────────────────────
function TransferSheet({ etrBalance, isVerified, onClose }: {
  etrBalance: number; isVerified: boolean; onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const { mutate: transfer, isPending } = useTransferEtr();

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
              PTC transfers are only available to verified miners. Mint your Verification Badge to unlock.
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim()) { notify.error("Recipient Required", "Please enter the username of the person you're sending PTC to."); return; }
    const n = Number(amount);
    if (!n || n <= 0) { notify.error("Invalid Amount", "Please enter a valid PTC amount greater than zero."); return; }
    if (n > etrBalance) { notify.error("Insufficient Balance", "You don't have enough PTC to complete this transfer."); return; }
    transfer({ data: { toUsername: to.trim(), amount: n } }, {
      onSuccess: () => {
        notify.transferSent(amount, to);
        queryClient.invalidateQueries();
        onClose();
      },
      onError: (err: any) => notify.error("Transfer Failed", err?.data?.error || err?.error || "Could not complete the transfer. Please try again."),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <div>
        <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2.5 block">Recipient Username</label>
        <input
          value={to} onChange={e => setTo(e.target.value)} required placeholder="@username"
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-4 text-white text-base placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Amount (PTC)</label>
          <button type="button" onClick={() => setAmount(String(etrBalance))}
            className="text-xs text-primary font-bold hover:underline">
            MAX: {etrBalance.toFixed(4)}
          </button>
        </div>
        <input
          type="number" step="0.0001" min="0.0001" value={amount}
          onChange={e => setAmount(e.target.value)} required placeholder="0.0000"
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-4 text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors text-lg"
        />
      </div>
      <p className="text-xs text-white/30 leading-relaxed">
        Transfers are instant and irreversible. Recipient must be an active Peridot Mining user.
      </p>
      <button type="submit" disabled={isPending}
        className="w-full py-4 rounded-2xl bg-primary text-black font-bold text-base disabled:opacity-40 transition-all hover:brightness-105 active:scale-[0.98]">
        {isPending ? "Sending…" : "Send PTC"}
      </button>
    </form>
  );
}

// ── Tx row ────────────────────────────────────────────────────────────────────
function TxRow({ type, amount, status, date, isOut }: {
  type: string; amount: string; status: string; date: string; isOut: boolean;
}) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-white/[0.04] last:border-0">
      <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center shrink-0">
        {isOut ? <ArrowUpRight size={20} className="text-white/50" /> : <Send size={20} className="text-white/50" />}
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
        <p className="text-base font-bold text-white font-mono">{amount}</p>
      </div>
    </div>
  );
}

// ── Main ETR Page ─────────────────────────────────────────────────────────────
export default function EtrPage() {
  const [, navigate] = useLocation();
  const [sheet, setSheet] = useState<"transfer" | null>(null);
  const { data: wallet } = useGetWallet();
  const { data: withdrawals } = useGetMyWithdrawals();

  const etrBalance  = wallet?.etrBalance ?? 0;
  const isVerified  = (wallet as any)?.isVerified ?? false;

  const etrWithdrawals = (withdrawals ?? []).filter((w: any) => w.currency === "etr");

  return (
    <div className="max-w-md mx-auto pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 bg-background/80 backdrop-blur-md border-b border-white/[0.04]">
        <button onClick={() => navigate("/wallet")}
          className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <img src={PTC_LOGO} alt="PTC" className="w-8 h-8 rounded-full" />
          <div>
            <p className="text-base font-bold text-white leading-tight">PTC Token</p>
            <p className="text-xs text-white/40">Peridot Token</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-8 space-y-8">
        {/* Balance */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">PTC Balance</p>
          <p className="text-5xl font-black text-white tracking-tighter tabular-nums">{etrBalance.toFixed(4)}</p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 gap-3"
        >
          {/* Transfer */}
          <button
            onClick={() => setSheet("transfer")}
            className={cn(
              "flex flex-col items-center justify-center gap-3 py-6 rounded-[24px] font-bold text-base transition-all active:scale-[0.98]",
              isVerified
                ? "bg-primary text-black hover:brightness-105"
                : "bg-[#0b0c10] border border-white/[0.08] text-white/50"
            )}
          >
            {isVerified ? <Send size={24} /> : <Lock size={24} />}
            Transfer
          </button>

          {/* Withdraw — always locked until mainnet */}
          <button
            onClick={() => notify.info("Coming Soon", "PTC withdrawals will be enabled after the mainnet token launch.")}
            className="flex flex-col items-center justify-center gap-3 py-6 rounded-[24px] bg-white/[0.02] border border-white/[0.04] text-white/30 font-bold text-base cursor-default"
          >
            <Lock size={24} />
            Withdraw
          </button>
        </motion.div>

        {/* Mainnet notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]"
        >
          <Lock size={16} className="text-white/30 shrink-0" />
          <p className="text-xs text-white/40 leading-relaxed">PTC withdrawals are enabled after the token mainnet launch.</p>
        </motion.div>

        {/* Transfer lock notice */}
        {!isVerified && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12 }}
            onClick={() => navigate("/verify")}
            className="w-full flex items-center gap-4 p-4 rounded-3xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Unlock Transfers</p>
              <p className="text-xs text-white/40 mt-0.5">Mint Verification Badge to access</p>
            </div>
            <ChevronRight size={18} className="text-white/20" />
          </motion.button>
        )}

        {/* ETR Withdrawal history */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
        >
          <h2 className="text-sm font-bold text-white mb-4 px-1">PTC History</h2>
          {!etrWithdrawals.length ? (
            <div className="py-12 text-center bg-[#0b0c10] border border-white/[0.06] rounded-3xl">
              <History size={28} className="mx-auto text-white/20 mb-3" />
              <p className="text-sm text-white/40">No PTC transactions yet</p>
            </div>
          ) : (
            <div className="bg-[#0b0c10] border border-white/[0.06] rounded-3xl px-4 py-2">
              {etrWithdrawals.map((w: any) => (
                <TxRow
                  key={w.id}
                  type="PTC Withdrawal"
                  amount={`${w.amount.toFixed(4)}`}
                  status={w.status}
                  date={format(new Date(w.createdAt), "MMM d, HH:mm")}
                  isOut
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <Sheet open={sheet === "transfer"} onClose={() => setSheet(null)} title="Transfer PTC">
        <TransferSheet etrBalance={etrBalance} isVerified={isVerified} onClose={() => setSheet(null)} />
      </Sheet>
    </div>
  );
}
