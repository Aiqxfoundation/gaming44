import React from "react";
import { motion } from "framer-motion";
import {
  Zap, RefreshCw, Lock, DollarSign, Users, TrendingUp,
  ArrowDown, ThumbsUp, Gift, BadgeCheck, Globe, BarChart3,
} from "lucide-react";

const VALUE_BOXES = [
  { icon: Zap,       title: "Utility Demand",    desc: "EIX is required for Power Cards, verification & ecosystem actions" },
  { icon: RefreshCw, title: "Continuous Usage",  desc: "Every mining session & card upgrade consumes EIX utility" },
  { icon: Lock,      title: "Limited Supply",    desc: "Fixed supply of 2,100,000 EIX — no inflation, no minting" },
  { icon: DollarSign,title: "Revenue Backing",    desc: "Ecosystem revenue funds EIX value & project development" },
  { icon: Users,     title: "Partner Projects",   desc: "More projects join → more users → more EIX demand" },
  { icon: TrendingUp,title: "Rewards & Growth",   desc: "Airdrop farming & referral rewards drive continuous growth" },
];

const KEY_BENEFITS = [
  { icon: DollarSign,  label: "Low Entry" },
  { icon: ThumbsUp,    label: "High Earning" },
  { icon: Gift,        label: "Daily Rewards" },
  { icon: BadgeCheck,  label: "Real Utility" },
  { icon: Globe,       label: "Global Ecosystem" },
  { icon: BarChart3,   label: "Scalable" },
];

export function EcosystemInfo() {
  return (
    <div className="space-y-5">

      {/* How EthicX Creates Value */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl overflow-hidden bg-[#0b0c10] border border-white/[0.06]"
      >
        <div className="px-5 pt-4 pb-3 border-b border-white/[0.04]">
          <p className="text-[10px] uppercase tracking-[0.18em] text-orange-400/70 font-semibold">How EthicX Creates Value</p>
          <p className="text-xs text-white/40 mt-1">The engine behind EIX demand</p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-white/[0.04]">
          {VALUE_BOXES.map((box, i) => (
            <div key={i} className="bg-[#0b0c10] p-4 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.12)" }}>
                <box.icon size={15} className="text-orange-400" />
              </div>
              <p className="text-xs font-bold text-white leading-tight">{box.title}</p>
              <p className="text-[10px] text-white/35 leading-relaxed">{box.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Distribution Goal */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-3xl p-5 border border-orange-500/15"
        style={{ background: "linear-gradient(135deg, rgba(255,149,0,0.06) 0%, rgba(10,11,17,0.4) 60%)" }}
      >
        <p className="text-[10px] uppercase tracking-[0.18em] text-orange-400/70 font-semibold mb-3">Distribution Goal</p>
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 shrink-0">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="#f97316" strokeWidth="6"
                strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 34 * 0.4} ${2 * Math.PI * 34 * 0.6}`}
                transform="rotate(-90 40 40)" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-orange-400">40%</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">840,000 EIX distributed</p>
            <p className="text-xs text-white/40 mt-0.5">of 2,100,000 total EIX supply allocated to the community</p>
          </div>
        </div>
      </motion.div>

      {/* Key Benefits */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-3xl overflow-hidden bg-[#0b0c10] border border-white/[0.06]"
      >
        <div className="px-5 pt-4 pb-3 border-b border-white/[0.04]">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/25 font-semibold">Key Benefits for Users</p>
        </div>
        <div className="grid grid-cols-3 gap-px bg-white/[0.04]">
          {KEY_BENEFITS.map((b, i) => (
            <div key={i} className="bg-[#0b0c10] p-4 flex flex-col items-center gap-2 text-center">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.12)" }}>
                <b.icon size={16} className="text-orange-400" />
              </div>
              <span className="text-[10px] font-bold text-white/60">{b.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Economy Flow strip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="rounded-3xl p-5 bg-[#0b0c10] border border-white/[0.06]"
      >
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/25 font-semibold mb-3">Economy Flow</p>
        <div className="flex items-center justify-between text-white/40">
          {[
            { icon: Users, label: "User" },
            { icon: Zap, label: "Cards" },
            { icon: Zap, label: "Power" },
            { icon: ArrowDown, label: "Gems" },
            { icon: Gift, label: "Airdrop" },
            { icon: DollarSign, label: "Value" },
          ].map((step, i, arr) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.12)" }}>
                  <step.icon size={14} className="text-orange-400" />
                </div>
                <span className="text-[8px] text-white/30 font-semibold">{step.label}</span>
              </div>
              {i < arr.length - 1 && (
                <div className="h-px flex-1 min-w-2" style={{ background: "rgba(249,115,22,0.15)" }} />
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-[10px] text-white/30 text-center mt-4 leading-relaxed">
          Stronger Ecosystem → More Projects → More Users → More Demand for EIX → More Value
        </p>
      </motion.div>

    </div>
  );
}
