import React, { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { notify } from "@/lib/notify";
import { useCreateDepositFull } from "@workspace/api-client-react";
import {
  ArrowLeft, Upload, X, AlertCircle, Check, Hash, Image as ImageIcon,
  ChevronRight, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const USDT_LOGO = "/images/usdt-logo.png";
const ADDRESS_KEY = "etr_deposit_address";

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

export default function Receive() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const storedAddress = loadStoredAddress();

  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { mutate: createDeposit, isPending } = useCreateDepositFull();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { notify.error("Invalid File Type", "Please upload an image file (JPG, PNG, etc.)."); return; }
    if (file.size > 5 * 1024 * 1024) { notify.error("File Too Large", "Screenshot must be under 5 MB. Please compress and try again."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const r = ev.target?.result as string;
      setScreenshotPreview(r);
      setScreenshotData(r);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount);
    if (!n || n < 10) { notify.error("Minimum Deposit", "The minimum USDT deposit is $10.00."); return; }
    if (!txHash && !screenshotData) { notify.error("Proof Required", "Please provide a transaction hash or payment screenshot."); return; }

    createDeposit(
      {
        amountUsdt: n,
        txHash: txHash || undefined,
        screenshotData: screenshotData || undefined,
        assignedAddress: storedAddress?.address || undefined,
      },
      {
        onSuccess: () => {
          notify.depositSubmitted();
          queryClient.invalidateQueries();
          navigate("/wallet");
        },
        onError: (err: any) => notify.error("Submission Failed", err?.data?.error || err?.message || "Could not submit your deposit. Please try again."),
      }
    );
  };

  return (
    <div className="max-w-md mx-auto pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 bg-background/80 backdrop-blur-md border-b border-white/[0.04]">
        <button onClick={() => navigate("/wallet/deposit-address")}
          className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-base font-bold text-white leading-tight">Submit Deposit</h1>
          <p className="text-xs text-white/40">Proof of Payment</p>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* No address warning */}
        {!storedAddress && (
          <div className="rounded-[24px] p-5 bg-red-500/10 border border-red-500/20">
            <div className="flex gap-4">
              <AlertCircle size={20} className="text-red-400 shrink-0" />
              <div>
                <p className="text-base font-bold text-red-400">No Active Address</p>
                <p className="text-sm text-red-400/70 mt-1 leading-relaxed">
                  You need to generate a deposit address first before submitting proof.
                </p>
                <button
                  onClick={() => navigate("/wallet/deposit-address")}
                  className="mt-4 flex items-center gap-1.5 text-sm font-bold text-red-400 hover:text-red-300 transition-colors"
                >
                  Get Address <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assigned address display */}
        {storedAddress && (
          <div className="rounded-[24px] p-5 bg-[#0b0c10] border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-3">
              <img src={USDT_LOGO} alt="USDT" className="w-6 h-6 rounded-full" />
              <span className="text-xs font-bold text-white/40 uppercase tracking-widest">
                Assigned Address
              </span>
            </div>
            <code className="text-sm font-mono text-white/90 break-all leading-relaxed block">
              {storedAddress.address}
            </code>
          </div>
        )}

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[32px] overflow-hidden bg-[#0b0c10] border border-white/[0.06]"
        >
          <div className="px-6 pt-6 pb-4 border-b border-white/[0.04]">
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Deposit Details</p>
          </div>
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {/* Amount */}
            <div>
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2.5 block">Amount Sent (USDT)</label>
              <div className="relative">
                <input
                  type="number" step="0.01" min="10" value={amount}
                  onChange={e => setAmount(e.target.value)} required
                  placeholder="0.00"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-4 text-white text-lg font-mono placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors pr-20"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-white/40">USDT</span>
              </div>
              <p className="text-xs text-white/30 mt-2">Minimum $10.00</p>
            </div>

            {/* Divider with OR */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-xs font-bold text-white/30 uppercase tracking-widest">Proof</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* TX Hash */}
            <div>
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                <Hash size={14} />
                Transaction Hash
              </label>
              <input
                value={txHash} onChange={e => setTxHash(e.target.value)}
                placeholder="0x..."
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-4 text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-xs font-bold text-white/30 uppercase tracking-widest">OR</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* Screenshot */}
            <div>
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                <ImageIcon size={14} />
                Payment Screenshot
              </label>
              {screenshotPreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-white/[0.08]">
                  <img src={screenshotPreview} alt="proof" className="w-full h-40 object-cover" />
                  <button type="button"
                    onClick={() => { setScreenshotPreview(null); setScreenshotData(null); }}
                    className="absolute top-3 right-3 w-8 h-8 bg-black/80 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors">
                    <X size={14} />
                  </button>
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/80 px-3 py-1.5 rounded-lg">
                    <Check size={14} className="text-emerald-400" />
                    <span className="text-xs text-white font-bold">Attached</span>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full h-28 border-2 border-dashed border-white/[0.1] rounded-2xl flex flex-col items-center justify-center gap-2 text-white/40 hover:border-primary/50 hover:text-primary transition-all bg-white/[0.01] hover:bg-primary/5">
                  <Upload size={24} />
                  <span className="text-sm font-semibold">Upload screenshot</span>
                  <span className="text-xs opacity-60">Max 5 MB</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </div>

            <button type="submit" disabled={isPending || !storedAddress}
              className="w-full py-4 rounded-2xl bg-primary text-black font-bold text-base hover:brightness-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]">
              {isPending ? "Submitting..." : "Submit Deposit Request"}
            </button>
          </form>
        </motion.div>

        {/* No address prompt */}
        {!storedAddress && (
          <button onClick={() => navigate("/wallet/deposit-address")}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-bold bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08] transition-all">
            <ExternalLink size={18} />
            Get Deposit Address First
          </button>
        )}
      </div>
    </div>
  );
}
