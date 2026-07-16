import { test } from "node:test";
import assert from "node:assert/strict";
import { isSameCodexProcess } from "../src/watcher.mjs";

test("current process pid is alive (but not codex) → false", () => {
  assert.equal(isSameCodexProcess(process.pid), false);
});
test("almost-certainly-dead pid → false", () => {
  assert.equal(isSameCodexProcess(2 ** 22), false);
});
