import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildSystemPrompt, addDays } from "./prompt.ts";

Deno.test("prompt requires JSON-only output", () => {
  const prompt = buildSystemPrompt({ currentDate: "2026-07-20", timezone: "Europe/Kyiv" });
  assert(prompt.includes("ONLY a JSON array"));
  assert(prompt.includes("No prose"));
});

Deno.test("prompt contains bilingual few-shot examples", () => {
  const prompt = buildSystemPrompt({ currentDate: "2026-07-20", timezone: "Europe/Kyiv" });
  assert(prompt.includes("сьогодні до лікаря"), "missing Ukrainian example");
  assert(prompt.includes("call mom tomorrow"), "missing English example");
});

Deno.test("prompt injects the supplied current date", () => {
  const prompt = buildSystemPrompt({ currentDate: "2026-07-20", timezone: "Europe/Kyiv" });
  assert(prompt.includes("2026-07-20"));
  assert(prompt.includes("2026-07-21"), "tomorrow should be pre-computed in examples");
});

Deno.test("addDays rolls over month boundaries", () => {
  assertEquals(addDays("2026-07-31", 1), "2026-08-01");
  assertEquals(addDays("2026-12-31", 1), "2027-01-01");
});
