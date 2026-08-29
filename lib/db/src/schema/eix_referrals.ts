import { pgTable, serial, integer, doublePrecision, boolean, text, timestamp } from "drizzle-orm/pg-core";

// EIX referral rewards — separate from the existing gem referral system.
// Earned in EIX from eligible referrals, with anti-abuse tracking.
export const eixReferralRewardsTable = pgTable("eix_referral_rewards", {
  id: serial("id").primaryKey(),
  uplineUserId: integer("upline_user_id").notNull(),
  refereeUserId: integer("referee_user_id").notNull(),
  eixAmount: doublePrecision("eix_amount").notNull(),
  reason: text("reason").notNull().default("referral"), // referral | power_card | airdrop
  isClaimed: boolean("is_claimed").notNull().default(false),
  claimedAt: timestamp("claimed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type EixReferralReward = typeof eixReferralRewardsTable.$inferSelect;
