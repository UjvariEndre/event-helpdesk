export type ChatStatus = "open" | "pending" | "resolved";

export type SenderType = "user" | "agent" | "assistant";

export type ChatBaseDto = {
  id: string;
  subject: string;
  status: ChatStatus;
  user: { id: string; email: string };
  assignedAgent: { id: string; email: string } | null;
  lastMessagePreview: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChatListItemDto = ChatBaseDto;

export type ChatDetailDto = ChatBaseDto & {
  messages: ChatMessageDto[];
};

export type ChatMessageDto = {
  id: string;
  chatId: string;
  senderType: SenderType;
  senderUserId: string | null;
  senderLabel: string;
  content: string;
  createdAt: string;
};
