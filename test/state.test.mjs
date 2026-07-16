import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readState, writeState, clearState, statePath } from "../src/state.mjs";

test("write → read round trips, clear removes", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "okkskin-"));
  process.env.OKKSKIN_STATE_DIR = dir;
  assert.equal(readState(), null);
  const s = { codexPid: 1, watcherPid: 2, port: 51234, skinId: "purple-night", startedAt: "2026-07-16T00:00:00Z" };
  writeState(s);
  assert.deepEqual(readState(), s);
  assert.ok(fs.existsSync(statePath()));
  clearState();
  assert.equal(readState(), null);
});
test("readState returns null on corrupt json", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "okkskin-"));
  process.env.OKKSKIN_STATE_DIR = dir;
  fs.writeFileSync(statePath(), "{ not json");
  assert.equal(readState(), null);
});
