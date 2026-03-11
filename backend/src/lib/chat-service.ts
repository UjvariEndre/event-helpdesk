import { supabase } from "../lib/supabase";
import { ChatMessageRow, ChatRow, ProfileRow } from "../types/chat.db";
import {
  ChatDetailDto,
  ChatListItemDto,
  ChatMessageDto,
  ChatStatus,
  SenderType,
} from "../types/chat.dto";

const CHAT_SELECT =
  "id, user_id, status, subject, assigned_agent_id, created_at, updated_at";

const PROFILE_SELECT = "id, email, role";

const MESSAGE_SELECT =
  "id, chat_id, sender_type, sender_user_id, content, created_at";

function uniqueIds(values: Array<string | null | undefined>) {
  return [
    ...new Set(values.filter((value): value is string => Boolean(value))),
  ];
}

function getLastItem<T>(items: T[]): T | null {
  return items.length ? items[items.length - 1] : null;
}

async function getProfilesByIds(ids: string[]) {
  if (!ids.length) {
    return new Map<string, ProfileRow>();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]),
  );
}

async function getMessagesByChatIds(chatIds: string[]) {
  if (!chatIds.length) {
    return new Map<string, ChatMessageRow[]>();
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .select(MESSAGE_SELECT)
    .in("chat_id", chatIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const grouped = new Map<string, ChatMessageRow[]>();

  for (const message of (data ?? []) as ChatMessageRow[]) {
    const current = grouped.get(message.chat_id);

    if (current) {
      current.push(message);
    } else {
      grouped.set(message.chat_id, [message]);
    }
  }

  return grouped;
}

function getSenderLabel(
  message: ChatMessageRow,
  profilesById: Map<string, ProfileRow>,
) {
  if (message.sender_type === "assistant") {
    return "Assistant";
  }

  if (!message.sender_user_id) {
    return message.sender_type === "agent" ? "Agent" : "User";
  }

  return profilesById.get(message.sender_user_id)?.email ?? "Unknown sender";
}

function toMessageDto(
  message: ChatMessageRow,
  profilesById: Map<string, ProfileRow>,
): ChatMessageDto {
  return {
    id: message.id,
    chatId: message.chat_id,
    senderType: message.sender_type,
    senderUserId: message.sender_user_id,
    senderLabel: getSenderLabel(message, profilesById),
    content: message.content,
    createdAt: message.created_at,
  };
}

function requireProfile(
  profilesById: Map<string, ProfileRow>,
  profileId: string,
  label: string,
) {
  const profile = profilesById.get(profileId);

  if (!profile) {
    throw new Error(`${label} profile not found: ${profileId}`);
  }

  return {
    id: profile.id,
    email: profile.email,
  };
}

export async function getChatRowById(chatId: string) {
  const { data, error } = await supabase
    .from("chats")
    .select(CHAT_SELECT)
    .eq("id", chatId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ChatRow | null) ?? null;
}

export async function listAllChats() {
  const { data, error } = await supabase
    .from("chats")
    .select(CHAT_SELECT)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ChatRow[];
}

export async function getLatestActiveChatForUser(userId: string) {
  const { data, error } = await supabase
    .from("chats")
    .select(CHAT_SELECT)
    .eq("user_id", userId)
    .in("status", ["open", "pending"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ChatRow | null) ?? null;
}

export async function createUserChat(userId: string, subject: string) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("chats")
    .insert({
      user_id: userId,
      subject,
      status: "open",
      assigned_agent_id: null,
      created_at: now,
      updated_at: now,
    })
    .select(CHAT_SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ChatRow;
}

export async function insertChatMessage(input: {
  chatId: string;
  senderType: SenderType;
  senderUserId: string | null;
  content: string;
}) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      chat_id: input.chatId,
      sender_type: input.senderType,
      sender_user_id: input.senderUserId,
      content: input.content,
      created_at: now,
    })
    .select(MESSAGE_SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const { error: updateChatError } = await supabase
    .from("chats")
    .update({ updated_at: now })
    .eq("id", input.chatId);

  if (updateChatError) {
    throw new Error(updateChatError.message);
  }

  return data as ChatMessageRow;
}

export async function updateChat(input: {
  chatId: string;
  status?: ChatStatus;
  assignedAgentId?: string | null;
}) {
  const patch: {
    status?: ChatStatus;
    assigned_agent_id?: string | null;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (input.status !== undefined) {
    patch.status = input.status;
  }

  if (input.assignedAgentId !== undefined) {
    patch.assigned_agent_id = input.assignedAgentId;
  }

  const { data, error } = await supabase
    .from("chats")
    .update(patch)
    .eq("id", input.chatId)
    .select(CHAT_SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ChatRow;
}

export async function buildChatListItems(
  chatRows: ChatRow[],
): Promise<ChatListItemDto[]> {
  const chatIds = chatRows.map((chat) => chat.id);

  const [messagesByChatId, profilesById] = await Promise.all([
    getMessagesByChatIds(chatIds),
    getProfilesByIds(
      uniqueIds([
        ...chatRows.map((chat) => chat.user_id),
        ...chatRows.map((chat) => chat.assigned_agent_id),
      ]),
    ),
  ]);

  return chatRows.map((chat) => {
    const messages = messagesByChatId.get(chat.id) ?? [];
    const lastMessage = getLastItem(messages);

    return {
      id: chat.id,
      subject: chat.subject,
      status: chat.status,
      user: requireProfile(profilesById, chat.user_id, "User"),
      assignedAgent: chat.assigned_agent_id
        ? requireProfile(profilesById, chat.assigned_agent_id, "Agent")
        : null,
      lastMessagePreview: lastMessage?.content ?? "",
      createdAt: chat.created_at,
      updatedAt: chat.updated_at,
    };
  });
}

export async function buildChatDetail(
  chatRow: ChatRow,
): Promise<ChatDetailDto> {
  const baseProfileIds = uniqueIds([
    chatRow.user_id,
    chatRow.assigned_agent_id,
  ]);

  const [messagesByChatId, baseProfilesById] = await Promise.all([
    getMessagesByChatIds([chatRow.id]),
    getProfilesByIds(baseProfileIds),
  ]);

  const messages = messagesByChatId.get(chatRow.id) ?? [];

  const senderProfileIds = uniqueIds(
    messages.map((message) => message.sender_user_id),
  );

  const missingSenderProfileIds = senderProfileIds.filter(
    (id) => !baseProfilesById.has(id),
  );

  const senderProfilesById = await getProfilesByIds(missingSenderProfileIds);

  const profilesById = new Map<string, ProfileRow>([
    ...Array.from(baseProfilesById.entries()),
    ...Array.from(senderProfilesById.entries()),
  ]);

  return {
    id: chatRow.id,
    subject: chatRow.subject,
    status: chatRow.status,
    user: requireProfile(profilesById, chatRow.user_id, "User"),
    assignedAgent: chatRow.assigned_agent_id
      ? requireProfile(profilesById, chatRow.assigned_agent_id, "Agent")
      : null,
    lastMessagePreview: getLastItem(messages)?.content ?? "",
    messages: messages.map((message) => toMessageDto(message, profilesById)),
    createdAt: chatRow.created_at,
    updatedAt: chatRow.updated_at,
  };
}
