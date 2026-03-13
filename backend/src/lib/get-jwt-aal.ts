export function getJwtAal(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) {
      return null;
    }

    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");

    const decoded = Buffer.from(payload, "base64").toString("utf8");
    const json = JSON.parse(decoded);

    return typeof json.aal === "string" ? json.aal : null;
  } catch {
    return null;
  }
}
