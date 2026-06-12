/*
  Warnings:

  - You are about to drop the column `schedule` on the `Reminder` table. All the data in the column will be lost.
  - Added the required column `scheduledAt` to the `Reminder` table without a default value. This is not possible if the table is not empty.

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
    "alertOneHour" BOOLEAN NOT NULL DEFAULT false,
    "alertThirtyMin" BOOLEAN NOT NULL DEFAULT false,
    "alertTenMin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Reminder" ("chatId", "createdAt", "id", "task") SELECT "chatId", "createdAt", "id", "task" FROM "Reminder";
DROP TABLE "Reminder";
ALTER TABLE "new_Reminder" RENAME TO "Reminder";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
