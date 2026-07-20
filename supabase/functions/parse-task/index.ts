import { buildSystemPrompt } from "./prompt.ts";
import { parseTaskList, type ParsedTask } from "./schema.ts";

export type LLMCall = (systemPrompt: string, userText: string) => Promise<string>;

export interface ParseTaskInput {
  text: string;
  currentDate: string;
  timezone: string;
}

export interface ParseTaskResult {
  tasks: ParsedTask[];
  fallback?: true;
}

/**
 * Core handler, kept free of Deno.serve so tests can drive it with a fake LLM.
 * Never throws: any LLM or validation failure degrades to a single unparsed
 * task carrying the user's original words, flagged for manual confirmation.
 */
export async function handleParseTask(
  input: ParseTaskInput,
  callLLM: LLMCall,
): Promise<ParseTaskResult> {
  const systemPrompt = buildSystemPrompt({
    currentDate: input.currentDate,
    timezone: input.timezone,
  });

  try {
    const raw = await callLLM(systemPrompt, input.text);
    return { tasks: parseTaskList(raw) };
  } catch (err) {
    console.error("parse-task failed, falling back:", err);
    return {
      fallback: true,
      tasks: [
        {
          title: input.text,
          date: null,
          time: null,
          is_all_day: true,
          needs_confirmation: true,
        },
      ],
    };
  }
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
      max_tokens: 1024,
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
    const result = await handleParseTask(input, callClaude);
    return new Response(JSON.stringify(result), {
      headers: { ...CORS, "content-type": "application/json" },
    });
  });
}
