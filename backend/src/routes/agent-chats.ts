import { Hono } from "hono";
import {
  buildChatDetail,
  buildChatListItems,
  getChatRowById,
  listAllChats,
  updateChat,
} from "../lib/chat-service";

const agentChats = new Hono();

agentChats.get("/", async (c) => {
  try {
    const chats = await listAllChats();
    const items = await buildChatListItems(chats);

    return c.json(items);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load chats";

    return c.json({ message }, 500);
  }
});

agentChats.get("/:chatId", async (c) => {
  try {
    const chatId = c.req.param("chatId");
    const chat = await getChatRowById(chatId);

    if (!chat) {
      return c.json({ message: "Chat not found" }, 404);
    }

    const detail = await buildChatDetail(chat);

    return c.json(detail);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load chat detail";

    return c.json({ message }, 500);
  }
});

agentChats.patch("/:chatId", async (c) => {
  try {
    const chatId = c.req.param("chatId");
    const body = await c.req.json();

    const updatedChat = await updateChat({
      chatId,
      status: body.status,
      assignedAgentId: body.assignedAgentId,
    });

    const detail = await buildChatDetail(updatedChat);

    return c.json(detail);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update chat";

    return c.json({ message }, 500);
  }
});

export default agentChats;
