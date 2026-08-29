import { pgTable, serial, integer, doublePrecision, text, boolean, timestamp } from "drizzle-orm/pg-core";

// Power Card catalog — admin-managed. Each card has a unique code, a Power
// value, an EIX unlock cost, and an upgrade cost. Upgradeable & expandable.
export const powerCardsTable = pgTable("power_cards", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  powerValue: doublePrecision("power_value").notNull(),
  eixCost: doublePrecision("eix_cost").notNull(),
  upgradeEixCost: doublePrecision("upgrade_eix_cost").notNull(),
  maxUpgradeLevel: integer("max_upgrade_level").notNull().default(10),
  tier: text("tier").notNull().default("common"), // common | rare | epic | legendary
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PowerCard = typeof powerCardsTable.$inferSelect;

// Cards owned by users. upgradeLevel starts at 1; power = powerValue * upgradeLevel.
export const userPowerCardsTable = pgTable("user_power_cards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  cardId: integer("card_id").notNull(),
  upgradeLevel: integer("upgrade_level").notNull().default(1),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
});

export type UserPowerCard = typeof userPowerCardsTable.$inferSelect;
