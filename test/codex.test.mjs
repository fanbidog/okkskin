import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { findCodexBundle, verifyCodexSignature } from "../src/codex.mjs";

const installed = fs.existsSync("/Applications/ChatGPT.app");

test("findCodexBundle locates com.openai.codex", { skip: !installed }, () => {
  const b = findCodexBundle();
  assert.match(b.bundlePath, /\.app$/);
  assert.ok(fs.existsSync(b.execPath));
  assert.equal(b.bundleId, "com.openai.codex");
});
test("verifyCodexSignature passes for official app", { skip: !installed }, () => {
  const b = findCodexBundle();
  assert.equal(verifyCodexSignature(b.bundlePath), true);
});
test("findCodexBundle throws when nothing matches", () => {
  process.env.OKKSKIN_CODEX_CANDIDATES = "/no/such/App.app";
  assert.throws(() => findCodexBundle());
  delete process.env.OKKSKIN_CODEX_CANDIDATES;
});
