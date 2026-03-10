import { Hono } from "hono";
import { supabase } from "../lib/supabase";

const events = new Hono();

events.get("/", async (c) => {
  const { data, error } = await supabase.from("events").select("*");

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(data);
});

export default events;
