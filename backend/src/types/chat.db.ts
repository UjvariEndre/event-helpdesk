import type { ChatStatus, SenderType } from "./chat.dto";

export type ProfileRow = {
  id: string;
  email: string;
  role: "user" | "agent";
};

export type ChatRow = {
  id: string;
  user_id: string;
  status: ChatStatus;
  subject: string;
  assigned_agent_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessageRow = {
  id: string;
  chat_id: string;
  sender_type: SenderType;
  sender_user_id: string | null;
  content: string;
  created_at: string;
};
