export type ChatStatus = "open" | "pending" | "resolved";

export type SenderType = "user" | "agent" | "assistant";

type ChatParticipantDto = {
  id: string;
  email: string;
  name: string | null;
};

export type ChatBaseDto = {
  id: string;
  subject: string;
  status: ChatStatus;
  user: ChatParticipantDto;
  assignedAgent: ChatParticipantDto | null;
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
