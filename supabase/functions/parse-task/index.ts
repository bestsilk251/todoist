import { buildSystemPrompt } from "./prompt.ts";
import { parseTaskList, type ParsedTask } from "./schema.ts";

export type LLMCall = (systemPrompt: string, userText: string) => Promise<string>;

export interface ParseTaskInput {
  text: string;
  currentDate: string;
  timezone: string;
  categories?: string[];
}

export interface ParseTaskResult {
  tasks: ParsedTask[];
  fallback?: true;
}

const MAX_PARSE_ATTEMPTS = 2;
const MAX_INPUT_CHARACTERS = 20_000;

/**
 * Core handler, kept free of Deno.serve so tests can drive it with a fake LLM.
 * Never throws: any LLM or validation failure degrades to a single unparsed
 * task carrying the user's original words, flagged for manual confirmation.
 */
export async function handleParseTask(
  input: ParseTaskInput,
  callLLM: LLMCall,
): Promise<ParseTaskResult> {
  const categories = Array.isArray(input.categories)
    ? [...new Set(input.categories.filter((value): value is string => typeof value === 'string').map((value) => value.trim()).filter(Boolean))]
      .slice(0, 40)
      .map((value) => value.slice(0, 80))
    : [];
  const systemPrompt = buildSystemPrompt({
    currentDate: input.currentDate,
    timezone: input.timezone,
    categories,
  });

  let lastError: unknown = null;
  for (let attempt = 0; attempt < MAX_PARSE_ATTEMPTS; attempt += 1) {
    try {
      const raw = await callLLM(systemPrompt, input.text);
      return { tasks: parseTaskList(raw) };
    } catch (err) {
      lastError = err;
    }
  }
  console.error("parse-task failed, falling back:", lastError);
  return {
    fallback: true,
    tasks: [
      {
        title: input.text,
        date: null,
        time: null,
        is_all_day: true,
        needs_confirmation: true,
        duration_minutes: null,
        category: null,
        priority: null,
      },
    ],
  };
}

async function callClaude(systemPrompt: string, userText: string): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY secret");

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: "user", content: userText }],
    }),
  });

  if (!resp.ok) throw new Error(`Anthropic API returned ${resp.status}`);

  const data = await resp.json();
  return data.content[0].text;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Deno.serve is only reached when deployed, not during `deno test`.
if (import.meta.main) {
  Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
    let input: ParseTaskInput;
    try {
      input = (await req.json()) as ParseTaskInput;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { ...CORS, "content-type": "application/json" },
      });
    }
    if (
      typeof input.text !== "string" ||
      input.text.trim().length === 0 ||
      input.text.length > MAX_INPUT_CHARACTERS ||
      typeof input.currentDate !== "string" ||
      typeof input.timezone !== "string"
    ) {
      return new Response(JSON.stringify({ error: "Invalid parse input" }), {
        status: 400,
        headers: { ...CORS, "content-type": "application/json" },
      });
    }
    const result = await handleParseTask(input, callClaude);
    return new Response(JSON.stringify(result), {
      headers: { ...CORS, "content-type": "application/json" },
    });
  });
}
