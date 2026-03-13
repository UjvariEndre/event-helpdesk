import { Hono } from "hono";
import { requireAuth, requireRole } from "../lib/auth-middleware";
import { getUserFromRequest } from "../lib/get-user-from-request";
import { supabase } from "../lib/supabase";

const events = new Hono();

events.use("*", requireAuth);
events.use("*", requireRole("user"));

// GET
events.get("/", async (c) => {
  const user = await getUserFromRequest(c);

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", user.id)
    .order("occurrence", { ascending: true });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(data);
});

// POST
events.post("/", async (c) => {
  const user = await getUserFromRequest(c);

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json();
  const { title, description, occurrence } = body;

  if (!title || !occurrence) {
    return c.json({ error: "title and occurrence are required" }, 400);
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      title,
      description: description ?? null,
      occurrence,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(data, 201);
});

// PATCH
events.patch("/:id", async (c) => {
  const user = await getUserFromRequest(c);

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const body = await c.req.json();
  const { description } = body;

  const { data, error } = await supabase
    .from("events")
    .update({
      description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(data);
});

// DELETE
events.delete("/:id", async (c) => {
  const user = await getUserFromRequest(c);

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.body(null, 204);
});

export default events;
