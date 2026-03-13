import { Hono } from "hono";
import { requireAuth, requireRole } from "../lib/auth-middleware";
import {
  buildChatDetail,
  createUserChat,
  getChatMessages,
  getFirstAgentProfile,
  getLatestActiveChatForUser,
  insertChatMessage,
  updateChat,
} from "../lib/chat-service";
import { generateChatTitleFromFirstMessage } from "../lib/chat-title";
import { generateHelpdeskReply } from "../lib/helpdesk-ai";
import { AppEnv } from "../types/chat.db";

const helpdesk = new Hono<AppEnv>();

helpdesk.use("*", requireAuth);
helpdesk.use("*", requireRole("user"));

// GET
helpdesk.get("/chat", async (c) => {
  const profile = c.get("user");

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
  const profile = c.get("user");

  try {
    const body = (await c.req.json()) as { content?: unknown };
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!content) {
      return c.json({ error: "content is required" }, 400);
    }

    const existingChat = await getLatestActiveChatForUser(profile.id);
    let chat = existingChat;

    if (!chat) {
      const generatedTitle = await generateChatTitleFromFirstMessage(content);
      chat = await createUserChat(profile.id, generatedTitle);
    }

    await insertChatMessage({
      chatId: chat.id,
      senderType: "user",
      senderUserId: profile.id,
      content,
    });

    // If the chat is already assigned to an agent, we can skip the AI response
    if (chat.assigned_agent_id) {
      const updatedChat = await updateChat({
        chatId: chat.id,
        status: "open",
        assignedAgentId: chat.assigned_agent_id,
      });

      return c.json(await buildChatDetail(updatedChat), 201);
    }

    const messages = await getChatMessages(chat.id);

    const history = messages.map((message) => ({
      role: message.sender_type === "assistant" ? "assistant" : "user",
      content: message.content,
    })) as Array<{ role: "user" | "assistant"; content: string }>;

    const aiResult = await generateHelpdeskReply({
      userMessage: content,
      history,
    });

    await insertChatMessage({
      chatId: chat.id,
      senderType: "assistant",
      senderUserId: null,
      content: aiResult.reply,
    });

    let updatedChat;

    if (aiResult.shouldEscalate) {
      const agent = await getFirstAgentProfile();

      if (!agent) {
        throw new Error("No helpdesk agent profile found for escalation");
      }

      updatedChat = await updateChat({
        chatId: chat.id,
        status: "open",
        assignedAgentId: agent.id,
      });
    } else {
      updatedChat = await updateChat({
        chatId: chat.id,
        status: "pending",
      });
    }

    return c.json(await buildChatDetail(updatedChat), 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send message";
    return c.json({ error: message }, 500);
  }
});

export default helpdesk;
