/*
  Warnings:

  - You are about to drop the column `alertOneHour` on the `Reminder` table. All the data in the column will be lost.
  - You are about to drop the column `alertTenMin` on the `Reminder` table. All the data in the column will be lost.
  - You are about to drop the column `alertThirtyMin` on the `Reminder` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Reminder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "task" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "scheduledAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "preAlerts" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Reminder" ("chatId", "createdAt", "id", "scheduledAt", "status", "task") SELECT "chatId", "createdAt", "id", "scheduledAt", "status", "task" FROM "Reminder";
DROP TABLE "Reminder";
ALTER TABLE "new_Reminder" RENAME TO "Reminder";
CREATE INDEX "Reminder_status_scheduledAt_idx" ON "Reminder"("status", "scheduledAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
