-- CreateTable
CREATE TABLE "Todo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chatId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "originalMessage" TEXT NOT NULL,
    "items" TEXT NOT NULL DEFAULT '[]',
    "completedItems" TEXT NOT NULL DEFAULT '[]',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "deadline" DATETIME NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastCheckedIn" DATETIME,
    "checkInCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME
);

-- CreateIndex
CREATE INDEX "Todo_chatId_status_idx" ON "Todo"("chatId", "status");

-- CreateIndex
CREATE INDEX "Todo_deadline_idx" ON "Todo"("deadline");
