import { Router } from "express";
import { db, usersTable, eixDepositsTable, powerCardsTable, eixReferralRewardsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";

export const EIX_PRICE_USD = 10;
const EIX_REFERRAL_COMMISSION_RATE = 0.10;

const router = Router();

// ─── EIX DEPOSITS ──────────────────────────────────────────────────

// GET /admin/eix-deposits
router.get("/eix-deposits", requireAdmin, async (_req, res) => {
  try {
    const deposits = await db.select({
      id: eixDepositsTable.id,
      userId: eixDepositsTable.userId,
      username: usersTable.username,
      currency: eixDepositsTable.currency,
      amountCrypto: eixDepositsTable.amountCrypto,
      amountUsd: eixDepositsTable.amountUsd,
      eixAmount: eixDepositsTable.eixAmount,
      status: eixDepositsTable.status,
      txHash: eixDepositsTable.txHash,
      assignedAddress: eixDepositsTable.assignedAddress,
      hasScreenshot: sql`case when ${eixDepositsTable.screenshotData} is not null then true else false end`,
      screenshotData: eixDepositsTable.screenshotData,
      createdAt: eixDepositsTable.createdAt,
      approvedAt: eixDepositsTable.approvedAt,
    }).from(eixDepositsTable)
      .leftJoin(usersTable, eq(eixDepositsTable.userId, usersTable.id))
      .orderBy(eixDepositsTable.createdAt);

    res.json(deposits.map((d) => ({
      ...d,
      username: d.username || "Unknown",
      hasScreenshot: !!d.hasScreenshot,
      createdAt: d.createdAt.toISOString(),
      approvedAt: d.approvedAt?.toISOString() ?? null,
    })));
  } catch (err) {
    console.error("Admin EIX deposits error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/eix-deposits/:id/screenshot
router.get("/eix-deposits/:id/screenshot", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [d] = await db.select().from(eixDepositsTable).where(eq(eixDepositsTable.id, id));
    if (!d) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ screenshotData: d.screenshotData });
  } catch (err) {
    console.error("Admin EIX screenshot error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/eix-deposits/:id/approve — credit EIX + referral commission
router.post("/eix-deposits/:id/approve", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [deposit] = await db.select().from(eixDepositsTable).where(eq(eixDepositsTable.id, id));
    if (!deposit) { res.status(404).json({ error: "Deposit not found" }); return; }
    if (deposit.status !== "pending") { res.status(400).json({ error: "Deposit already processed" }); return; }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, deposit.userId));
    if (user) {
      await db.update(usersTable).set({
        eixBalance: user.eixBalance + deposit.eixAmount,
      }).where(eq(usersTable.id, user.id));

      // EIX referral commission — 10% to upline (anti-abuse: only credited, claimable separately)
      if (user.referredByUserId) {
        const commission = deposit.eixAmount * EIX_REFERRAL_COMMISSION_RATE;
        await db.insert(eixReferralRewardsTable).values({
          uplineUserId: user.referredByUserId as unknown as number,
          refereeUserId: user.id,
          eixAmount: commission,
          reason: "referral",
        });
      }
    }

    await db.update(eixDepositsTable).set({ status: "approved", approvedAt: new Date() }).where(eq(eixDepositsTable.id, id));
    res.json({ message: "EIX deposit approved" });
  } catch (err) {
    console.error("Admin approve EIX deposit error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/eix-deposits/:id/reject
router.post("/eix-deposits/:id/reject", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [deposit] = await db.select().from(eixDepositsTable).where(eq(eixDepositsTable.id, id));
    if (!deposit) { res.status(404).json({ error: "Deposit not found" }); return; }
    await db.update(eixDepositsTable).set({ status: "rejected" }).where(eq(eixDepositsTable.id, id));
    res.json({ message: "EIX deposit rejected" });
  } catch (err) {
    console.error("Admin reject EIX deposit error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POWER CARD CATALOG ────────────────────────────────────────────

// GET /admin/power-cards
router.get("/power-cards", requireAdmin, async (_req, res) => {
  try {
    const cards = await db.select().from(powerCardsTable).orderBy(powerCardsTable.createdAt);
    res.json(cards.map((c) => ({
      ...c, createdAt: c.createdAt.toISOString(),
    })));
  } catch (err) {
    console.error("Admin power cards error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/power-cards
router.post("/power-cards", requireAdmin, async (req, res) => {
  try {
    const { code, name, description, powerValue, eixCost, upgradeEixCost, maxUpgradeLevel, tier, imageUrl } = req.body;
    if (!code || !name || !powerValue || !eixCost) { res.status(400).json({ error: "Missing required fields" }); return; }
    const [card] = await db.insert(powerCardsTable).values({
      code, name, description: description || "", powerValue: Number(powerValue),
      eixCost: Number(eixCost), upgradeEixCost: Number(upgradeEixCost) || Number(eixCost),
      maxUpgradeLevel: Number(maxUpgradeLevel) || 10, tier: tier || "common",
      imageUrl: imageUrl || null,
    }).returning();
    res.status(201).json(card);
  } catch (err) {
    console.error("Admin create power card error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /admin/power-cards/:id
router.put("/power-cards/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, powerValue, eixCost, upgradeEixCost, maxUpgradeLevel, tier, imageUrl, isActive } = req.body;
    const [card] = await db.update(powerCardsTable).set({
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(powerValue !== undefined && { powerValue: Number(powerValue) }),
      ...(eixCost !== undefined && { eixCost: Number(eixCost) }),
      ...(upgradeEixCost !== undefined && { upgradeEixCost: Number(upgradeEixCost) }),
      ...(maxUpgradeLevel !== undefined && { maxUpgradeLevel: Number(maxUpgradeLevel) }),
      ...(tier !== undefined && { tier }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(isActive !== undefined && { isActive }),
    }).where(eq(powerCardsTable.id, id)).returning();
    if (!card) { res.status(404).json({ error: "Not found" }); return; }
    res.json(card);
  } catch (err) {
    console.error("Admin update power card error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /admin/power-cards/:id
router.delete("/power-cards/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(powerCardsTable).where(eq(powerCardsTable.id, id));
    res.json({ message: "Power Card deleted" });
  } catch (err) {
    console.error("Admin delete power card error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
