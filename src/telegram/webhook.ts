import axios from "axios";
import { Hono } from "hono";

import { generateAIResponse } from "../services/openai";
import { createReminder } from "../tools/reminder";

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
  const aiResponse = await generateAIResponse(incomingMessage);

  console.log("AI RAW RESPONSE:");
  console.log(JSON.stringify(aiResponse));

  //response cleanup before processing
  const cleanedResponse = aiResponse.trim();

  if (cleanedResponse.startsWith("{") && cleanedResponse.endsWith("}")) {
    try {
      const parsed = JSON.parse(cleanedResponse);

      if (parsed.tool === "createReminder") {
        await createReminder(parsed.arguments?.task, String(chatID));

        // Send Telegram confirmation
        await axios.post(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            chat_id: chatID,
            text: "Got it babe 💛 Reminder saved successfully.",
          },
        );

        return c.json({
          success: true,
        });
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
