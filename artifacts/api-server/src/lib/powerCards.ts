import { db, userPowerCardsTable, powerCardsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

/**
 * Sum of power across all Power Cards owned by a user.
 * Each owned card contributes card.powerValue * upgradeLevel.
 */
export async function getPowerCardPower(userId: number): Promise<number> {
  const owned = await db
    .select({
      powerValue: powerCardsTable.powerValue,
      upgradeLevel: userPowerCardsTable.upgradeLevel,
    })
    .from(userPowerCardsTable)
    .innerJoin(powerCardsTable, eq(userPowerCardsTable.cardId, powerCardsTable.id))
    .where(eq(userPowerCardsTable.userId, userId));

  return owned.reduce((sum, c) => sum + c.powerValue * c.upgradeLevel, 0);
}

/** Count of distinct Power Cards a user owns. */
export async function getOwnedCardCount(userId: number): Promise<number> {
  const owned = await db
    .select({ id: userPowerCardsTable.id })
    .from(userPowerCardsTable)
    .where(eq(userPowerCardsTable.userId, userId));
  return owned.length;
}
