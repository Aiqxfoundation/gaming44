import React from "react";
import { motion } from "framer-motion";
import { Zap, ArrowUp, Lock, Coins } from "lucide-react";
import { cn, formatGems } from "@/lib/utils";

export interface PowerCardData {
  id: number;
  code: string;
  name: string;
  description: string;
  powerValue: number;
  eixCost: number;
  upgradeEixCost: number;
  maxUpgradeLevel: number;
  tier: string;
  imageUrl: string | null;
  upgradeLevel?: number;
  currentPower?: number;
}

const TIER_CONFIG: Record<string, { border: string; glow: string; bg: string; label: string; text: string }> = {
  common:    { border: "rgba(255,255,255,0.12)", glow: "rgba(255,255,255,0.04)", bg: "linear-gradient(160deg, #0d0e15 0%, #111320 100%)", label: "COMMON",    text: "rgba(255,255,255,0.5)" },
  rare:      { border: "rgba(59,130,246,0.3)",   glow: "rgba(59,130,246,0.08)",  bg: "linear-gradient(160deg, #0d1018 0%, #121828 100%)", label: "RARE",      text: "#60a5fa" },
  epic:      { border: "rgba(168,85,247,0.3)",   glow: "rgba(168,85,247,0.08)",  bg: "linear-gradient(160deg, #100d18 0%, #181228 100%)", label: "EPIC",      text: "#c084fc" },
  legendary: { border: "rgba(249,115,22,0.35)",  glow: "rgba(249,115,22,0.1)",   bg: "linear-gradient(160deg, #15100c 0%, #1e160e 100%)", label: "LEGENDARY", text: "#fb923c" },
};

export function PowerCard({
  card, owned = false, onAction, actionLabel, actionDisabled, maxed, loading,
}: {
  card: PowerCardData;
  owned?: boolean;
  onAction?: () => void;
  actionLabel?: React.ReactNode;
  actionDisabled?: boolean;
  maxed?: boolean;
  loading?: boolean;
}) {
  const tier = TIER_CONFIG[card.tier] ?? TIER_CONFIG.common;
  const level = card.upgradeLevel ?? 1;
  const power = owned ? (card.currentPower ?? card.powerValue * level) : card.powerValue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl overflow-hidden"
      style={{ background: tier.bg, border: `1px solid ${tier.border}`, boxShadow: `0 4px 20px ${tier.glow}` }}
    >
      {/* Tier strip */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2" style={{ borderBottom: `1px solid ${tier.border}` }}>
        <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: tier.text }}>{tier.label}</span>
        <span className="text-[9px] font-mono text-white/30">{card.code}</span>
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Power icon */}
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 relative"
            style={{ background: `rgba(249,115,22,0.1)`, border: `1px solid ${tier.border}` }}>
            <Zap size={26} style={{ color: tier.text }} fill="currentColor" fillOpacity={0.15} />
            {owned && (
              <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
                style={{ background: "#0a0b12", border: `1px solid ${tier.border}`, color: tier.text }}>
                {level}
              </span>
            )}
          </div>

          {/* Name + power */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-tight">{card.name}</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black font-mono" style={{ color: tier.text }}>{formatGems(Math.floor(power))}</span>
              <span className="text-[10px] text-white/40 font-bold uppercase">power</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {card.description && (
          <p className="text-xs text-white/40 mt-3 leading-relaxed">{card.description}</p>
        )}

        {/* Upgrade level bar (owned only) */}
        {owned && (
          <div className="mt-3 flex items-center gap-1">
            {Array.from({ length: card.maxUpgradeLevel }).map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full"
                style={{ background: i < level ? tier.text : "rgba(255,255,255,0.06)" }} />
            ))}
          </div>
        )}

        {/* Action button */}
        {onAction && (
          <button
            onClick={onAction}
            disabled={actionDisabled || loading}
            className={cn(
              "mt-4 w-full h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
              actionDisabled
                ? "bg-white/5 text-white/30 cursor-default"
                : "bg-orange-500 text-black hover:brightness-110"
            )}
          >
            {loading ? (
              <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="w-3.5 h-3.5 rounded-full border-2 border-black/30 border-t-black" />Processing…</>
            ) : maxed ? (
              "Max Level Reached"
            ) : actionLabel
            }
          </button>
        )}
      </div>
    </motion.div>
  );
}
