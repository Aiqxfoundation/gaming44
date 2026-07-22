import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { notify } from "@/lib/notify";
import { useGenerateDepositAddress } from "@workspace/api-client-react";
import {
  ArrowLeft, Copy, Check, RefreshCw, X, Clock, AlertCircle,
  Wallet, ExternalLink, QrCode, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const USDT_LOGO = "/images/usdt-logo.png";
const ADDRESS_KEY = "etr_deposit_address";
const ADDRESS_TTL_MS = 2 * 60 * 60 * 1000;

interface StoredAddress {
  address: string;
  label?: string;
  network?: string;
  issuedAt: number;
  expiresAt: number;
}

function loadStoredAddress(): StoredAddress | null {
  try {
    const raw = localStorage.getItem(ADDRESS_KEY);
    if (!raw) return null;
    const stored: StoredAddress = JSON.parse(raw);
    if (Date.now() > stored.expiresAt) {
      localStorage.removeItem(ADDRESS_KEY);
      return null;
    }
    return stored;
  } catch {
    return null;
  }
}

function saveAddress(address: string, label?: string, network?: string) {
  const now = Date.now();
  const stored: StoredAddress = {
    address,
    label,
    network,
    issuedAt: now,
    expiresAt: now + ADDRESS_TTL_MS,
  };
  localStorage.setItem(ADDRESS_KEY, JSON.stringify(stored));
  return stored;
}

function clearAddress() {
  localStorage.removeItem(ADDRESS_KEY);
}

function useCountdown(expiresAt: number | null) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setRemaining(Math.max(0, expiresAt - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const h = Math.floor(remaining / (1000 * 60 * 60));
  const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((remaining % (1000 * 60)) / 1000);

  return { remaining, h, m, s };
}

export default function DepositAddress() {
  const [, navigate] = useLocation();
  const [stored, setStored] = useState<StoredAddress | null>(loadStoredAddress);
  const [copied, setCopied] = useState(false);
  const { refetch: generateAddress, isFetching } = useGenerateDepositAddress();
  const { h, m, s, remaining } = useCountdown(stored?.expiresAt ?? null);

  const handleGenerate = async () => {
    const r = await generateAddress();
    if (r.data) {
      const s = saveAddress(r.data.address, r.data.label ?? undefined, r.data.network ?? undefined);
      setStored(s);
      notify.depositAssigned();
    } else {
      notify.error("No Addresses Available", "There are currently no deposit addresses. Please contact support.");
    }
  };

  const handleCopy = () => {
    if (!stored?.address) return;
    navigator.clipboard.writeText(stored.address);
    setCopied(true);
    notify.copied("Wallet Address Copied");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDismiss = () => {
    clearAddress();
    setStored(null);
    notify.depositDismissed();
  };

  const pct = stored ? Math.max(0, Math.min(100, (remaining / ADDRESS_TTL_MS) * 100)) : 0;

  return (
    <div className="max-w-md mx-auto pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 bg-background/80 backdrop-blur-md border-b border-white/[0.04]">
        <button onClick={() => navigate("/wallet")}
          className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-base font-bold text-white leading-tight">Deposit Address</h1>
          <p className="text-xs text-white/40">Legacy Request</p>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Network info */}
        <div className="flex items-center gap-4 p-5 rounded-[24px] bg-[#0b0c10] border border-white/[0.06]">
          <img src={USDT_LOGO} alt="USDT" className="w-12 h-12 rounded-full" />
          <div className="flex-1">
            <p className="text-base font-bold text-white">Tether USD</p>
            <p className="text-xs text-white/50 mt-0.5">USDT Deposit · Min $10</p>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
            BSC
          </span>
        </div>

        {/* Address display or generator */}
        {!stored ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[32px] p-8 text-center bg-[#0b0c10] border border-white/[0.06]"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
              <QrCode size={32} className="text-primary" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Get Deposit Address</h3>
            <p className="text-sm text-white/40 mb-8 leading-relaxed max-w-[240px] mx-auto">
              Generate a unique BSC deposit address to receive your USDT. Valid for 2 hours.
            </p>
            <button
              onClick={handleGenerate}
              disabled={isFetching}
              className="w-full py-4 rounded-2xl bg-primary text-black font-bold text-base hover:brightness-105 transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              {isFetching ? (
                <span className="flex items-center justify-center gap-2"><RefreshCw size={18} className="animate-spin" /> Generating...</span>
              ) : (
                <span className="flex items-center justify-center gap-2"><Wallet size={18} /> Generate Address</span>
              )}
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Address card */}
            <div className="rounded-[32px] overflow-hidden bg-[#0b0c10] border border-white/[0.06]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-primary" />
                  <span className="text-xs font-bold text-primary/80 uppercase tracking-widest">Active Address</span>
                </div>
                <button
                  onClick={handleDismiss}
                  className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.1] transition-all"
                  title="Dismiss address"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Address */}
              <div className="px-6 pb-6 space-y-6">
                <code className="text-sm font-mono text-white/90 break-all leading-relaxed block bg-white/[0.04] rounded-2xl p-5 border border-white/[0.06]">
                  {stored.address}
                </code>
                <button
                  onClick={handleCopy}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98]",
                    copied
                      ? "bg-white/[0.1] text-white"
                      : "bg-primary text-black hover:brightness-105"
                  )}
                >
                  {copied ? <><Check size={18} /> Copied!</> : <><Copy size={18} /> Copy Address</>}
                </button>

                {/* Timer */}
                <div className="bg-black/30 rounded-2xl p-4 border border-white/[0.04]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-white/40" />
                      <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Expires in</span>
                    </div>
                    <span className="text-sm font-bold text-white font-mono">
                      {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/80 rounded-full transition-all duration-1000"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Info box */}
            <div className="flex gap-4 p-5 rounded-[24px] bg-white/[0.02] border border-white/[0.04]">
              <AlertCircle size={20} className="text-white/40 shrink-0" />
              <div className="text-sm text-white/50 space-y-1">
                <p>Send <strong className="text-white">USDT only</strong> to the provided address.</p>
                <p>Minimum deposit: <strong className="text-white">$10 USDT</strong>.</p>
              </div>
            </div>

            {/* After sending, submit proof */}
            <button
              onClick={() => navigate("/wallet/receive")}
              className="w-full flex items-center justify-between p-5 rounded-[24px] bg-[#0b0c10] border border-white/[0.06] hover:bg-white/[0.02] transition-colors group"
            >
              <div className="text-left">
                <p className="text-base font-bold text-white">Already sent? Submit proof</p>
                <p className="text-xs text-white/40 mt-1">Upload TX hash or screenshot</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center text-white/60 group-hover:bg-primary group-hover:text-black transition-colors">
                 <ExternalLink size={18} />
              </div>
            </button>

            {/* Get new address */}
            <button
              onClick={handleGenerate}
              disabled={isFetching}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white/40 hover:text-white/60 text-sm font-bold transition-all disabled:opacity-50"
            >
              <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
              {isFetching ? "Generating..." : "Get a different address"}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
