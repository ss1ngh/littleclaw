import { prisma } from "../lib/prisma";

export async function createReminder(task: string, chatId: string) {
  const reminder = await prisma.reminder.create({
    data: {
      task,
      schedule: "unknown",
      chatId,
    },
  });

  return reminder;
}
