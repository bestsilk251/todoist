import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const TaskSchema = z.object({
  title: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  time: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  is_all_day: z.boolean(),
  needs_confirmation: z.boolean(),
});

const TaskListSchema = z.array(TaskSchema);

export type ParsedTask = z.infer<typeof TaskSchema>;

/**
 * Parses the LLM's raw text response into validated tasks.
 *
 * Models sometimes wrap the array in a ```json ... ``` fence or add stray
 * text despite the prompt's "JSON only" instruction, so we slice from the
 * first '[' to the last ']' before validating. Anything that still fails to
 * parse throws — the Edge Function turns that into a graceful fallback.
 */
export function parseTaskList(raw: string): ParsedTask[] {
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");

  if (start === -1 || end === -1 || end < start) {
    throw new Error(`no JSON array found in LLM output: ${raw.slice(0, 60)}`);
  }

  const json = JSON.parse(raw.slice(start, end + 1));
  return TaskListSchema.parse(json);
}
