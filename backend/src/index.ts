import { serve } from "@hono/node-server";
import "dotenv/config";
import { Hono } from "hono";
import events from "./routes/events";
import health from "./routes/health";

const app = new Hono();

app.route("/health", health);
app.route("/events", events);

serve({
  fetch: app.fetch,
  port: 3000,
});
