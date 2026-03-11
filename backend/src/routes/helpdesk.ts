import { Hono } from "hono";
import {
  buildChatDetail,
  createUserChat,
  getLatestActiveChatForUser,
  insertChatMessage,
  updateChat,
} from "../lib/chat-service";
import { getUserFromRequest } from "../lib/get-user-from-request";

const helpdesk = new Hono();

async function requireUser(c: Parameters<typeof getUserFromRequest>[0]) {
  const profile = await getUserFromRequest(c);

  if (!profile) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (profile.role !== "user") {
    return c.json({ error: "Forbidden" }, 403);
  }

  return profile;
}

// GET
helpdesk.get("/chat", async (c) => {
  const profile = await requireUser(c);

  if (profile instanceof Response) {
    return profile;
  }

  try {
    const chat = await getLatestActiveChatForUser(profile.id);

    if (!chat) {
      return c.json(null);
    }

    return c.json(await buildChatDetail(chat));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load chat";
    return c.json({ error: message }, 500);
  }
});

// POST
helpdesk.post("/chat/messages", async (c) => {
  const profile = await requireUser(c);

  if (profile instanceof Response) {
    return profile;
  }

  try {
    const body = (await c.req.json()) as { content?: unknown };
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!content) {
      return c.json({ error: "content is required" }, 400);
    }

    const existingChat = await getLatestActiveChatForUser(profile.id);
    const chat =
      existingChat ??
      // TODO: AI
      (await createUserChat(profile.id, content));

    await insertChatMessage({
      chatId: chat.id,
      senderType: "user",
      senderUserId: profile.id,
      content,
    });

    const updatedChat = await updateChat({
      chatId: chat.id,
      status: existingChat?.status ?? "open",
      assignedAgentId: chat.assigned_agent_id,
    });

    return c.json(await buildChatDetail(updatedChat), 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send message";
    return c.json({ error: message }, 500);
  }
});

export default helpdesk;
