import { Router } from "express";
import { db, projectApplicationsTable, airdropProjectsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";

const router = Router();

// ─── PROJECT APPLICATIONS ──────────────────────────────────────────

// GET /admin/applications
router.get("/applications", requireAdmin, async (_req, res) => {
  try {
    const apps = await db.select().from(projectApplicationsTable)
      .orderBy(desc(projectApplicationsTable.createdAt));
    res.json(apps.map((a) => ({
      ...a, createdAt: a.createdAt.toISOString(),
      reviewedAt: a.reviewedAt?.toISOString() ?? null,
    })));
  } catch (err) {
    console.error("Admin applications error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/applications/:id/approve — create an airdrop project from the application
router.post("/applications/:id/approve", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [app] = await db.select().from(projectApplicationsTable).where(eq(projectApplicationsTable.id, id));
    if (!app) { res.status(404).json({ error: "Application not found" }); return; }
    if (app.status === "approved") { res.status(400).json({ error: "Already approved" }); return; }

    const communityAmount = app.totalSupply * (app.communityAllocationPct / 100);
    const [project] = await db.insert(airdropProjectsTable).values({
      name: app.projectName, tokenSymbol: app.tokenSymbol, tokenName: app.tokenName,
      totalSupply: app.totalSupply, communityAllocationPct: app.communityAllocationPct,
      communityAllocationAmount: communityAmount, rewardPerBlock: app.rewardPerBlock,
      epochHours: app.epochHours, description: app.description, website: app.website,
      chain: app.chain, applicationId: app.id, status: "active",
    }).returning();

    await db.update(projectApplicationsTable).set({ status: "approved", reviewedAt: new Date() }).where(eq(projectApplicationsTable.id, id));
    res.json({ message: "Application approved — airdrop campaign created", projectId: project.id });
  } catch (err) {
    console.error("Admin approve application error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/applications/:id/reject
router.post("/applications/:id/reject", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [app] = await db.select().from(projectApplicationsTable).where(eq(projectApplicationsTable.id, id));
    if (!app) { res.status(404).json({ error: "Application not found" }); return; }
    await db.update(projectApplicationsTable).set({ status: "rejected", reviewedAt: new Date() }).where(eq(projectApplicationsTable.id, id));
    res.json({ message: "Application rejected" });
  } catch (err) {
    console.error("Admin reject application error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── AIRDROP PROJECTS / CAMPAIGNS ──────────────────────────────────

// GET /admin/projects — all projects (any status)
router.get("/projects", requireAdmin, async (_req, res) => {
  try {
    const projects = await db.select().from(airdropProjectsTable).orderBy(desc(airdropProjectsTable.createdAt));
    res.json(projects.map((p) => ({
      ...p, createdAt: p.createdAt.toISOString(),
    })));
  } catch (err) {
    console.error("Admin projects error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/projects — create a campaign directly
router.post("/projects", requireAdmin, async (req, res) => {
  try {
    const { name, tokenSymbol, tokenName, totalSupply, communityAllocationPct, rewardPerBlock, epochHours, description, website, chain, logoUrl } = req.body;
    if (!name || !tokenSymbol || !totalSupply || !rewardPerBlock) { res.status(400).json({ error: "Missing required fields" }); return; }
    const communityAmount = Number(totalSupply) * (Number(communityAllocationPct) / 100);
    const [project] = await db.insert(airdropProjectsTable).values({
      name, tokenSymbol, tokenName: tokenName || tokenSymbol,
      totalSupply: Number(totalSupply), communityAllocationPct: Number(communityAllocationPct) || 50,
      communityAllocationAmount: communityAmount, rewardPerBlock: Number(rewardPerBlock),
      epochHours: Number(epochHours) || 24, description: description || "",
      website: website || null, chain: chain || "BSC", logoUrl: logoUrl || null,
      status: "active",
    }).returning();
    res.status(201).json(project);
  } catch (err) {
    console.error("Admin create project error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /admin/projects/:id — update status / config
router.put("/admin/projects/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, rewardPerBlock, epochHours, status, website, logoUrl } = req.body;
    const [project] = await db.update(airdropProjectsTable).set({
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(rewardPerBlock !== undefined && { rewardPerBlock: Number(rewardPerBlock) }),
      ...(epochHours !== undefined && { epochHours: Number(epochHours) }),
      ...(status !== undefined && { status }),
      ...(website !== undefined && { website }),
      ...(logoUrl !== undefined && { logoUrl }),
    }).where(eq(airdropProjectsTable.id, id)).returning();
    if (!project) { res.status(404).json({ error: "Not found" }); return; }
    res.json(project);
  } catch (err) {
    console.error("Admin update project error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /admin/projects/:id
router.delete("/admin/projects/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(airdropProjectsTable).where(eq(airdropProjectsTable.id, id));
    res.json({ message: "Project deleted" });
  } catch (err) {
    console.error("Admin delete project error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
