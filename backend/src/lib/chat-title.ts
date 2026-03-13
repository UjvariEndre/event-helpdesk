function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function buildFallbackTitle(message: string) {
  const cleaned = message.replace(/\s+/g, " ").trim().toLowerCase();

  if (!cleaned) {
    return "New Helpdesk Chat";
  }

  const patterns: Array<{ regex: RegExp; title: string }> = [
    {
      regex: /\blog[\s-]?in\b|\blogin\b|\bsign[\s-]?in\b/,
      title: "Login Problem",
    },
    {
      regex: /\bmfa\b|\b2fa\b|\btotp\b|\bverification code\b/,
      title: "MFA Problem",
    },
    {
      regex: /\bpassword\b|\breset\b/,
      title: "Password Reset",
    },
    {
      regex: /\baccess denied\b|\b403\b|\bforbidden\b/,
      title: "Access Denied",
    },
    {
      regex: /\b404\b|\bnot found\b/,
      title: "Page Not Found",
    },
    {
      regex: /\b500\b|\bserver error\b|\binternal server error\b/,
      title: "Server Error",
    },
    {
      regex: /\bblank page\b|\bwhite screen\b|\bempty\b/,
      title: "Blank Page Issue",
    },
    {
      regex: /\bload\b|\bloading\b|\bstuck\b|\bfreeze\b|\bfrozen\b/,
      title: "Loading Issue",
    },
    {
      regex: /\bevents\b|\bevent page\b|\bevent problem\b/,
      title: "Events Issue",
    },
    {
      regex: /\berror\b|\bbug\b|\bissue\b|\bproblem\b/,
      title: "Application Issue",
    },
  ];

  for (const pattern of patterns) {
    if (pattern.regex.test(cleaned)) {
      return pattern.title;
    }
  }

  const words = cleaned
    .replace(/[^\w\s]/g, "")
    .split(" ")
    .filter((word) => word.length > 2)
    .slice(0, 4);

  if (!words.length) {
    return "Helpdesk Request";
  }

  return toTitleCase(words.join(" "));
}

export async function generateChatTitleFromFirstMessage(
  firstMessage: string,
): Promise<string> {
  return buildFallbackTitle(firstMessage);
}
