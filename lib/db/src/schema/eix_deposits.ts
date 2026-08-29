import { pgTable, serial, integer, doublePrecision, text, timestamp } from "drizzle-orm/pg-core";

// Crypto → EIX purchase deposits. Mirrors the USDT deposit-approval flow:
// user deposits crypto (USDT/BTC/SOL/ETH), submits tx hash/screenshot,
// admin approves → EIX credited at the fixed $10/EIX rate.
export const eixDepositsTable = pgTable("eix_deposits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  currency: text("currency").notNull(), // usdt | btc | sol | eth
  amountCrypto: doublePrecision("amount_crypto"), // amount in the deposited currency (optional)
  amountUsd: doublePrecision("amount_usd").notNull(), // USD value of the deposit
  eixAmount: doublePrecision("eix_amount").notNull(), // EIX to credit = amountUsd / 10
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  txHash: text("tx_hash"),
  screenshotData: text("screenshot_data"), // base64 image data
  assignedAddress: text("assigned_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
});

export type EixDeposit = typeof eixDepositsTable.$inferSelect;
export type InsertEixDeposit = typeof eixDepositsTable.$inferInsert;
