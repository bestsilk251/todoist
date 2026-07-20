import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parseTaskList } from "./schema.ts";

Deno.test("parses a valid task array", () => {
  const raw = `[{"title":"Buy milk","date":"2026-07-21","time":null,"is_all_day":true,"needs_confirmation":false}]`;
  const result = parseTaskList(raw);
  assertEquals(result.length, 1);
  assertEquals(result[0].title, "Buy milk");
});

Deno.test("throws on missing title", () => {
  const raw = `[{"date":"2026-07-21","time":null,"is_all_day":true,"needs_confirmation":false}]`;
  assertThrows(() => parseTaskList(raw));
});

Deno.test("unwraps a markdown ```json code fence", () => {
  const raw = "```json\n[{\"title\":\"До лікаря\",\"date\":\"2026-07-20\",\"time\":\"15:00\",\"is_all_day\":false,\"needs_confirmation\":true}]\n```";
  const result = parseTaskList(raw);
  assertEquals(result[0].title, "До лікаря");
});

Deno.test("extracts the array even with leading prose", () => {
  const raw = `Sure! Here are your tasks: [{"title":"x","date":"2026-07-21","time":null,"is_all_day":true,"needs_confirmation":false}]`;
  const result = parseTaskList(raw);
  assertEquals(result[0].title, "x");
});

Deno.test("throws on malformed date format", () => {
  const raw = `[{"title":"x","date":"21/07/2026","time":null,"is_all_day":true,"needs_confirmation":false}]`;
  assertThrows(() => parseTaskList(raw));
});

Deno.test("accepts null date for tasks with no date given", () => {
  const raw = `[{"title":"Купити хліб","date":null,"time":null,"is_all_day":true,"needs_confirmation":false}]`;
  const result = parseTaskList(raw);
  assertEquals(result[0].date, null);
});
