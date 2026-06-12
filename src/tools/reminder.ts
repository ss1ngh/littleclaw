import { prisma } from "../lib/prisma";

export async function createReminder(
  task: string,
  chatId: string,
  scheduledAt?: Date,
  preAlerts?: string,
) {
  const reminder = await prisma.reminder.create({
    data: {
      task,
      scheduledAt: scheduledAt ?? new Date(Date.now() + 60 * 60 * 1000),
      chatId,
      preAlerts: preAlerts ?? "[45,10]",
    },
  });

  return reminder;
}
