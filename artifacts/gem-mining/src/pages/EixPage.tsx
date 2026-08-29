import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { notify } from "@/lib/notify";
import { cn, formatGems } from "@/lib/utils";
import {
  useGetEixWallet,
  useGetEixDepositAddresses,
  useGetEixDeposits,
  useCreateEixDeposit,
  useGetEixReferrals,
  useClaimEixReferral,
} from "@workspace/api-client-react";
import {
  ArrowDownLeft, Copy, Check, Zap, Users, Gift, Clock, Hash, Coins, ChevronRight,
} from "lucide-react";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";

const CURRENCIES = [
  { code: "usdt", label: "USDT", network: "BEP-20" },
  { code: "btc", label: "BTC", network: "Bitcoin" },
  { code: "sol", label: "SOL", network: "Solana" },
  { code: "eth", label: "ETH", network: "ERC-20" },
];

export default function EixPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: eixWallet, isLoading } = useGetEixWallet();
  const { data: addresses } = useGetEixDepositAddresses();
  const { data: deposits } = useGetEixDeposits();
  const { data: eixReferrals } = useGetEixReferrals();
  const { mutate: createDeposit, isPending } = useCreateEixDeposit();
  const { mutate: claimReferral, isPending: claiming } = useClaimEixReferral();

  const [showBuy, setShowBuy] = useState(false);
  const [currency, setCurrency] = useState("usdt");
  const [amountUsd, setAmountUsd] = useState("");
  const [txHash, setTxHash] = useState("");
  const [copied, setCopied] = useState(false);

  const eixBalance = eixWallet?.eixBalance ?? 0;
  const eixPrice = eixWallet?.eixPriceUsd ?? 10;
  const claimableRef = eixWallet?.claimableEixReferral ?? 0;
  const depositAddress = addresses?.[0]?.address ?? "";

  const handleCopy = () => {
    if (!depositAddress) return;
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    notify.success("Address Copied", "Deposit address copied to clipboard.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const usd = Number(amountUsd);
    if (!usd || usd < 10) { notify.error("Minimum $10", "The minimum purchase is $10."); return; }
    if (!txHash.trim()) { notify.error("TX Hash Required", "Please provide your transaction hash."); return; }
    createDeposit(
      { currency, amountUsd: usd, txHash: txHash.trim(), assignedAddress: depositAddress },
      {
        onSuccess: () => {
          notify.success("Purchase Submitted", `${(usd / eixPrice).toFixed(2)} EIX pending approval.`);
          setShowBuy(false);
          setAmountUsd("");
          setTxHash("");
          queryClient.invalidateQueries({ queryKey: ["/api/eix/deposits"] });
          queryClient.invalidateQueries({ queryKey: ["/api/eix/wallet"] });
        },
        onError: (err: any) => notify.error("Submission Failed", err.message),
      }
    );
  };

  const handleClaimRef = () => {
    claimReferral(undefined, {
      onSuccess: (data) => {
        notify.success("EIX Referral Claimed", `${data.claimedEix.toFixed(2)} EIX added to your balance.`);
        queryClient.invalidateQueries({ queryKey: ["/api/eix/wallet"] });
        queryClient.invalidateQueries({ queryKey: ["/api/eix/referrals"] });
      },
      onError: (err: any) => notify.error("Claim Failed", err.message),
    });
  };

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
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold uppercase tracking-widest text-orange-400/80">EthicX • EIX</span>
          <span className="text-[10px] text-white/40 font-mono">Base Currency</span>
        </div>
        <div className="flex items-end gap-2 mt-2">
          <span className="text-4xl font-black text-white font-mono">{formatGems(Math.floor(eixBalance))}</span>
          <span className="text-lg font-bold text-orange-400 mb-1">EIX</span>
        </div>
        <p className="text-xs text-white/40 mt-1">Fixed value ${eixPrice.toFixed(2)} per EIX</p>
        <button
          onClick={() => setShowBuy((s) => !s)}
          className="mt-4 w-full h-11 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:from-orange-600 hover:to-orange-700 transition-all"
        >
          <Coins size={16} /> Buy EIX
        </button>
      </motion.div>

      {/* Power + Airdrop quick stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatChip icon={<Zap size={14} />} label="Power" value={formatGems(Math.floor(eixWallet?.powerCardPower ?? 0))} />
        <StatChip icon={<ArrowDownLeft size={14} />} label="Gems In" value={formatGems(Math.floor(eixWallet?.totalGemsContributed ?? 0))} />
        <StatChip icon={<Gift size={14} />} label="Rewards" value={formatGems(Math.floor(eixWallet?.totalAirdropRewards ?? 0))} />
      </div>

      {/* Ecosystem navigation */}
      <div className="space-y-2">
        <EcoLink
          icon={<Zap size={18} />}
          title="Power Cards"
          desc="Unlock & upgrade cards to boost your mining power"
          onClick={() => navigate("/power-cards")}
        />
        <EcoLink
          icon={<Gift size={18} />}
          title="Airdrop Farming"
          desc="Contribute gems to earn partner tokens"
          onClick={() => navigate("/airdrop")}
        />
      </div>

      {/* Buy EIX form */}
      {showBuy && (
        <motion.form
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          onSubmit={handleSubmit}
          className="rounded-2xl bg-card border border-border p-4 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Buy EIX with Crypto</h3>
            <ConnectWalletButton compact />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {CURRENCIES.map((c) => (
              <button
                key={c.code} type="button" onClick={() => setCurrency(c.code)}
                className={cn(
                  "py-2 rounded-lg text-xs font-bold border transition-all",
                  currency === c.code
                    ? "border-orange-500 bg-orange-500/15 text-orange-400"
                    : "border-border bg-input text-white/50"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs text-white/50 font-semibold">USD Amount (min $10)</label>
            <input
              type="number" value={amountUsd} onChange={(e) => setAmountUsd(e.target.value)}
              placeholder="100"
              className="mt-1 w-full h-11 rounded-lg border border-border bg-input px-3 text-sm text-white"
            />
            {amountUsd && Number(amountUsd) >= 10 && (
              <p className="text-xs text-orange-400 mt-1 font-mono">≈ {(Number(amountUsd) / eixPrice).toFixed(2)} EIX</p>
            )}
          </div>
          <div className="rounded-lg bg-black/30 border border-border p-3">
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Send {CURRENCIES.find(c => c.code === currency)?.label} to</p>
            <div className="flex items-center gap-2">
              <code className="text-xs text-white/70 font-mono truncate flex-1">{depositAddress || "No address available"}</code>
              <button type="button" onClick={handleCopy} className="text-orange-400">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 font-semibold">Transaction Hash</label>
            <div className="flex items-center gap-2 mt-1">
              <Hash size={14} className="text-white/30" />
              <input
                type="text" value={txHash} onChange={(e) => setTxHash(e.target.value)}
                placeholder="0x..."
                className="flex-1 h-11 rounded-lg border border-border bg-input px-3 text-sm text-white"
              />
            </div>
          </div>
          <button
            type="submit" disabled={isPending}
            className="w-full h-11 rounded-xl bg-orange-500 text-black font-bold text-sm disabled:opacity-50"
          >
            {isPending ? "Submitting…" : "Submit Purchase"}
          </button>
        </motion.form>
      )}

      {/* EIX Referral rewards */}
      {claimableRef > 0 && (
        <div className="rounded-2xl bg-card border border-orange-500/20 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-400">
              <Users size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">EIX Referral Reward</p>
              <p className="text-xs text-orange-400 font-mono">{claimableRef.toFixed(2)} EIX claimable</p>
            </div>
          </div>
          <button
            onClick={handleClaimRef} disabled={claiming}
            className="h-9 px-4 rounded-lg bg-orange-500 text-black font-bold text-xs disabled:opacity-50"
          >
            Claim
          </button>
        </div>
      )}

      {/* Deposit history */}
      <div>
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Clock size={15} className="text-orange-400" /> Purchase History
        </h3>
        <div className="space-y-2">
          {(deposits ?? []).length === 0 && (
            <p className="text-xs text-white/40 text-center py-6">No EIX purchases yet.</p>
          )}
          {(deposits ?? []).map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-xl bg-card border border-border px-4 py-3">
              <div>
                <p className="text-sm font-bold text-white font-mono">{d.eixAmount.toFixed(2)} EIX</p>
                <p className="text-xs text-white/40">${d.amountUsd} • {d.currency.toUpperCase()}</p>
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
      </div>

      {/* EIX referral history */}
      {(eixReferrals ?? []).length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Users size={15} className="text-orange-400" /> EIX Referral History
          </h3>
          <div className="space-y-2">
            {(eixReferrals ?? []).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl bg-card border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-white font-mono">+{r.eixAmount.toFixed(2)} EIX</p>
                  <p className="text-xs text-white/40">{r.reason}</p>
                </div>
                <span className={cn("text-[10px] uppercase font-bold", r.isClaimed ? "text-white/30" : "text-orange-400")}>
                  {r.isClaimed ? "claimed" : "pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EcoLink({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 rounded-2xl bg-card border border-border p-4 hover:border-orange-500/40 transition-all text-left">
      <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-400 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="text-xs text-white/40">{desc}</p>
      </div>
      <ChevronRight size={18} className="text-white/30 shrink-0" />
    </button>
  );
}

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card border border-border p-3 flex flex-col items-center gap-1">
      <div className="text-orange-400">{icon}</div>
      <span className="text-sm font-bold text-white font-mono">{value}</span>
      <span className="text-[10px] text-white/40 uppercase tracking-wide">{label}</span>
    </div>
  );
}
