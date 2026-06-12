import axios from "axios";
import { Hono } from "hono";

import { generateAIResponse } from "../services/openai";
import { createReminder } from "../tools/reminder";
import { createTodo, updateTodoProgress } from "../tools/todo";
import { parseDateTime } from "../lib/parseDateTime";

const telegramRouter = new Hono();

telegramRouter.post("/webhook", async (c) => {
  const body = await c.req.json();

  console.log(JSON.stringify(body, null, 2));

  const message = body.message || body.edited_message;

  if (!message) {
    return c.json({
      success: false,
      error: "No message found",
    });
  }

  const chatID = message.chat.id;

  const incomingMessage = message.text;

  if (!incomingMessage) {
    return c.json({
      success: false,
      error: "No text message found",
    });
  }

  //generate AI response
  let aiResponse: string;
  try {
    aiResponse = await generateAIResponse(incomingMessage);
  } catch (error) {
    console.error("AI call failed:", error);
    await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatID,
        text: "Oops, can you repeat? I zoned out",
      },
    );
    return c.json({ success: false, error: "AI call failed" });
  }

  console.log("AI RAW RESPONSE:");
  console.log(JSON.stringify(aiResponse));

  //response cleanup before processing
  const cleanedResponse = aiResponse.trim();

  if (cleanedResponse.startsWith("{") && cleanedResponse.endsWith("}")) {
    try {
      const parsed = JSON.parse(cleanedResponse);

      if (parsed.tool === "createReminder") {
        const task = parsed.arguments?.task ?? "";
        const dateTimeStr = parsed.arguments?.dateTime;
        const preAlerts = parsed.arguments?.preAlerts;

        let scheduledAt: Date | undefined;
        if (dateTimeStr) {
          const parsedDate = parseDateTime(dateTimeStr);
          if (parsedDate) scheduledAt = parsedDate.date;
        }

        await createReminder(task, String(chatID), scheduledAt, preAlerts);

        let confirmText = "Got it babe, I'll remind you";
        if (scheduledAt) {
          confirmText = `Reminder set: "${task}" on ${scheduledAt.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`;
        }

        await axios.post(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            chat_id: chatID,
            text: confirmText,
          },
        );

        return c.json({
          success: true,
        });
      }

      if (parsed.tool === "createTodo") {
        const title = parsed.arguments?.title ?? "";
        const originalMessage = parsed.arguments?.originalMessage ?? "";
        const itemsRaw = parsed.arguments?.items ?? "[]";
        const deadlineStr = parsed.arguments?.deadline;
        const priority = parsed.arguments?.priority ?? "medium";

        let items: string[];
        try { items = JSON.parse(itemsRaw); } catch { items = []; }

        const todo = await createTodo(
          String(chatID), title, originalMessage, items, deadlineStr, priority,
        );

        const itemList = items.map((i: string) => `  [ ] ${i}`).join("\n");
        const dueText = deadlineStr ? `(due: ${deadlineStr})` : "";
        const confirmText = [
          `Got it babe 💛 I'll track these for you:\n`,
          `📋 ${title} ${dueText}`,
          `\n${itemList}\n`,
          `I'll check in on your progress. Don't slack off 😤`,
        ].join("\n");

        await axios.post(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          { chat_id: chatID, text: confirmText },
        );

        return c.json({ success: true });
      }

      if (parsed.tool === "updateTodoProgress") {
        const todoId = parsed.arguments?.todoId;
        const completedRaw = parsed.arguments?.completedItems ?? "[]";

        if (!todoId) {
          await axios.post(
            `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
            { chat_id: chatID, text: "Babe, I need to know which task list you're updating 🙃" },
          );
          return c.json({ success: false, error: "Missing todoId" });
        }

        let completedItems: string[];
        try { completedItems = JSON.parse(completedRaw); } catch { completedItems = []; }

        const updated = await updateTodoProgress(todoId, completedItems);

        const allItems: string[] = JSON.parse(updated.items);
        const doneItems: string[] = JSON.parse(updated.completedItems);
        const remaining = allItems.filter((i) => !doneItems.includes(i));

        const itemList = allItems
          .map((i) => (doneItems.includes(i) ? `  [✅] ${i}` : `  [ ] ${i}`))
          .join("\n");

        const doneText = remaining.length === 0
          ? "All done! You're on fire today 🔥"
          : `${remaining.length} left — don't make me come beat yo ass boi 😤`;

        const confirmText = [
          `Got it! Marked ${completedItems.join(", ")} as done.`,
          `\n📋 ${updated.title}\n${itemList}\n`,
          doneText,
        ].join("\n");

        await axios.post(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          { chat_id: chatID, text: confirmText },
        );

        return c.json({ success: true });
      }

      if (parsed.tool === "webSearch") {
        // TODO: implement later
        await axios.post(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            chat_id: chatID,
            text: "Let me look that up for you...",
          },
        );
        return c.json({ success: true });
      }
    } catch (error) {
      console.log("Invalid JSON tool call.");
      console.log(error);
    }
  }

  await axios.post(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      chat_id: chatID,
      text: aiResponse,
    },
  );

  return c.json({
    success: true,
  });
});

export default telegramRouter;
