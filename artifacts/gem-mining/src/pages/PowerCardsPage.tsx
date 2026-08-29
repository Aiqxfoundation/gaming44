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
import { Zap, Lock, ArrowUp, Sparkles, Coins, Gauge } from "lucide-react";
import { PowerCard } from "@/components/PowerCard";

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
        onSuccess: () => {
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
        className="relative overflow-hidden rounded-3xl p-6 border border-orange-500/20"
        style={{ background: "linear-gradient(135deg, rgba(255,149,0,0.10) 0%, rgba(10,11,17,0.6) 60%)" }}
      >
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,149,0,0.06)" }} />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-orange-400/80">Mining Power</span>
            <span className="text-xs text-white/40 font-mono">{eixBalance.toFixed(2)} EIX</span>
          </div>
          <div className="flex items-end gap-2 mt-2">
            <Zap className="text-orange-400 mb-1" size={32} fill="currentColor" fillOpacity={0.2} />
            <span className="text-4xl font-black text-white font-mono">{formatGems(Math.floor(totalPower))}</span>
            <span className="text-sm text-white/40 mb-1.5">total power</span>
          </div>
          <p className="text-xs text-white/40 mt-1">{mine?.cardCount ?? 0} active Power Cards · more power = more gems</p>
        </div>
      </motion.div>

      {/* Power & Execution info strip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="flex items-center gap-3 rounded-2xl p-4"
        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.15)" }}>
          <Gauge size={18} className="text-orange-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">More Execution = More Power</p>
          <p className="text-[11px] text-white/40 mt-0.5">Unlock & upgrade cards to boost your gem mining rate</p>
        </div>
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

      {/* Owned cards */}
      {view === "owned" && (
        <div className="space-y-4">
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
              <PowerCard
                key={card.id}
                card={card}
                owned
                maxed={maxed}
                loading={upgrading}
                onAction={() => handleUpgrade(card)}
                actionLabel={<><ArrowUp size={13} /> Upgrade • {card.upgradeEixCost} EIX</>}
              />
            );
          })}
        </div>
      )}

      {/* Shop cards */}
      {view === "shop" && (
        <div className="space-y-4">
          {(catalog ?? []).length === 0 && (
            <div className="text-center py-12">
              <Sparkles className="mx-auto text-white/20 mb-3" size={40} />
              <p className="text-sm text-white/40">No Power Cards available yet. Check back soon.</p>
            </div>
          )}
          {(catalog ?? []).map((card) => {
            const owned = ownedIds.has(card.id);
            return (
              <PowerCard
                key={card.id}
                card={card}
                actionDisabled={owned}
                loading={unlocking}
                onAction={() => handleUnlock(card)}
                actionLabel={owned ? "✓ Owned" : <><Coins size={13} /> Unlock • {card.eixCost} EIX</>}
              />
            );
          })}
        </div>
      )}

    </div>
  );
}
