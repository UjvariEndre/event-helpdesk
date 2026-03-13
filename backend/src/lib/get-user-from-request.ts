import type { Context } from "hono";
import { ProfileRow } from "../types/chat.db";
import { supabase } from "./supabase";

export async function getUserFromRequest(
  c: Context,
): Promise<ProfileRow | null> {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "").trim();

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, role, mfa_required")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  return profile as ProfileRow;
}
