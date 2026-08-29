import { pgTable, serial, integer, doublePrecision, text, boolean, timestamp } from "drizzle-orm/pg-core";

// Partner project applications — submitted by external teams via the public
// application form. Admin reviews and, on approval, creates an airdrop project.
export const projectApplicationsTable = pgTable("project_applications", {
  id: serial("id").primaryKey(),
  teamName: text("team_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  projectName: text("project_name").notNull(),
  tokenSymbol: text("token_symbol").notNull(),
  tokenName: text("token_name").notNull(),
  totalSupply: doublePrecision("total_supply").notNull(),
  communityAllocationPct: doublePrecision("community_allocation_pct").notNull(),
  rewardPerBlock: doublePrecision("reward_per_block").notNull(),
  epochHours: integer("epoch_hours").notNull().default(24),
  description: text("description").notNull().default(""),
  website: text("website"),
  chain: text("chain").notNull().default("BSC"),
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  createdAt: timestamp("created_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export type ProjectApplication = typeof projectApplicationsTable.$inferSelect;

// Approved partner projects / airdrop campaigns. Scalable for many projects.
export const airdropProjectsTable = pgTable("airdrop_projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  tokenSymbol: text("token_symbol").notNull(),
  tokenName: text("token_name").notNull(),
  totalSupply: doublePrecision("total_supply").notNull(),
  communityAllocationPct: doublePrecision("community_allocation_pct").notNull(),
  communityAllocationAmount: doublePrecision("community_allocation_amount").notNull(),
  rewardPerBlock: doublePrecision("reward_per_block").notNull(),
  epochHours: integer("epoch_hours").notNull().default(24),
  status: text("status").notNull().default("active"), // active | paused | ended
  description: text("description").notNull().default(""),
  logoUrl: text("logo_url"),
  website: text("website"),
  chain: text("chain").notNull().default("BSC"),
  applicationId: integer("application_id"),
  currentBlockNumber: integer("current_block_number").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AirdropProject = typeof airdropProjectsTable.$inferSelect;

// Per-project 24h (epoch) blocks. Each block is a reward period.
export const airdropBlocksTable = pgTable("airdrop_blocks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  blockNumber: integer("block_number").notNull(),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  rewardAmount: doublePrecision("reward_amount").notNull(),
  status: text("status").notNull().default("open"), // open | closed
  totalGems: doublePrecision("total_gems").notNull().default(0),
  closedAt: timestamp("closed_at"),
});

export type AirdropBlock = typeof airdropBlocksTable.$inferSelect;

// User gem contributions to a specific block.
export const gemContributionsTable = pgTable("gem_contributions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  projectId: integer("project_id").notNull(),
  blockId: integer("block_id").notNull(),
  gemsAmount: doublePrecision("gems_amount").notNull(),
  contributedAt: timestamp("contributed_at").notNull().defaultNow(),
});

export type GemContribution = typeof gemContributionsTable.$inferSelect;

// Rewards distributed to users when a block closes.
export const airdropRewardsTable = pgTable("airdrop_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  projectId: integer("project_id").notNull(),
  blockId: integer("block_id").notNull(),
  tokenSymbol: text("token_symbol").notNull(),
  rewardAmount: doublePrecision("reward_amount").notNull(),
  gemsSharePct: doublePrecision("gems_share_pct").notNull(),
  distributedAt: timestamp("distributed_at").notNull().defaultNow(),
  isClaimed: boolean("is_claimed").notNull().default(false),
  claimedAt: timestamp("claimed_at"),
});

export type AirdropReward = typeof airdropRewardsTable.$inferSelect;
