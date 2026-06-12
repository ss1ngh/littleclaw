import axios from "axios";
import { Hono } from "hono";

import { generateAIResponse } from "../services/openai";
import { createReminder } from "../tools/reminder";
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
        await axios.post(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            chat_id: chatID,
            text: "Got it babe 💛 I'll track that for you.",
          },
        );
        return c.json({ success: true });
      }

      if (parsed.tool === "updateTodoProgress") {
        await axios.post(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            chat_id: chatID,
            text: "Updated your progress, love 💪",
          },
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
