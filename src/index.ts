import { Hono } from "hono";
import telegramRouter from "./telegram/webhook";

const app = new Hono();

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    message: "little claw is up and running",
  });
});

app.route("/telegram", telegramRouter);

export default {
  PORT: Number(process.env.PORT) || 3000,
  fetch: app.fetch,
};
