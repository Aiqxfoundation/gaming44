import { Router } from "express";
import { db, usersTable, airdropProjectsTable, airdropBlocksTable, gemContributionsTable, airdropRewardsTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

/**
 * Ensure the project has an open block. If the current block's epoch has
 * elapsed, close it (distribute rewards proportionally) and open the next one.
 * Called lazily on every read/contribute so no scheduler is needed.
 */
async function ensureOpenBlock(project: typeof airdropProjectsTable.$inferSelect) {
  const now = new Date();

  const [openBlock] = await db.select().from(airdropBlocksTable)
    .where(and(eq(airdropBlocksTable.projectId, project.id), eq(airdropBlocksTable.status, "open")))
    .orderBy(desc(airdropBlocksTable.blockNumber));

  if (openBlock && now < openBlock.endsAt) {
    return openBlock;
  }

  // Close the elapsed block and distribute rewards
  if (openBlock && now >= openBlock.endsAt) {
    await closeBlock(openBlock, project);
  }

  // Open the next block
  const nextNumber = (openBlock?.blockNumber ?? 0) + 1;
  const startsAt = now;
  const endsAt = new Date(now.getTime() + project.epochHours * 3_600_000);
  const [block] = await db.insert(airdropBlocksTable).values({
    projectId: project.id, blockNumber: nextNumber, startsAt, endsAt,
    rewardAmount: project.rewardPerBlock, status: "open",
  }).returning();

  await db.update(airdropProjectsTable)
    .set({ currentBlockNumber: nextNumber })
    .where(eq(airdropProjectsTable.id, project.id));

  return block;
}

/** Close a block: compute each contributor's share and distribute rewards. */
async function closeBlock(block: typeof airdropBlocksTable.$inferSelect, project: typeof airdropProjectsTable.$inferSelect) {
  const contributions = await db.select().from(gemContributionsTable)
    .where(eq(gemContributionsTable.blockId, block.id));

  const byUser = new Map<number, number>();
  let totalGems = 0;
  for (const c of contributions) {
    byUser.set(c.userId, (byUser.get(c.userId) ?? 0) + c.gemsAmount);
    totalGems += c.gemsAmount;
  }

  const now = new Date();
  if (totalGems > 0) {
    for (const [userId, gems] of byUser) {
      const sharePct = gems / totalGems;
      const reward = sharePct * block.rewardAmount;
      await db.insert(airdropRewardsTable).values({
        userId, projectId: project.id, blockId: block.id,
        tokenSymbol: project.tokenSymbol, rewardAmount: reward,
        gemsSharePct: sharePct * 100, distributedAt: now,
      });
    }
  }

  await db.update(airdropBlocksTable).set({
    status: "closed", totalGems, closedAt: now,
  }).where(eq(airdropBlocksTable.id, block.id));
}

// GET /airdrop/projects — list all active airdrop campaigns
router.get("/projects", requireAuth, async (_req, res) => {
  try {
    const projects = await db.select().from(airdropProjectsTable)
      .where(eq(airdropProjectsTable.status, "active"))
      .orderBy(desc(airdropProjectsTable.createdAt));
    res.json(projects.map((p) => ({
      id: p.id, name: p.name, tokenSymbol: p.tokenSymbol, tokenName: p.tokenName,
      totalSupply: p.totalSupply, communityAllocationPct: p.communityAllocationPct,
      communityAllocationAmount: p.communityAllocationAmount,
      rewardPerBlock: p.rewardPerBlock, epochHours: p.epochHours,
      description: p.description, logoUrl: p.logoUrl, website: p.website,
      chain: p.chain, currentBlockNumber: p.currentBlockNumber,
      createdAt: p.createdAt.toISOString(),
    })));
  } catch (err) {
    console.error("Airdrop projects list error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /airdrop/projects/:id — project detail + current block + my contribution
router.get("/projects/:id", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const id = parseInt(req.params.id);
    const [project] = await db.select().from(airdropProjectsTable).where(eq(airdropProjectsTable.id, id));
    if (!project || project.status !== "active") { res.status(404).json({ error: "Project not found" }); return; }

    const block = await ensureOpenBlock(project);

    const [myContributionAgg] = await db
      .select({ total: sql<number>`coalesce(sum(gems_amount),0)` })
      .from(gemContributionsTable)
      .where(and(eq(gemContributionsTable.blockId, block.id), eq(gemContributionsTable.userId, user.id)));

    const [blockTotalAgg] = await db
      .select({ total: sql<number>`coalesce(sum(gems_amount),0)` })
      .from(gemContributionsTable)
      .where(eq(gemContributionsTable.blockId, block.id));

    const myGems = Number(myContributionAgg?.total ?? 0);
    const blockTotal = Number(blockTotalAgg?.total ?? 0);
    const mySharePct = blockTotal > 0 ? (myGems / blockTotal) * 100 : 0;
    const projectedReward = (mySharePct / 100) * block.rewardAmount;

    res.json({
      id: project.id, name: project.name, tokenSymbol: project.tokenSymbol,
      tokenName: project.tokenName, totalSupply: project.totalSupply,
      communityAllocationPct: project.communityAllocationPct,
      communityAllocationAmount: project.communityAllocationAmount,
      rewardPerBlock: project.rewardPerBlock, epochHours: project.epochHours,
      description: project.description, logoUrl: project.logoUrl,
      website: project.website, chain: project.chain,
      currentBlock: {
        id: block.id, blockNumber: block.blockNumber,
        startsAt: block.startsAt.toISOString(), endsAt: block.endsAt.toISOString(),
        rewardAmount: block.rewardAmount, totalGems: blockTotal,
      },
      myContribution: myGems,
      mySharePct,
      projectedReward,
    });
  } catch (err) {
    console.error("Airdrop project detail error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /airdrop/projects/:id/blocks — block history for a project
router.get("/projects/:id/blocks", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const blocks = await db.select().from(airdropBlocksTable)
      .where(eq(airdropBlocksTable.projectId, id))
      .orderBy(desc(airdropBlocksTable.blockNumber))
      .limit(30);
    res.json(blocks.map((b) => ({
      id: b.id, blockNumber: b.blockNumber, status: b.status,
      startsAt: b.startsAt.toISOString(), endsAt: b.endsAt.toISOString(),
      rewardAmount: b.rewardAmount, totalGems: b.totalGems,
      closedAt: b.closedAt?.toISOString() ?? null,
    })));
  } catch (err) {
    console.error("Airdrop blocks error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /airdrop/projects/:id/contribute — contribute gems to the current block
router.post("/projects/:id/contribute", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const id = parseInt(req.params.id);
    const gems = Math.floor(Number(req.body.gems));
    if (!gems || gems < 1) { res.status(400).json({ error: "Enter a valid gem amount." }); return; }

    const [project] = await db.select().from(airdropProjectsTable).where(eq(airdropProjectsTable.id, id));
    if (!project || project.status !== "active") { res.status(404).json({ error: "Project not found" }); return; }

    if (user.gemsBalance < gems) { res.status(400).json({ error: "Insufficient gems balance." }); return; }

    const block = await ensureOpenBlock(project);

    await db.update(usersTable).set({ gemsBalance: user.gemsBalance - gems }).where(eq(usersTable.id, user.id));
    await db.insert(gemContributionsTable).values({
      userId: user.id, projectId: id, blockId: block.id, gemsAmount: gems,
    });

    res.json({ message: "Gems contributed!", contributedGems: gems, newGemsBalance: user.gemsBalance - gems });
  } catch (err) {
    console.error("Contribute gems error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /airdrop/my-rewards — all airdrop rewards earned by the user
router.get("/my-rewards", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const rewards = await db.select({
      id: airdropRewardsTable.id,
      projectId: airdropRewardsTable.projectId,
      projectName: airdropProjectsTable.name,
      tokenSymbol: airdropRewardsTable.tokenSymbol,
      rewardAmount: airdropRewardsTable.rewardAmount,
      gemsSharePct: airdropRewardsTable.gemsSharePct,
      isClaimed: airdropRewardsTable.isClaimed,
      distributedAt: airdropRewardsTable.distributedAt,
      claimedAt: airdropRewardsTable.claimedAt,
    }).from(airdropRewardsTable)
      .leftJoin(airdropProjectsTable, eq(airdropRewardsTable.projectId, airdropProjectsTable.id))
      .where(eq(airdropRewardsTable.userId, user.id))
      .orderBy(desc(airdropRewardsTable.distributedAt));

    res.json(rewards.map((r) => ({
      ...r, distributedAt: r.distributedAt.toISOString(),
      claimedAt: r.claimedAt?.toISOString() ?? null,
    })));
  } catch (err) {
    console.error("My rewards error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /airdrop/my-contributions — gem contribution history
router.get("/my-contributions", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const contribs = await db.select({
      id: gemContributionsTable.id,
      projectId: gemContributionsTable.projectId,
      projectName: airdropProjectsTable.name,
      tokenSymbol: airdropProjectsTable.tokenSymbol,
      gemsAmount: gemContributionsTable.gemsAmount,
      contributedAt: gemContributionsTable.contributedAt,
    }).from(gemContributionsTable)
      .leftJoin(airdropProjectsTable, eq(gemContributionsTable.projectId, airdropProjectsTable.id))
      .where(eq(gemContributionsTable.userId, user.id))
      .orderBy(desc(gemContributionsTable.contributedAt));

    res.json(contribs.map((c) => ({
      ...c, contributedAt: c.contributedAt.toISOString(),
    })));
  } catch (err) {
    console.error("My contributions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /airdrop/rewards/:id/claim — claim a partner-token reward
router.post("/rewards/:id/claim", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const id = parseInt(req.params.id);
    const [reward] = await db.select().from(airdropRewardsTable)
      .where(and(eq(airdropRewardsTable.id, id), eq(airdropRewardsTable.userId, user.id)));
    if (!reward) { res.status(404).json({ error: "Reward not found" }); return; }
    if (reward.isClaimed) { res.status(400).json({ error: "Reward already claimed" }); return; }

    await db.update(airdropRewardsTable).set({ isClaimed: true, claimedAt: new Date() }).where(eq(airdropRewardsTable.id, id));
    res.json({ message: "Reward claimed!", tokenSymbol: reward.tokenSymbol, rewardAmount: reward.rewardAmount });
  } catch (err) {
    console.error("Claim airdrop reward error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
