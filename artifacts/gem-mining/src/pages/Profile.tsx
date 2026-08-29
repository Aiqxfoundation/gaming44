import React, { useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { notify } from "@/lib/notify";
import { useLocation } from "wouter";
import { useGetMe, useGetWallet, useGetEixWallet, useGetReferrals, useLogout } from "@workspace/api-client-react";
import {
  Copy, CheckCheck, Calendar, ShieldCheck, Shield, Users,
  Lock, LogOut, ChevronRight, X, User, Globe, Star, ArrowUpRight, Check,
  Info, FileText, BookOpen, ScrollText, ShieldCheck as ShieldCheckIcon, Zap, Gift, Coins,
} from "lucide-react";
import { GemIcon } from "@/components/GemIcon";
import { EixLogo } from "@/components/EixLogo";
import { EcosystemInfo } from "@/components/EcosystemInfo";
import { formatGems, cn } from "@/lib/utils";

const VERIFICATION_EIX_COST = 20;

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

function Badge({ children, variant = "neutral" }: { children: React.ReactNode; variant?: "green" | "orange" | "neutral" }) {
  const map = {
    green: { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.2)", text: "#4ade80" },
    orange: { bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.2)", text: "#f97316" },
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
  { id: "about", label: "About EthicX", icon: Info,
    content: (
      <div className="space-y-4 text-sm text-white/60 leading-relaxed">
        <p><span className="text-white font-semibold">EthicX (EIX)</span> is a next-generation mining ecosystem where users buy EIX, unlock Power Cards, mine Gems, and contribute to partner project airdrops.</p>
        <div className="rounded-2xl p-4 space-y-2 bg-orange-500/[0.06] border border-orange-500/[0.15]">
          <p className="text-white font-semibold text-xs uppercase tracking-widest">Core Facts</p>
          <p>· EIX Token: $10 fixed value — ecosystem fuel</p>
          <p>· Power Cards: Unique codes, upgradeable, expandable</p>
          <p>· Gems: Mined based on your total power</p>
          <p>· Airdrop Farming: Contribute gems to earn partner tokens</p>
          <p>· Referral: 2-tier EIX & gem commission system</p>
        </div>
        <p>Our mission is to create a sustainable, transparent, and rewarding ecosystem where every participant can grow their digital wealth through mining, power cards, and partner project rewards.</p>
      </div>
    ) },
  { id: "privacy", label: "Privacy Policy", icon: Shield,
    content: (
      <div className="space-y-4 text-sm text-white/60 leading-relaxed">
        <p className="text-white/40 text-xs">Last updated: August 2026</p>
        <p><span className="text-white font-semibold">Data We Collect:</span> Username, hashed password, recovery information, referral linkage, and activity timestamps. We do not collect real names, email addresses, or government IDs through the platform interface.</p>
        <p><span className="text-white font-semibold">Verification:</span> Verification badge is a voluntary action that unlocks full ecosystem access. Verification status is stored securely.</p>
        <p><span className="text-white font-semibold">Data Storage:</span> All data is stored in encrypted databases. Transaction screenshots submitted for EIX purchases are stored temporarily and purged after admin review.</p>
        <p><span className="text-white font-semibold">Third Parties:</span> We do not sell or share your data with third parties.</p>
        <p><span className="text-white font-semibold">Your Rights:</span> You may request account deletion at any time.</p>
      </div>
    ) },
  { id: "terms", label: "Terms of Service", icon: ScrollText,
    content: (
      <div className="space-y-4 text-sm text-white/60 leading-relaxed">
        <p className="text-white/40 text-xs">Last updated: August 2026</p>
        <p><span className="text-white font-semibold">1. Eligibility:</span> You must be 18+ years old to use EthicX. Use is prohibited where restricted by local laws.</p>
        <p><span className="text-white font-semibold">2. EIX & Mining:</span> EIX is purchased at a fixed $10 value. Mining rates and session durations are subject to change. Gem accumulation is based on real-time calculations.</p>
        <p><span className="text-white font-semibold">3. Power Cards:</span> Power Cards are purchased with EIX and provide mining power. Cards are upgradeable and expandable.</p>
        <p><span className="text-white font-semibold">4. Airdrop Rewards:</span> Partner token rewards are distributed based on your gem contribution share to each block.</p>
        <p><span className="text-white font-semibold">5. Referral Commissions:</span> EIX commissions (10%) are credited upon EIX purchase. Gem commissions are locked until both parties complete verification.</p>
        <p><span className="text-white font-semibold">6. Risk Disclaimer:</span> Cryptocurrency investments carry inherent risk. EthicX is not a financial advisor.</p>
      </div>
    ) },
  { id: "verify-policy", label: "Verification Policy", icon: ShieldCheckIcon,
    content: (
      <div className="space-y-4 text-sm text-white/60 leading-relaxed">
        <p><span className="text-white font-semibold">Voluntary Verification:</span> Verification is a one-time action that unlocks the full feature set of the ecosystem. It is not required to mine, but it is required to claim referral commissions and access full ecosystem features.</p>
        <p><span className="text-white font-semibold">Badge Cost:</span> The verification badge costs {VERIFICATION_EIX_COST} EIX and is deducted from your balance instantly.</p>
        <p><span className="text-white font-semibold">What It Unlocks:</span> Full ecosystem access, partner token rewards claimable, verified badge on your profile, and referral commission payouts.</p>
        <p><span className="text-white font-semibold">Security:</span> Verification status is stored securely and cannot be revoked. We do not collect government IDs through the platform interface.</p>
      </div>
    ) },
];

export default function Profile() {
  const [, navigate] = useLocation();
  const { data: user } = useGetMe();
  const { data: wallet } = useGetWallet();
  const { data: eixWallet } = useGetEixWallet();
  const { data: referralData } = useGetReferrals();
  const { mutate: logout } = useLogout();
  const [activeDoc, setActiveDoc] = useState<string | null>(null);

  if (!user) return null;

  const isVerified = (wallet as any)?.isVerified ?? (user as any)?.isKycVerified ?? false;
  const verifiedAt = (wallet as any)?.verifiedAt ?? (user as any)?.kycVerifiedAt ?? null;
  const gemBalance = wallet?.gemsBalance ?? 0;
  const eixBalance = eixWallet?.eixBalance ?? 0;
  const powerCardPower = eixWallet?.powerCardPower ?? 0;
  const totalAirdropRewards = eixWallet?.totalAirdropRewards ?? 0;
  const totalReferrals = referralData?.totalReferrals ?? 0;
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
        <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl pointer-events-none bg-orange-500/[0.05]" />

        <div className="relative p-5">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-2xl font-black select-none bg-gradient-to-br from-orange-500/20 to-orange-500/[0.08] border border-orange-500/25 text-orange-400">
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
              </div>
            </div>
          </div>

          {/* Ecosystem Stats */}
          <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-white/[0.05]">
            {[
              { label: "EIX", value: formatGems(Math.floor(eixBalance)), icon: <EixLogo size={14} />, accent: true },
              { label: "Power", value: formatGems(Math.floor(powerCardPower)), icon: <Zap size={14} className="text-orange-400" />, accent: false },
              { label: "Gems", value: formatGems(gemBalance), icon: <GemIcon size={14} />, accent: false },
              { label: "Rewards", value: formatGems(Math.floor(totalAirdropRewards)), icon: <Gift size={14} className="text-emerald-400" />, accent: false },
            ].map((b, i) => (
              <div key={i} className={cn(
                "rounded-2xl px-3 py-3 flex items-center gap-2.5 border",
                b.accent ? "bg-orange-500/[0.06] border-orange-500/[0.15]" : "bg-white/[0.025] border-white/[0.06]"
              )}>
                <div className="shrink-0">{b.icon}</div>
                <div>
                  <span className={cn("text-[9px] uppercase tracking-[0.15em] font-semibold block", b.accent ? "text-orange-400/70" : "text-white/25")}>{b.label}</span>
                  <span className={cn("text-sm font-black font-mono leading-none", b.accent ? "text-orange-400" : "text-white")}>{b.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Ecosystem Architecture Info */}
      <EcosystemInfo />

      {/* Documents */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-3xl overflow-hidden bg-[#0b0c10] border border-white/[0.06]"
      >
        <div className="px-5 pt-4 pb-3 border-b border-white/[0.04]">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/25 font-semibold">Documents & Compliance</p>
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
              <div className="w-9 h-9 rounded-xl bg-orange-500/[0.08] border border-orange-500/[0.15] flex items-center justify-center text-orange-400/80">
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

      {/* Verification Status */}
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
                <p className="text-base font-bold text-white">Verified Miner</p>
                <p className="text-xs text-white/40 mt-0.5">
                  {verifiedAt ? `Verified on ${format(new Date(verifiedAt), "MMMM d, yyyy")}` : "Full ecosystem access unlocked."}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                  <Lock size={22} className="text-white/40" />
                </div>
                <div>
                  <p className="text-base font-bold text-white">Verification Required</p>
                  <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
                    Mint your Verification Badge to unlock full ecosystem access, referral commissions, and partner token claims.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/verify")}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-orange-500 text-black font-bold text-sm hover:brightness-105 transition-all"
              >
                <ShieldCheck size={16} />
                Mint Verification Badge — {VERIFICATION_EIX_COST} EIX
              </button>
            </>
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
          <div className="flex items-center gap-3 py-3.5 border-b border-white/[0.04]">
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30">
              <User size={13} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/25 font-semibold">Username</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[13px] font-semibold text-white">{user.username}</span>
                <CopyBtn text={user.username} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 py-3.5 border-b border-white/[0.04]">
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30">
              <Globe size={13} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/25 font-semibold">User ID</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[13px] font-semibold font-mono text-white/70">#{user.id}</span>
                <CopyBtn text={String(user.id)} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 py-3.5 border-b border-white/[0.04]">
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30">
              <Calendar size={13} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/25 font-semibold">Member Since</p>
              <p className="text-[13px] font-semibold mt-0.5 text-white">{format(new Date(user.createdAt), "MMMM d, yyyy")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-3.5 border-b border-white/[0.04]">
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30">
              <Users size={13} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/25 font-semibold">Team Members</p>
              <p className="text-[13px] font-semibold mt-0.5 text-white">{totalReferrals} referrals</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-3.5">
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30">
              <ShieldCheck size={13} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/25 font-semibold">Verification</p>
              <div className="flex items-center gap-2 mt-0.5">
                {isVerified ? (
                  <span className="text-[13px] font-semibold text-emerald-400">Verified</span>
                ) : (
                  <button onClick={() => navigate("/verify")} className="flex items-center gap-1 text-[12px] font-semibold text-orange-400">
                    Not verified — Mint Badge <ArrowUpRight size={11} />
                  </button>
                )}
              </div>
            </div>
          </div>
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
