import { Router } from "express";
import { db, projectApplicationsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

// POST /projects/apply — public team application form (no auth required)
router.post("/apply", async (req, res) => {
  try {
    const {
      teamName, contactEmail, projectName, tokenSymbol, tokenName,
      totalSupply, communityAllocationPct, rewardPerBlock, epochHours,
      description, website, chain,
    } = req.body;

    if (!teamName || !contactEmail || !projectName || !tokenSymbol || !tokenName) {
      res.status(400).json({ error: "Missing required fields." });
      return;
    }
    const supply = Number(totalSupply);
    const allocPct = Number(communityAllocationPct);
    const perBlock = Number(rewardPerBlock);
    if (!supply || supply <= 0) { res.status(400).json({ error: "Invalid total supply." }); return; }
    if (allocPct <= 0 || allocPct > 100) { res.status(400).json({ error: "Community allocation must be 1-100%." }); return; }
    if (!perBlock || perBlock <= 0) { res.status(400).json({ error: "Invalid reward per block." }); return; }

    const [app] = await db.insert(projectApplicationsTable).values({
      teamName, contactEmail, projectName, tokenSymbol, tokenName,
      totalSupply: supply, communityAllocationPct: allocPct,
      rewardPerBlock: perBlock, epochHours: Number(epochHours) || 24,
      description: description || "", website: website || null,
      chain: chain || "BSC",
    }).returning();

    res.status(201).json({
      id: app.id, status: app.status,
      message: "Application submitted! Our team will review it shortly.",
    });
  } catch (err) {
    console.error("Project application error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
