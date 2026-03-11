import { Hono } from "hono";
import {
  buildChatDetail,
  buildChatListItems,
  getChatRowById,
  insertChatMessage,
  listAllChats,
  updateChat,
} from "../lib/chat-service";
import { getUserFromRequest } from "../lib/get-user-from-request";

const agentChats = new Hono();

async function requireAgent(c: Parameters<typeof getUserFromRequest>[0]) {
  const profile = await getUserFromRequest(c);

  if (!profile) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (profile.role !== "agent") {
    return c.json({ error: "Forbidden" }, 403);
  }

  return profile;
}

agentChats.get("/", async (c) => {
  const profile = await requireAgent(c);

  if (profile instanceof Response) {
    return profile;
  }

  try {
    const chats = await listAllChats();
    const items = await buildChatListItems(chats);

    return c.json(items);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load chats";

    return c.json({ error: message }, 500);
  }
});

agentChats.get("/:chatId", async (c) => {
  const profile = await requireAgent(c);

  if (profile instanceof Response) {
    return profile;
  }

  try {
    const chatId = c.req.param("chatId");
    const chat = await getChatRowById(chatId);

    if (!chat) {
      return c.json({ error: "Chat not found" }, 404);
    }

    const detail = await buildChatDetail(chat);

    return c.json(detail);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load chat detail";

    return c.json({ error: message }, 500);
  }
});

agentChats.patch("/:chatId", async (c) => {
  const profile = await requireAgent(c);

  if (profile instanceof Response) {
    return profile;
  }

  try {
    const chatId = c.req.param("chatId");
    const body = (await c.req.json()) as {
      status?: "open" | "pending" | "resolved";
      assignedAgentId?: string | null;
    };

    const existingChat = await getChatRowById(chatId);

    if (!existingChat) {
      return c.json({ error: "Chat not found" }, 404);
    }

    const updatedChat = await updateChat({
      chatId,
      status: body.status,
      assignedAgentId:
        body.assignedAgentId !== undefined
          ? body.assignedAgentId
          : (existingChat.assigned_agent_id ?? profile.id),
    });

    const detail = await buildChatDetail(updatedChat);

    return c.json(detail);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update chat";

    return c.json({ error: message }, 500);
  }
});

agentChats.post("/:chatId/messages", async (c) => {
  const profile = await requireAgent(c);

  if (profile instanceof Response) {
    return profile;
  }

  try {
    const chatId = c.req.param("chatId");
    const body = (await c.req.json()) as { content?: unknown };
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!content) {
      return c.json({ error: "content is required" }, 400);
    }

    const chat = await getChatRowById(chatId);

    if (!chat) {
      return c.json({ error: "Chat not found" }, 404);
    }

    await insertChatMessage({
      chatId,
      senderType: "agent",
      senderUserId: profile.id,
      content,
    });

    const updatedChat = await updateChat({
      chatId,
      status: "pending",
      assignedAgentId: chat.assigned_agent_id ?? profile.id,
    });

    return c.json(await buildChatDetail(updatedChat), 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send agent message";

    return c.json({ error: message }, 500);
  }
});

export default agentChats;
