import { Router } from "express";
import { db, powerCardsTable, userPowerCardsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { getPowerCardPower } from "../lib/powerCards.js";

const router = Router();

// GET /power-cards — catalog of all active Power Cards
router.get("/", requireAuth, async (_req, res) => {
  try {
    const cards = await db.select().from(powerCardsTable)
      .where(eq(powerCardsTable.isActive, true))
      .orderBy(powerCardsTable.eixCost);
    res.json(cards.map((c) => ({
      id: c.id, code: c.code, name: c.name, description: c.description,
      powerValue: c.powerValue, eixCost: c.eixCost, upgradeEixCost: c.upgradeEixCost,
      maxUpgradeLevel: c.maxUpgradeLevel, tier: c.tier, imageUrl: c.imageUrl,
    })));
  } catch (err) {
    console.error("Power cards list error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /power-cards/mine — user's owned cards + total power
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const owned = await db
      .select({
        id: userPowerCardsTable.id,
        cardId: userPowerCardsTable.cardId,
        upgradeLevel: userPowerCardsTable.upgradeLevel,
        unlockedAt: userPowerCardsTable.unlockedAt,
        code: powerCardsTable.code,
        name: powerCardsTable.name,
        description: powerCardsTable.description,
        powerValue: powerCardsTable.powerValue,
        eixCost: powerCardsTable.eixCost,
        upgradeEixCost: powerCardsTable.upgradeEixCost,
        maxUpgradeLevel: powerCardsTable.maxUpgradeLevel,
        tier: powerCardsTable.tier,
        imageUrl: powerCardsTable.imageUrl,
      })
      .from(userPowerCardsTable)
      .innerJoin(powerCardsTable, eq(userPowerCardsTable.cardId, powerCardsTable.id))
      .where(eq(userPowerCardsTable.userId, user.id));

    const totalPower = await getPowerCardPower(user.id);

    res.json({
      totalPower,
      cardCount: owned.length,
      cards: owned.map((c) => ({
        ...c,
        currentPower: c.powerValue * c.upgradeLevel,
        unlockedAt: c.unlockedAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("My power cards error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /power-cards/:id/unlock — spend EIX to unlock a card
router.post("/:id/unlock", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const cardId = parseInt(req.params.id);
    const [card] = await db.select().from(powerCardsTable).where(eq(powerCardsTable.id, cardId));
    if (!card || !card.isActive) { res.status(404).json({ error: "Power Card not found" }); return; }

    // Anti-abuse: already owned?
    const [existing] = await db.select().from(userPowerCardsTable)
      .where(and(eq(userPowerCardsTable.userId, user.id), eq(userPowerCardsTable.cardId, cardId)));
    if (existing) { res.status(400).json({ error: "You already own this Power Card." }); return; }

    if (user.eixBalance < card.eixCost) {
      res.status(400).json({ error: "Insufficient EIX balance to unlock this card." });
      return;
    }

    await db.update(usersTable).set({ eixBalance: user.eixBalance - card.eixCost }).where(eq(usersTable.id, user.id));
    const [owned] = await db.insert(userPowerCardsTable).values({
      userId: user.id, cardId, upgradeLevel: 1,
    }).returning();

    res.json({
      message: "Power Card unlocked!",
      cardId, upgradeLevel: 1,
      newEixBalance: user.eixBalance - card.eixCost,
      ownedId: owned.id,
    });
  } catch (err) {
    console.error("Unlock power card error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /power-cards/owned/:ownedId/upgrade — spend EIX to upgrade a card
router.post("/owned/:ownedId/upgrade", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const ownedId = parseInt(req.params.ownedId);
    const [owned] = await db.select().from(userPowerCardsTable)
      .where(and(eq(userPowerCardsTable.id, ownedId), eq(userPowerCardsTable.userId, user.id)));
    if (!owned) { res.status(404).json({ error: "Owned card not found" }); return; }

    const [card] = await db.select().from(powerCardsTable).where(eq(powerCardsTable.id, owned.cardId));
    if (!card) { res.status(404).json({ error: "Card definition not found" }); return; }

    if (owned.upgradeLevel >= card.maxUpgradeLevel) {
      res.status(400).json({ error: "This Power Card is already at max upgrade level." });
      return;
    }

    if (user.eixBalance < card.upgradeEixCost) {
      res.status(400).json({ error: "Insufficient EIX balance to upgrade this card." });
      return;
    }

    const newLevel = owned.upgradeLevel + 1;
    await db.update(usersTable).set({ eixBalance: user.eixBalance - card.upgradeEixCost }).where(eq(usersTable.id, user.id));
    await db.update(userPowerCardsTable).set({ upgradeLevel: newLevel }).where(eq(userPowerCardsTable.id, ownedId));

    res.json({
      message: "Power Card upgraded!",
      ownedId, newUpgradeLevel: newLevel,
      newPower: card.powerValue * newLevel,
      newEixBalance: user.eixBalance - card.upgradeEixCost,
    });
  } catch (err) {
    console.error("Upgrade power card error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
