export type HelpdeskAiResult = {
  reply: string;
  shouldEscalate: boolean;
  shouldResolve: boolean;
};

const HUMAN_HANDOFF_PATTERNS = [
  /\bhuman\b/i,
  /\bagent\b/i,
  /\breal person\b/i,
  /\btransfer\b/i,
  /\bsomeone\b/i,
  /\boperator\b/i,
];

const RESOLVED_PATTERNS = [
  /\bsolved\b/i,
  /\bresolved\b/i,
  /\bit works now\b/i,
  /\bworking now\b/i,
  /\bnever mind\b/i,
  /\bnevermind\b/i,
  /\bignore this\b/i,
  /\bignore it\b/i,
  /\bi fixed it\b/i,
  /\bproblem fixed\b/i,
  /\bfigured it out\b/i,
  /\bno help needed\b/i,
  /\bno need for help\b/i,
  /\bno need\b/i,
  /\bit is okay now\b/i,
  /\bokay now\b/i,
];

function wantsHuman(content: string) {
  return HUMAN_HANDOFF_PATTERNS.some((pattern) => pattern.test(content));
}

function wantsResolve(content: string) {
  return RESOLVED_PATTERNS.some((pattern) => pattern.test(content));
}

export async function generateHelpdeskReply(input: {
  userMessage: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<HelpdeskAiResult> {
  const { userMessage } = input;
  const normalized = userMessage.toLowerCase();

  if (wantsResolve(userMessage)) {
    return {
      shouldEscalate: false,
      shouldResolve: true,
      reply:
        "Great, I’m marking this chat as resolved. If you need help again, just send a new message.",
    };
  }

  if (wantsHuman(userMessage)) {
    return {
      shouldEscalate: true,
      shouldResolve: false,
      reply: "Sure - I'm transferring you to a human helpdesk agent now.",
    };
  }

  // A real LLM call can be added here later.
  // For now, this is a placeholder so the flow can run end to end.
  if (normalized.includes("event")) {
    return {
      shouldEscalate: false,
      shouldResolve: false,
      reply:
        "I can help with events. Please tell me whether you want to create, update, or delete an event, and include the relevant details.",
    };
  }

  if (normalized.includes("password") || normalized.includes("login")) {
    return {
      shouldEscalate: false,
      shouldResolve: false,
      reply:
        "If this is a login issue, please try resetting your password first. If the problem continues, type 'human' and I will transfer you to an agent.",
    };
  }

  return {
    shouldEscalate: false,
    shouldResolve: false,
    reply:
      "I understand your request. Could you give me a bit more detail so I can help more precisely? If you prefer, type 'human' and I will transfer you to an agent.",
  };
}
