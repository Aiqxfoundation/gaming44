import React, { useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { notify } from "@/lib/notify";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, useGetWallet, useGetReferrals, useLogout } from "@workspace/api-client-react";
import {
  Copy, CheckCheck, Calendar, ShieldCheck, Shield, Users,
  Lock, Unlock, LogOut, ChevronRight, X, User,
  Wallet, Star, ArrowUpRight, Check, AlertCircle,
  Info, FileText, BookOpen, ScrollText, Pickaxe,
  Gem, Layers, BarChart3, Globe,
} from "lucide-react";
import { GemIcon } from "@/components/GemIcon";
import { formatGems, cn } from "@/lib/utils";

const KYC_COST = 20;
const KYC_BENEFITS = [
  "USDT withdrawals unlocked",
  "PTC transfers to other users",
  "Verified badge on your profile",
  "Priority withdrawal processing",
];

const LEVEL_NAMES = [
  "Free Node", "Miner I", "Miner II", "Miner III",
  "Senior Miner", "Master Miner", "Elite Miner", "Sovereign",
];

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          notify.copied();
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all border"
      style={{
        background: copied ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)",
        borderColor: copied ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.08)",
        color: copied ? "#4ade80" : "rgba(255,255,255,0.35)",
      }}
    >
      {copied ? <CheckCheck size={10} /> : <Copy size={10} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Badge({ children, variant = "neutral" }: { children: React.ReactNode; variant?: "green" | "orange" | "blue" | "neutral" }) {
  const map = {
    green: { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.2)", text: "#4ade80" },
    orange: { bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.2)", text: "#f97316" },
    blue: { bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.2)", text: "#60a5fa" },
    neutral: { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)", text: "rgba(255,255,255,0.5)" },
  };
  const c = map[variant];
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
      {children}
    </span>
  );
}

function InfoRow({ icon, label, value, valueNode, noBorder = false }: {
  icon: React.ReactNode; label: string; value?: string;
  valueNode?: React.ReactNode; noBorder?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3 py-3.5", !noBorder && "border-b border-white/[0.04]")}>
      <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-[0.12em] text-white/25 font-semibold">{label}</p>
        {valueNode ?? (
          <p className="text-[13px] font-semibold mt-0.5 text-white leading-tight">
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

function DocumentSheet({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 bottom-0 z-50 md:inset-0 md:flex md:items-center md:justify-center pointer-events-none"
          >
            <div className="pointer-events-auto w-full md:max-w-md mx-auto rounded-t-[32px] md:rounded-[32px] bg-[#0b0c10] border border-white/[0.08] flex flex-col overflow-hidden"
              style={{ maxHeight: "85vh" }}>
              <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-white/[0.04] shrink-0">
                <h3 className="font-bold text-white text-lg">{title}</h3>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-white/50 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-5 custom-scrollbar">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const DOC_PAGES = [
  { id: "about", label: "About Project", icon: Info,
    content: (
      <div className="space-y-4 text-sm text-white/60 leading-relaxed">
        <p><span className="text-white font-semibold">Peridot Mining</span> is a next-generation decentralised gem mining ecosystem. Our platform connects yield-generating digital assets with community-powered token rewards.</p>
        <p>Users deposit USDT, mine Peridot Gems over configurable sessions, and convert their accumulated Gems into PTC tokens — the native utility token of the Peridot ecosystem. The more you invest, the higher your mining level and the faster your gems accumulate.</p>
        <div className="rounded-2xl p-4 space-y-2 bg-primary/[0.06] border border-primary/[0.15]">
          <p className="text-white font-semibold text-xs uppercase tracking-widest">Core Facts</p>
          <p>· Mining Periods: 3-hour (Free) / 24-hour (Paid)</p>
          <p>· Up to 10,000,000 gems per $100 USDT over 180 days</p>
          <p>· PTC Token: Native Peridot ecosystem token</p>
          <p>· Referral Levels: 2-tier commission system</p>
        </div>
        <p>Our mission is to create a sustainable, transparent, and rewarding ecosystem where every participant — from free miners to sovereign-level investors — can grow their digital wealth.</p>
      </div>
    ) },
  { id: "documents", label: "Documents", icon: FileText,
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/[0.08] border border-primary/[0.2]">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/[0.12] border border-primary/[0.2]">
            <BarChart3 size={18} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Tokenomics</p>
            <p className="text-xs text-white/40 mt-0.5">PTC supply, distribution & gem conversion mechanics</p>
          </div>
          <span className="text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest bg-primary/[0.15] text-primary border border-primary/[0.2]">Coming Soon</span>
        </div>
        {[
          { title: "Whitepaper", desc: "Full technical and economic overview", icon: BookOpen },
          { title: "Mining Mechanics", desc: "Sessions, levels, and gem rate guide", icon: Pickaxe },
          { title: "Referral Structure", desc: "2-tier referral and commission guide", icon: Users },
          { title: "Smart Contract Audit", desc: "Third-party security audit of PTC contract", icon: Shield },
        ].map((doc, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white/[0.04] border border-white/[0.08]">
              <doc.icon size={15} className="text-white/30" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white/50">{doc.title}</p>
              <p className="text-xs text-white/25 mt-0.5">{doc.desc}</p>
            </div>
            <span className="text-[9px] font-bold text-white/20 shrink-0">Pending</span>
          </div>
        ))}
        <p className="text-xs text-white/25 text-center pt-2">Full document portal releasing soon.</p>
      </div>
    ) },
  { id: "privacy", label: "Privacy Policy", icon: Shield,
    content: (
      <div className="space-y-4 text-sm text-white/60 leading-relaxed">
        <p className="text-white/40 text-xs">Last updated: April 2026</p>
        <p><span className="text-white font-semibold">Data We Collect:</span> Username, hashed password, recovery information, referral linkage, and activity timestamps. We do not collect real names, email addresses, or government IDs through the platform interface.</p>
        <p><span className="text-white font-semibold">KYC Verification:</span> KYC verification is a voluntary action that unlocks withdrawal capabilities and referral commission payouts. Verification status is stored securely.</p>
        <p><span className="text-white font-semibold">Data Storage:</span> All data is stored in encrypted databases. Transaction screenshots submitted for deposit verification are stored temporarily and purged after admin review.</p>
        <p><span className="text-white font-semibold">Third Parties:</span> We do not sell or share your data with third parties.</p>
        <p><span className="text-white font-semibold">Your Rights:</span> You may request account deletion at any time. Contact support through the platform profile page.</p>
      </div>
    ) },
  { id: "terms", label: "Terms of Service", icon: ScrollText,
    content: (
      <div className="space-y-4 text-sm text-white/60 leading-relaxed">
        <p className="text-white/40 text-xs">Last updated: April 2026</p>
        <p><span className="text-white font-semibold">1. Eligibility:</span> You must be 18+ years old to use Peridot Mining. Use is prohibited where restricted by local laws.</p>
        <p><span className="text-white font-semibold">2. Mining & Rewards:</span> Mining rates and session durations are subject to change. Gem accumulation is based on real-time calculations.</p>
        <p><span className="text-white font-semibold">3. Deposits & Withdrawals:</span> USDT deposits require admin approval. Withdrawals are processed within 24–72 hours. Minimum withdrawal thresholds apply.</p>
        <p><span className="text-white font-semibold">4. Referral Commissions:</span> USDT commissions (15%) are credited upon deposit approval, only to KYC-verified uplines. Gem commissions are locked until both parties complete verification.</p>
        <p><span className="text-white font-semibold">5. Risk Disclaimer:</span> Cryptocurrency investments carry inherent risk. Past performance does not guarantee future results. Peridot Mining is not a financial advisor.</p>
        <p><span className="text-white font-semibold">6. Account Termination:</span> We reserve the right to suspend accounts engaged in fraudulent activity, manipulation, or violation of these terms.</p>
      </div>
    ) },
  { id: "kyc", label: "KYC Verification Policy", icon: ShieldCheck,
    content: (
      <div className="space-y-4 text-sm text-white/60 leading-relaxed">
        <p><span className="text-white font-semibold">Voluntary KYC:</span> KYC is a one-time verification action that unlocks the full feature set of the platform. It is not required to deposit or mine, but it is required to withdraw USDT, transfer PTC, and receive referral commissions.</p>
        <p><span className="text-white font-semibold">Badge Cost:</span> The verification badge costs {KYC_COST} PTC and is deducted from your wallet balance instantly.</p>
        <p><span className="text-white font-semibold">What It Unlocks:</span> USDT withdrawals, PTC transfers, a verified badge on your profile, and priority withdrawal processing.</p>
        <p><span className="text-white font-semibold">Security:</span> Verification status is stored securely and cannot be revoked. We do not collect government IDs or real-world personal documents through the platform interface.</p>
      </div>
    ) },
  { id: "ptc-gems", label: "PTC & Gem System", icon: Gem,
    content: (
      <div className="space-y-4 text-sm text-white/60 leading-relaxed">
        <div className="rounded-2xl p-4 bg-primary/[0.06] border border-primary/[0.15]">
          <p className="text-white font-semibold mb-2">Current Conversion Rate</p>
          <p className="text-2xl font-black font-mono text-primary">100,000 Gems = 1 PTC</p>
          <p className="text-xs text-white/40 mt-1">Rate adjusts dynamically after 1M PTC converted (Halving)</p>
        </div>
        <p><span className="text-white font-semibold">What are Gems?</span> Peridot Gems are the in-platform mining reward unit. They accumulate in real-time during active mining sessions and are stored in your gem balance.</p>
        <p><span className="text-white font-semibold">Converting Gems to PTC:</span> Head to Wallet → Convert Gems to exchange your accumulated gems for PTC tokens at the current rate. PTC is credited instantly to your wallet balance.</p>
        <p><span className="text-white font-semibold">Dynamic Halving:</span> Once 1,000,000 PTC has been converted by all users platform-wide, the conversion rate doubles. This creates natural scarcity and rewards early participants.</p>
        <div className="space-y-1">
          {[
            ["Free Node", "~285,714 gems/year (free)"],
            ["Miner I–III", "10M gems per $100 USDT over 180 days"],
            ["Senior–Sovereign", "Multiplied rates based on investment tier"],
          ].map(([level, rate], i) => (
            <div key={i} className="flex justify-between px-3 py-2 rounded-xl bg-white/[0.025]">
              <span className="text-white/60">{level}</span>
              <span className="font-mono text-white/80 text-[11px] text-right">{rate}</span>
            </div>
          ))}
        </div>
      </div>
    ) },
  { id: "levels-info", label: "Levels & All Features", icon: Layers,
    content: (
      <div className="space-y-4 text-sm text-white/60 leading-relaxed">
        <p><span className="text-white font-semibold">8 Mining Levels</span> — from Free Node to Sovereign. Each level requires a USDT investment threshold and unlocks faster gem accumulation.</p>
        <div className="space-y-2">
          {[
            { name: "Free Node", level: 0, invest: "Free", rate: "~782 gems/day" },
            { name: "Miner I", level: 1, invest: "$100", rate: "High rate" },
            { name: "Miner II", level: 2, invest: "$200", rate: "1.2× boost" },
            { name: "Miner III", level: 3, invest: "$300", rate: "1.5× boost" },
            { name: "Senior Miner", level: 4, invest: "$350", rate: "1.8× boost" },
            { name: "Master Miner", level: 5, invest: "$400", rate: "2.0× boost" },
            { name: "Elite Miner", level: 6, invest: "$450", rate: "2.5× boost" },
            { name: "Sovereign", level: 7, invest: "$500+", rate: "3.0× boost" },
          ].map((lv) => (
            <div key={lv.level} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.025] border border-white/[0.05]">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 bg-primary/[0.15] text-primary">{lv.level}</span>
              <div className="flex-1">
                <p className="text-xs font-bold text-white">{lv.name}</p>
                <p className="text-[10px] text-white/35">{lv.rate}</p>
              </div>
              <p className="text-xs font-mono text-white/50">{lv.invest}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl p-3 space-y-1.5 bg-primary/[0.06] border border-primary/[0.15]">
          <p className="text-white font-semibold text-xs">Key Features</p>
          <p>· KYC Verification — unlocks withdrawals & commissions</p>
          <p>· 2-Tier Referral System — 15% USDT + gem commissions</p>
          <p>· Dynamic Halving — gem-to-PTC rate adjusts with volume</p>
          <p>· 24-hour mining sessions for paid levels</p>
        </div>
      </div>
    ) },
];

export default function Profile() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: user } = useGetMe();
  const { data: wallet } = useGetWallet();
  const { data: referralData } = useGetReferrals();
  const { mutate: logout } = useLogout();
  const [activeDoc, setActiveDoc] = useState<string | null>(null);

  if (!user) return null;

  const isVerified = (wallet as any)?.isVerified ?? (user as any)?.isKycVerified ?? false;
  const verifiedAt = (wallet as any)?.verifiedAt ?? (user as any)?.kycVerifiedAt ?? null;
  const gemBalance = wallet?.gemsBalance ?? 0;
  const ptcBalance = wallet?.etrBalance ?? 0;
  const usdtBalance = wallet?.usdtBalance ?? 0;
  const level = (user as any).currentLevel ?? 0;
  const initials = user.username.slice(0, 2).toUpperCase();

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        localStorage.removeItem("etr_token");
        navigate("/login");
      },
    });
  };

  const activeDocItem = DOC_PAGES.find((d) => d.id === activeDoc);

  return (
    <div className="max-w-md mx-auto px-4 py-5 pb-28 space-y-5">

      {/* Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden bg-[#0b0c10] border border-white/[0.06]"
      >
        <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl pointer-events-none bg-primary/[0.05]" />

        <div className="relative p-5">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-2xl font-black select-none bg-gradient-to-br from-primary/20 to-primary/[0.08] border border-primary/25 text-primary">
                {initials}
              </div>
              {isVerified && (
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center bg-emerald-600 border-2 border-[#0b0c10]">
                  <ShieldCheck size={12} color="#fff" strokeWidth={2.5} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white tracking-tight leading-none">{user.username}</h2>
                {user.isAdmin && <Badge variant="orange"><Star size={8} /> Admin</Badge>}
              </div>
              <p className="text-[11px] font-mono text-white/25 mt-1">ID #{user.id}</p>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <Badge variant={isVerified ? "green" : "neutral"}>
                  <ShieldCheck size={9} /> {isVerified ? "Verified" : "Unverified"}
                </Badge>
                <Badge variant={user.isActive ? "green" : "neutral"}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" /> {user.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="orange"><Star size={8} /> {LEVEL_NAMES[Math.min(level, LEVEL_NAMES.length - 1)]}</Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/[0.05]">
            {[
              { label: "Gems", value: formatGems(gemBalance), accent: true },
              { label: "PTC", value: ptcBalance.toFixed(2), accent: false },
              { label: "USDT", value: `$${usdtBalance.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, accent: false },
            ].map((b, i) => (
              <div key={i} className={cn(
                "rounded-2xl px-3 py-3 flex flex-col gap-1.5 border",
                b.accent ? "bg-primary/[0.06] border-primary/[0.15]" : "bg-white/[0.025] border-white/[0.06]"
              )}>
                <span className={cn("text-[9px] uppercase tracking-[0.15em] font-semibold", b.accent ? "text-primary/70" : "text-white/25")}>{b.label}</span>
                <span className={cn("text-sm font-black font-mono leading-none", b.accent ? "text-primary" : "text-white")}>{b.value}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Documents & Compliance */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-3xl overflow-hidden bg-[#0b0c10] border border-white/[0.06]"
      >
        <div className="px-5 pt-4 pb-3 border-b border-white/[0.04]">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/25 font-semibold">Documents & Compliance</p>
          <p className="text-xs text-white/40 mt-1">Legal, policies, and platform details</p>
        </div>
        <div className="p-2">
          {DOC_PAGES.map((doc, i) => (
            <button
              key={doc.id}
              onClick={() => setActiveDoc(doc.id)}
              className={cn(
                "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl hover:bg-white/[0.04] transition-colors text-left",
                i !== DOC_PAGES.length - 1 && "mb-1"
              )}
            >
              <div className="w-9 h-9 rounded-xl bg-primary/[0.08] border border-primary/[0.15] flex items-center justify-center text-primary/80">
                <doc.icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-white leading-tight">{doc.label}</p>
              </div>
              <ChevronRight size={14} className="text-white/20 shrink-0" />
            </button>
          ))}
        </div>
      </motion.div>

      {/* KYC / Account Status */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-3xl overflow-hidden bg-[#0b0c10] border border-white/[0.06]"
      >
        <div className="px-5 pt-4 pb-3 border-b border-white/[0.04]">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/25 font-semibold">Account Status</p>
        </div>
        <div className="p-5 space-y-5">
          {isVerified ? (
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck size={24} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-base font-bold text-white">KYC Verified</p>
                <p className="text-xs text-white/40 mt-0.5">
                  {verifiedAt ? `Verified on ${format(new Date(verifiedAt), "MMMM d, yyyy")}` : "Your account is fully verified."}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                <Lock size={22} className="text-white/40" />
              </div>
              <div>
                <p className="text-base font-bold text-white">Verification Required</p>
                <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
                  Complete KYC to unlock withdrawals, transfers, and referral commissions.
                </p>
              </div>
            </div>
          )}

          <div className="rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.06]">
            <p className="px-4 pt-3 pb-2 text-[10px] text-white/30 uppercase tracking-widest font-semibold border-b border-white/[0.04]">
              {isVerified ? "Verified Benefits" : "What KYC Unlocks"}
            </p>
            <div className="px-4 divide-y divide-white/[0.04]">
              {KYC_BENEFITS.map((b, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Check size={11} className="text-primary" />
                  </div>
                  <span className="text-sm text-white/70">{b}</span>
                </div>
              ))}
            </div>
          </div>

          {!isVerified && (
            <button
              onClick={() => navigate("/verify")}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-black font-bold text-sm hover:brightness-105 transition-all"
            >
              <ShieldCheck size={16} />
              Complete KYC Verification — {KYC_COST} PTC
            </button>
          )}
        </div>
      </motion.div>

      {/* Account Details */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="rounded-3xl overflow-hidden bg-[#0b0c10] border border-white/[0.06]"
      >
        <div className="px-5 pt-4 pb-3 border-b border-white/[0.04]">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/25 font-semibold">Account Details</p>
        </div>
        <div className="px-5 pb-2">
          <InfoRow
            icon={<User size={13} />}
            label="Username"
            valueNode={
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[13px] font-semibold text-white">{user.username}</span>
                <CopyBtn text={user.username} />
              </div>
            }
          />
          <InfoRow
            icon={<Globe size={13} />}
            label="User ID"
            valueNode={
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[13px] font-semibold font-mono text-white/70">#{user.id}</span>
                <CopyBtn text={String(user.id)} />
              </div>
            }
          />
          <InfoRow icon={<Calendar size={13} />} label="Member Since" value={format(new Date(user.createdAt), "MMMM d, yyyy")} />
          <InfoRow
            icon={<Star size={13} />}
            label="Mining Level"
            value={`Level ${level} — ${LEVEL_NAMES[Math.min(level, LEVEL_NAMES.length - 1)]}`}
          />
          <InfoRow
            icon={<ShieldCheck size={13} />}
            label="KYC Status"
            valueNode={
              <div className="flex items-center gap-2 mt-0.5">
                {isVerified ? (
                  <span className="text-[13px] font-semibold text-emerald-400">Verified</span>
                ) : (
                  <button onClick={() => navigate("/verify")} className="flex items-center gap-1 text-[12px] font-semibold text-primary">
                    Not verified — Complete KYC <ArrowUpRight size={11} />
                  </button>
                )}
              </div>
            }
          />
          <InfoRow
            icon={<Wallet size={13} />}
            label="Total Deposited"
            value={`$${((user as any).totalDepositUsdt ?? 0).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`}
            noBorder
          />
        </div>
      </motion.div>

      {/* Sign Out */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-sm font-bold transition-all hover:brightness-110 bg-red-500/[0.06] border border-red-500/[0.12] text-red-400/80"
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </motion.div>

      {/* Document Sheet */}
      <DocumentSheet
        open={!!activeDoc}
        onClose={() => setActiveDoc(null)}
        title={activeDocItem?.label ?? ""}
      >
        {activeDocItem?.content}
      </DocumentSheet>
    </div>
  );
}
