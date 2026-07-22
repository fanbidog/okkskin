import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { findCodexBundle, verifyCodexSignature, isStoreSignature } from "../src/codex.mjs";

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
// Windows 回归:ConvertTo-Json 把 SignatureKind 枚举序列化成数字(Store=3)也必须认。
test("isStoreSignature accepts string and numeric Store, rejects others", () => {
  assert.equal(isStoreSignature("Store"), true);
  assert.equal(isStoreSignature(3), true);   // PowerShell 5.1 枚举 → 数字
  assert.equal(isStoreSignature("3"), true);
  assert.equal(isStoreSignature("Developer"), false);
  assert.equal(isStoreSignature(1), false);
  assert.equal(isStoreSignature(undefined), false);
});

test("findCodexBundle throws when nothing matches", () => {
  process.env.OKKSKIN_CODEX_CANDIDATES = "/no/such/App.app";
  assert.throws(() => findCodexBundle());
  delete process.env.OKKSKIN_CODEX_CANDIDATES;
});
