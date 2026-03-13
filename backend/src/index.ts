import { serve } from "@hono/node-server";
import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import agentChats from "./routes/agent-chats";
import events from "./routes/events";
import health from "./routes/health";
import helpdesk from "./routes/helpdesk";

const app = new Hono();

const frontendOrigin = process.env.FRONTEND_ORIGIN!;

app.use(
  "*",
  cors({
    origin: frontendOrigin,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.route("/health", health);
app.route("/events", events);
app.route("/agent/chats", agentChats);
app.route("/helpdesk", helpdesk);

serve({
  fetch: app.fetch,
  port: 3000,
});
