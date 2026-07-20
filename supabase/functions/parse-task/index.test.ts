import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handleParseTask } from "./index.ts";

Deno.test("returns parsed tasks on success", async () => {
  const fakeLLM = () =>
    Promise.resolve(
      `[{"title":"Buy milk","date":"2026-07-21","time":null,"is_all_day":true,"needs_confirmation":false}]`,
    );

  const result = await handleParseTask(
    { text: "buy milk tomorrow", currentDate: "2026-07-20", timezone: "Europe/Kyiv" },
    fakeLLM,
  );

  assertEquals(result.tasks[0].title, "Buy milk");
  assertEquals(result.fallback, undefined);
});

Deno.test("falls back on invalid LLM output", async () => {
  const brokenLLM = () => Promise.resolve("Sorry, I cannot help with that.");

  const result = await handleParseTask(
    { text: "щось незрозуміле", currentDate: "2026-07-20", timezone: "Europe/Kyiv" },
    brokenLLM,
  );

  assertEquals(result.fallback, true);
  assertEquals(result.tasks[0].title, "щось незрозуміле");
  assertEquals(result.tasks[0].needs_confirmation, true);
});

Deno.test("falls back when the LLM call itself throws", async () => {
  const throwingLLM = () => Promise.reject(new Error("network down"));

  const result = await handleParseTask(
    { text: "buy milk", currentDate: "2026-07-20", timezone: "Europe/Kyiv" },
    throwingLLM,
  );

  assertEquals(result.fallback, true);
  assertEquals(result.tasks[0].title, "buy milk");
});
