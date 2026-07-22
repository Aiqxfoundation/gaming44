import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { notify } from "@/lib/notify";
import { useGenerateDepositAddress, useCreateDepositFull } from "@workspace/api-client-react";
import {
  ArrowLeft, Copy, Check, RefreshCw, AlertCircle, Clock,
  Upload, X, Hash, Image as ImageIcon, QrCode
} from "lucide-react";
import { cn } from "@/lib/utils";

const USDT_LOGO = "/images/usdt-logo.png";
const ADDR_KEY = "etr_deposit_addr_v2";
const TTL_MS = 2 * 60 * 60 * 1000;

interface Stored {
  address: string;
  label?: string;
  network?: string;
  expiresAt: number;
}

function load(): Stored | null {
  try {
    const raw = localStorage.getItem(ADDR_KEY);
    if (!raw) return null;
    const s: Stored = JSON.parse(raw);
    if (Date.now() > s.expiresAt) { localStorage.removeItem(ADDR_KEY); return null; }
    return s;
  } catch { return null; }
}

function save(address: string, label?: string, network?: string): Stored {
  const s: Stored = { address, label, network, expiresAt: Date.now() + TTL_MS };
  localStorage.setItem(ADDR_KEY, JSON.stringify(s));
  return s;
}

function useCountdown(expiresAt: number | null) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setRemaining(Math.max(0, expiresAt - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return { h, m, s, remaining };
}

export default function DepositFlow() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Address state
  const [stored, setStored] = useState<Stored | null>(load);
  const [copied, setCopied] = useState(false);
  const { refetch: generateAddr, isFetching: isGenerating } = useGenerateDepositAddress();
  const { h, m, s, remaining } = useCountdown(stored?.expiresAt ?? null);

  // Proof state
  const [step, setStep] = useState<"address" | "proof">(stored ? "proof" : "address");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [screenshot, setScreenshot] = useState<{ preview: string; data: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { mutate: createDeposit, isPending: isSubmitting } = useCreateDepositFull();

  const handleGenerate = async () => {
    const r = await generateAddr();
    if (r.data) {
      const s = save(r.data.address, r.data.label ?? undefined, r.data.network ?? undefined);
      setStored(s);
      setStep("proof");
      notify.depositAssigned();
    } else {
      notify.error("No Addresses Available", "There are currently no deposit addresses. Please contact support.");
    }
  };

  const handleCopy = () => {
    if (!stored?.address) return;
    navigator.clipboard.writeText(stored.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    notify.copied("Wallet Address Copied");
  };

  const handleDismiss = () => {
    localStorage.removeItem(ADDR_KEY);
    setStored(null);
    setStep("address");
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { notify.error("Invalid File Type", "Please upload an image file (JPG, PNG, etc.)."); return; }
    if (file.size > 5 * 1024 * 1024) { notify.error("File Too Large", "Screenshot must be under 5 MB. Please compress and try again."); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const data = ev.target?.result as string;
      setScreenshot({ preview: data, data });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount);
    if (!n || n < 10) { notify.error("Minimum Deposit", "The minimum USDT deposit is $10.00."); return; }
    if (!txHash && !screenshot) { notify.error("Proof Required", "Please provide a transaction hash or payment screenshot."); return; }
    createDeposit(
      {
        amountUsdt: n,
        txHash: txHash || undefined,
        screenshotData: screenshot?.data || undefined,
        assignedAddress: stored?.address || undefined,
      },
      {
        onSuccess: () => {
          notify.depositSubmitted();
          queryClient.invalidateQueries();
          navigate("/wallet/usdt");
        },
        onError: (err: any) => notify.error("Submission Failed", err?.data?.error || err?.message || "Could not submit your deposit. Please try again."),
      }
    );
  };

  const pct = stored ? Math.max(0, (remaining / TTL_MS) * 100) : 0;

  return (
    <div className="max-w-md mx-auto pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 bg-background/80 backdrop-blur-md border-b border-white/[0.04]">
        <button onClick={() => navigate("/wallet/usdt")}
          className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <img src={USDT_LOGO} alt="USDT" className="w-8 h-8 rounded-full" />
          <div>
            <p className="text-base font-bold text-white leading-tight">Deposit USDT</p>
            <p className="text-xs text-white/40">Secure Deposit</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">

        {/* Step 1 — Get Address */}
        {step === "address" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="rounded-[32px] p-8 text-center bg-[#0b0c10] border border-white/[0.06]">
              <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                <QrCode size={32} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Get Deposit Address</h2>
              <p className="text-sm text-white/40 leading-relaxed mb-8 max-w-[240px] mx-auto">
                Generate a unique BSC deposit address to receive your USDT. Valid for 2 hours.
              </p>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-4 rounded-2xl bg-primary text-black font-bold text-base disabled:opacity-40 hover:brightness-105 transition-all active:scale-[0.98]"
              >
                {isGenerating
                  ? <span className="flex items-center justify-center gap-2"><RefreshCw size={18} className="animate-spin" /> Generating…</span>
                  : "Generate Address"}
              </button>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-[24px] bg-white/[0.02] border border-white/[0.04]">
              <AlertCircle size={20} className="text-white/40 shrink-0" />
              <p className="text-sm text-white/50 leading-relaxed">
                Send <strong className="text-white">USDT only</strong> via BSC network to the provided address.
                Minimum $10 USDT.
              </p>
            </div>
          </motion.div>
        )}

        {/* Address card (always shown if exists) */}
        {stored && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-[32px] overflow-hidden bg-[#0b0c10] border border-white/[0.06]">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.04]">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Deposit Address</p>
              <button onClick={handleDismiss}
                className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.1] transition-colors"
                title="Dismiss">
                <X size={14} />
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              <code className="text-sm font-mono text-white/90 break-all leading-relaxed block bg-white/[0.04] rounded-2xl p-5 border border-white/[0.06]">
                {stored.address}
              </code>
              <button onClick={handleCopy}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-bold transition-all active:scale-[0.98]",
                  copied
                    ? "bg-white/[0.1] text-white"
                    : "bg-primary text-black hover:brightness-105"
                )}>
                {copied ? <><Check size={18} /> Copied</> : <><Copy size={18} /> Copy Address</>}
              </button>

              {/* Timer */}
              <div className="bg-black/30 rounded-2xl p-4 border border-white/[0.04]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-white/40" />
                    <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Expires in</span>
                  </div>
                  <span className="text-sm font-bold font-mono text-white">
                    {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full bg-primary/80 rounded-full transition-all duration-1000"
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2 — Submit Proof */}
        {stored && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="rounded-[32px] overflow-hidden bg-[#0b0c10] border border-white/[0.06]">
              <div className="px-6 pt-6 pb-4 border-b border-white/[0.04]">
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Submit Proof</p>
              </div>
              <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
                {/* Amount */}
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2.5 block">Amount Sent (USDT)</label>
                  <div className="relative">
                    <input
                      type="number" step="0.01" min="10" value={amount}
                      onChange={e => setAmount(e.target.value)} required placeholder="0.00"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-4 text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors text-lg pr-20"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-white/40">USDT</span>
                  </div>
                  <p className="text-xs text-white/30 mt-2">Minimum $10.00</p>
                </div>

                {/* TX Hash */}
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                    <Hash size={14} /> Transaction Hash
                  </label>
                  <input
                    value={txHash} onChange={e => setTxHash(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-4 text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                {/* OR divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-xs font-bold text-white/30 uppercase tracking-widest">OR</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>

                {/* Screenshot */}
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                    <ImageIcon size={14} /> Payment Screenshot
                  </label>
                  {screenshot ? (
                    <div className="relative rounded-2xl overflow-hidden border border-white/[0.08]">
                      <img src={screenshot.preview} alt="proof" className="w-full h-40 object-cover" />
                      <button type="button"
                        onClick={() => setScreenshot(null)}
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

                <button type="submit" disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl bg-primary text-black font-bold text-base disabled:opacity-40 hover:brightness-105 transition-all active:scale-[0.98]">
                  {isSubmitting ? "Submitting…" : "Submit Deposit Request"}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
