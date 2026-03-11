import { Hono } from "hono";
import { supabase } from "../lib/supabase";

const events = new Hono();

// GET
events.get("/", async (c) => {
  const { data, error } = await supabase.from("events").select("*");

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(data);
});

// POST
events.post("/", async (c) => {
  const body = await c.req.json();

  const { title, description, occurrence, user_id } = body;

  if (!title || !occurrence || !user_id) {
    return c.json({ error: "title, occurrence and user_id are required" }, 400);
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      title,
      description: description ?? null,
      occurrence,
      user_id,
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
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(data);
});

// DELETE
events.delete("/:id", async (c) => {
  const id = c.req.param("id");

  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.body(null, 204);
});

export default events;
