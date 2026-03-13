import type { Context, Next } from "hono";
import { getJwtAal } from "./get-jwt-aal";
import { getUserFromRequest } from "./get-user-from-request";

type AppUser = Awaited<ReturnType<typeof getUserFromRequest>>;

export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice("Bearer ".length).trim();
  const profile = await getUserFromRequest(c);

  if (!profile) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (profile.mfa_required) {
    const aal = getJwtAal(token);

    if (aal !== "aal2") {
      return c.json({ error: "MFA required" }, 403);
    }
  }

  c.set("user", profile);
  await next();
}

export function requireRole(role: "user" | "agent") {
  return async (c: Context, next: Next) => {
    const profile = c.get("user") as NonNullable<AppUser> | undefined;

    if (!profile) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    if (profile.role !== role) {
      return c.json({ error: "Forbidden" }, 403);
    }

    await next();
  };
}
