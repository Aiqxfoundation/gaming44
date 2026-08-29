import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { notify } from "@/lib/notify";
import { cn, formatGems } from "@/lib/utils";
import {
  useGetEixWallet,
  useGetPowerCards,
  useGetMyPowerCards,
  useUnlockPowerCard,
  useUpgradePowerCard,
  type PowerCardCatalogItem,
  type OwnedPowerCard,
} from "@workspace/api-client-react";
import { Zap, Lock, ArrowUp, Sparkles, Coins } from "lucide-react";

const TIER_STYLES: Record<string, string> = {
  common: "border-white/15 text-white/60",
  rare: "border-blue-500/30 text-blue-400",
  epic: "border-purple-500/30 text-purple-400",
  legendary: "border-orange-500/40 text-orange-400",
};

export default function PowerCardsPage() {
  const queryClient = useQueryClient();
  const { data: eixWallet } = useGetEixWallet();
  const { data: catalog } = useGetPowerCards();
  const { data: mine } = useGetMyPowerCards();
  const { mutate: unlock, isPending: unlocking } = useUnlockPowerCard();
  const { mutate: upgrade, isPending: upgrading } = useUpgradePowerCard();

  const [view, setView] = useState<"owned" | "shop">("owned");

  const eixBalance = eixWallet?.eixBalance ?? 0;
  const totalPower = mine?.totalPower ?? 0;
  const ownedIds = new Set((mine?.cards ?? []).map((c) => c.cardId));

  const handleUnlock = (card: PowerCardCatalogItem) => {
    if (eixBalance < card.eixCost) { notify.error("Insufficient EIX", `You need ${card.eixCost} EIX to unlock this card.`); return; }
    unlock(
      { id: card.id },
      {
        onSuccess: (data) => {
          notify.success("Power Card Unlocked!", `${card.name} is now active. +${card.powerValue} Power.`);
          queryClient.invalidateQueries({ queryKey: ["/api/power-cards/mine"] });
          queryClient.invalidateQueries({ queryKey: ["/api/eix/wallet"] });
          queryClient.invalidateQueries({ queryKey: ["/api/mining/status"] });
        },
        onError: (err: any) => notify.error("Unlock Failed", err.message),
      }
    );
  };

  const handleUpgrade = (card: OwnedPowerCard) => {
    if (eixBalance < card.upgradeEixCost) { notify.error("Insufficient EIX", `You need ${card.upgradeEixCost} EIX to upgrade.`); return; }
    upgrade(
      { ownedId: card.id },
      {
        onSuccess: () => {
          notify.success("Card Upgraded!", `${card.name} is now level ${card.upgradeLevel + 1}.`);
          queryClient.invalidateQueries({ queryKey: ["/api/power-cards/mine"] });
          queryClient.invalidateQueries({ queryKey: ["/api/eix/wallet"] });
          queryClient.invalidateQueries({ queryKey: ["/api/mining/status"] });
        },
        onError: (err: any) => notify.error("Upgrade Failed", err.message),
      }
    );
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Power hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-6 border border-orange-500/20"
        style={{ background: "linear-gradient(135deg, rgba(255,149,0,0.10) 0%, rgba(10,11,17,0.6) 60%)" }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-orange-400/80">Mining Power</span>
          <span className="text-xs text-white/40 font-mono">{eixBalance.toFixed(2)} EIX</span>
        </div>
        <div className="flex items-end gap-2 mt-2">
          <Zap className="text-orange-400 mb-1" size={32} />
          <span className="text-4xl font-black text-white font-mono">{formatGems(Math.floor(totalPower))}</span>
          <span className="text-sm text-white/40 mb-1.5">total power</span>
        </div>
        <p className="text-xs text-white/40 mt-1">{mine?.cardCount ?? 0} active Power Cards • boosts gem mining</p>
      </motion.div>

      {/* Toggle */}
      <div className="flex rounded-xl bg-card border border-border p-1">
        <button
          onClick={() => setView("owned")}
          className={cn("flex-1 h-9 rounded-lg text-xs font-bold transition-all",
            view === "owned" ? "bg-orange-500 text-black" : "text-white/50")}
        >My Cards ({mine?.cardCount ?? 0})</button>
        <button
          onClick={() => setView("shop")}
          className={cn("flex-1 h-9 rounded-lg text-xs font-bold transition-all",
            view === "shop" ? "bg-orange-500 text-black" : "text-white/50")}
        >Card Shop</button>
      </div>

      {view === "owned" && (
        <div className="space-y-3">
          {(mine?.cards ?? []).length === 0 && (
            <div className="text-center py-12">
              <Lock className="mx-auto text-white/20 mb-3" size={40} />
              <p className="text-sm text-white/40">No Power Cards yet.</p>
              <button onClick={() => setView("shop")} className="mt-3 text-xs text-orange-400 font-bold">Browse the Card Shop →</button>
            </div>
          )}
          {(mine?.cards ?? []).map((card) => {
            const maxed = card.upgradeLevel >= card.maxUpgradeLevel;
            return (
              <div key={card.id} className={cn("rounded-2xl border p-4 bg-card", TIER_STYLES[card.tier] ?? TIER_STYLES.common)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-400">
                      <Zap size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{card.name}</p>
                      <p className="text-[10px] uppercase tracking-widest text-white/40">{card.code} • Lv {card.upgradeLevel}/{card.maxUpgradeLevel}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-orange-400 font-mono">{formatGems(Math.floor(card.currentPower))}</p>
                    <p className="text-[10px] text-white/40">power</p>
                  </div>
                </div>
                {card.description && <p className="text-xs text-white/50 mt-2">{card.description}</p>}
                <button
                  onClick={() => handleUpgrade(card)} disabled={maxed || upgrading}
                  className={cn("mt-3 w-full h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
                    maxed ? "bg-white/5 text-white/30" : "bg-orange-500/15 text-orange-400 hover:bg-orange-500 hover:text-black")}
                >
                  {maxed ? "Max Level Reached" : <><ArrowUp size={13} /> Upgrade • {card.upgradeEixCost} EIX</>}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {view === "shop" && (
        <div className="space-y-3">
          {(catalog ?? []).length === 0 && (
            <div className="text-center py-12">
              <Sparkles className="mx-auto text-white/20 mb-3" size={40} />
              <p className="text-sm text-white/40">No Power Cards available yet. Check back soon.</p>
            </div>
          )}
          {(catalog ?? []).map((card) => {
            const owned = ownedIds.has(card.id);
            return (
              <div key={card.id} className={cn("rounded-2xl border p-4 bg-card", TIER_STYLES[card.tier] ?? TIER_STYLES.common)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-400">
                      <Zap size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{card.name}</p>
                      <p className="text-[10px] uppercase tracking-widest text-white/40">{card.code} • {card.tier}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-orange-400 font-mono">+{formatGems(Math.floor(card.powerValue))}</p>
                    <p className="text-[10px] text-white/40">power</p>
                  </div>
                </div>
                {card.description && <p className="text-xs text-white/50 mt-2">{card.description}</p>}
                <button
                  onClick={() => handleUnlock(card)} disabled={owned || unlocking}
                  className={cn("mt-3 w-full h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
                    owned ? "bg-emerald-500/10 text-emerald-400" : "bg-orange-500 text-black hover:from-orange-600")}
                >
                  {owned ? "✓ Owned" : <><Coins size={13} /> Unlock • {card.eixCost} EIX</>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
