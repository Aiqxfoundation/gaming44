import { Router } from "express";
import { db, usersTable, eixDepositsTable, depositAddressesTable, airdropRewardsTable, eixReferralRewardsTable, gemContributionsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { getPowerCardPower } from "../lib/powerCards.js";

export const EIX_PRICE_USD = 10; // fixed $10 per EIX
const EIX_REFERRAL_COMMISSION_RATE = 0.10; // 10% of EIX purchase credited to upline

const router = Router();

// GET /eix/wallet — EIX balance, power, gems contributed, airdrop summary
router.get("/wallet", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const powerCardPower = await getPowerCardPower(user.id);

    const [contributedAgg] = await db
      .select({ total: sql<number>`coalesce(sum(gems_amount),0)` })
      .from(gemContributionsTable)
      .where(eq(gemContributionsTable.userId, user.id));

    const [rewardsAgg] = await db
      .select({ total: sql<number>`coalesce(sum(reward_amount),0)` })
      .from(airdropRewardsTable)
      .where(eq(airdropRewardsTable.userId, user.id));

    const [eixRefAgg] = await db
      .select({ total: sql<number>`coalesce(sum(eix_amount),0)` })
      .from(eixReferralRewardsTable)
      .where(and(eq(eixReferralRewardsTable.uplineUserId, user.id), eq(eixReferralRewardsTable.isClaimed, false)));

    res.json({
      eixBalance: user.eixBalance,
      eixPriceUsd: EIX_PRICE_USD,
      powerCardPower,
      totalGemsContributed: Number(contributedAgg?.total ?? 0),
      totalAirdropRewards: Number(rewardsAgg?.total ?? 0),
      claimableEixReferral: Number(eixRefAgg?.total ?? 0),
    });
  } catch (err) {
    console.error("EIX wallet error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /eix/deposit-addresses — active addresses for crypto deposits
router.get("/deposit-addresses", requireAuth, async (_req, res) => {
  try {
    const addresses = await db
      .select()
      .from(depositAddressesTable)
      .where(eq(depositAddressesTable.isActive, true));
    res.json(addresses.map((a) => ({
      id: a.id, address: a.address, label: a.label, network: a.network,
    })));
  } catch (err) {
    console.error("EIX addresses error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /eix/deposits — user's EIX purchase history
router.get("/deposits", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const deposits = await db
      .select()
      .from(eixDepositsTable)
      .where(eq(eixDepositsTable.userId, user.id))
      .orderBy(eixDepositsTable.createdAt);
    res.json(deposits.map((d) => ({
      id: d.id, currency: d.currency, amountCrypto: d.amountCrypto,
      amountUsd: d.amountUsd, eixAmount: d.eixAmount, status: d.status,
      txHash: d.txHash, assignedAddress: d.assignedAddress,
      hasScreenshot: !!d.screenshotData, createdAt: d.createdAt.toISOString(),
      approvedAt: d.approvedAt?.toISOString() ?? null,
    })));
  } catch (err) {
    console.error("EIX deposits error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /eix/deposits — submit a crypto deposit to buy EIX (admin approves)
router.post("/deposits", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { currency, amountUsd, amountCrypto, txHash, screenshotData, assignedAddress } = req.body;

    if (!currency || !["usdt", "btc", "sol", "eth"].includes(currency)) {
      res.status(400).json({ error: "Invalid currency" });
      return;
    }
    const usd = Number(amountUsd);
    if (!usd || usd < 10) {
      res.status(400).json({ error: "Minimum purchase is $10" });
      return;
    }
    if (!txHash && !screenshotData) {
      res.status(400).json({ error: "Provide a transaction hash or upload a payment screenshot." });
      return;
    }
    if (screenshotData) {
      if (typeof screenshotData !== "string" || !screenshotData.startsWith("data:image/")) {
        res.status(400).json({ error: "Invalid screenshot format." });
        return;
      }
      if (screenshotData.length > 7 * 1024 * 1024) {
        res.status(400).json({ error: "Screenshot too large (max 5 MB)." });
        return;
      }
    }

    const eixAmount = usd / EIX_PRICE_USD;

    const [deposit] = await db.insert(eixDepositsTable).values({
      userId: user.id, currency, amountCrypto: amountCrypto ? Number(amountCrypto) : null,
      amountUsd: usd, eixAmount, txHash: txHash?.trim() || null,
      screenshotData: screenshotData || null, assignedAddress: assignedAddress?.trim() || null,
    }).returning();

    res.status(201).json({
      id: deposit.id, currency: deposit.currency, amountUsd: deposit.amountUsd,
      eixAmount: deposit.eixAmount, status: deposit.status, createdAt: deposit.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("Create EIX deposit error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /eix/deposits/:id/screenshot
router.delete("/deposits/:id/screenshot", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const id = parseInt(req.params.id);
    const [deposit] = await db.select().from(eixDepositsTable)
      .where(and(eq(eixDepositsTable.id, id), eq(eixDepositsTable.userId, user.id)));
    if (!deposit) { res.status(404).json({ error: "Not found" }); return; }
    if (deposit.status !== "pending") { res.status(400).json({ error: "Cannot edit a processed deposit" }); return; }
    await db.update(eixDepositsTable).set({ screenshotData: null }).where(eq(eixDepositsTable.id, id));
    res.json({ message: "Screenshot removed" });
  } catch (err) {
    console.error("EIX delete screenshot error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /eix/referrals/claim — claim pending EIX referral rewards
router.post("/referrals/claim", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const rewards = await db.select().from(eixReferralRewardsTable)
      .where(and(eq(eixReferralRewardsTable.uplineUserId, user.id), eq(eixReferralRewardsTable.isClaimed, false)));
    if (!rewards.length) { res.status(400).json({ error: "No EIX referral rewards to claim." }); return; }

    const total = rewards.reduce((s, r) => s + r.eixAmount, 0);
    const now = new Date();
    for (const r of rewards) {
      await db.update(eixReferralRewardsTable).set({ isClaimed: true, claimedAt: now }).where(eq(eixReferralRewardsTable.id, r.id));
    }
    await db.update(usersTable).set({ eixBalance: user.eixBalance + total }).where(eq(usersTable.id, user.id));
    res.json({ claimedEix: total, newEixBalance: user.eixBalance + total });
  } catch (err) {
    console.error("Claim EIX referral error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /eix/referrals — EIX referral reward history
router.get("/referrals", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const rewards = await db.select().from(eixReferralRewardsTable)
      .where(eq(eixReferralRewardsTable.uplineUserId, user.id))
      .orderBy(eixReferralRewardsTable.createdAt);
    res.json(rewards.map((r) => ({
      id: r.id, refereeUserId: r.refereeUserId, eixAmount: r.eixAmount,
      reason: r.reason, isClaimed: r.isClaimed, createdAt: r.createdAt.toISOString(),
    })));
  } catch (err) {
    console.error("EIX referral history error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
