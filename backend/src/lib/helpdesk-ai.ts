export type HelpdeskAiResult = {
  reply: string;
  shouldEscalate: boolean;
};

const HUMAN_HANDOFF_PATTERNS = [
  /\bhuman\b/i,
  /\bagent\b/i,
  /\breal person\b/i,
  /\btransfer\b/i,
  /\bsomeone\b/i,
  /\boperator\b/i,
];

function wantsHuman(content: string) {
  return HUMAN_HANDOFF_PATTERNS.some((pattern) => pattern.test(content));
}

export async function generateHelpdeskReply(input: {
  userMessage: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<HelpdeskAiResult> {
  const { userMessage } = input;

  if (wantsHuman(userMessage)) {
    return {
      shouldEscalate: true,
      reply: "Sure - I'm transferring you to a human helpdesk agent now.",
    };
  }

  // A real LLM call can be added here later.
  // For now, this is a placeholder so the flow can run end to end.
  const normalized = userMessage.toLowerCase();

  if (normalized.includes("event")) {
    return {
      shouldEscalate: false,
      reply:
        "I can help with events. Please tell me whether you want to create, update, or delete an event, and include the relevant details.",
    };
  }

  if (normalized.includes("password") || normalized.includes("login")) {
    return {
      shouldEscalate: false,
      reply:
        "If this is a login issue, please try resetting your password first. If the problem continues, type 'human' and I will transfer you to an agent.",
    };
  }

  return {
    shouldEscalate: false,
    reply:
      "I understand your request. Could you give me a bit more detail so I can help more precisely? If you prefer, type 'human' and I will transfer you to an agent.",
  };
}
