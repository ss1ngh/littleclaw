import { prisma } from "../lib/prisma";
import { parseDateTime } from "../lib/parseDateTime";

function parseDeadline(str: string): Date | null {
  const parsed = parseDateTime(str);
  if (!parsed) return null;

  // If the string mentions a specific time like "5pm" or "at 4:30", keep chrono's result.
  // Otherwise it's a day-level reference ("tomorrow", "Friday") — shift to end of day.
  const hasExplicitTime = /\d{1,2}(:\d{2})?\s*(am|pm)|at\s+\d/i.test(str);
  if (!hasExplicitTime) {
    parsed.date.setHours(23, 59, 59, 999);
  }

  return parsed.date;
}

export async function createTodo(
  chatId: string,
  title: string,
  originalMessage: string,
  items: string[],
  deadlineStr?: string,
  priority?: string,
) {
  let deadline = new Date();
  deadline.setDate(deadline.getDate() + 1);
  deadline.setHours(23, 59, 59, 999);

  if (deadlineStr) {
    const parsed = parseDeadline(deadlineStr);
    if (parsed) deadline = parsed;
  }

  const todo = await prisma.todo.create({
    data: {
      chatId,
      title,
      originalMessage,
      items: JSON.stringify(items),
      deadline,
      priority: priority ?? "medium",
    },
  });
  return todo;
}

export async function updateTodoProgress( todoId: number, newCompletedItems: string[] ) {

  const todo = await prisma.todo.findUnique({ where: { id: todoId } });

  if (!todo) throw new Error(`Todo with id ${todoId} not found`);

  const items: string[] = JSON.parse(todo.items);

  const existingCompleted: string[] = JSON.parse(todo.completedItems);

  const merged = [...new Set([...existingCompleted, ...newCompletedItems])];
  const allDone = merged.length >= items.length;

  const updated = await prisma.todo.update({
    where: { id: todoId },
    data: {
      completedItems: JSON.stringify(merged),
      status: allDone ? "completed" : todo.status,
      completedAt: allDone ? new Date() : todo.completedAt,
    },
  });
  return updated;
}
