import { test } from "node:test";
import assert from "node:assert/strict";
import { assertAllowedUrl, readCapped, ALLOWED_PREFIXES } from "../src/fetchsafe.mjs";

test("allows pinned fanbidog/codex-skins jsdelivr path", () => {
  assert.doesNotThrow(() => assertAllowedUrl("https://cdn.jsdelivr.net/gh/fanbidog/codex-skins@a1b2c3d/skins/x/bg.jpg"));
});
test("rejects other repos on same host", () => {
  assert.throws(() => assertAllowedUrl("https://cdn.jsdelivr.net/gh/attacker/evil@x/y.jpg"));
});
test("rejects @main (must be pinned ref, not a branch)", () => {
  assert.throws(() => assertAllowedUrl("https://cdn.jsdelivr.net/gh/fanbidog/codex-skins@main/skins/x/bg.jpg"));
});
test("rejects other hosts and http", () => {
  assert.throws(() => assertAllowedUrl("https://evil.com/x.jpg"));
  assert.throws(() => assertAllowedUrl("http://cdn.jsdelivr.net/gh/fanbidog/codex-skins@abc/x.jpg"));
});
test("readCapped aborts over the byte cap", async () => {
  const big = new ReadableStream({ start(c) { c.enqueue(new Uint8Array(1024 * 1024)); c.enqueue(new Uint8Array(1024 * 1024)); c.close(); } });
  await assert.rejects(() => readCapped(big, 1024 * 1024), /exceeds/);
});
test("readCapped returns bytes under the cap", async () => {
  const small = new ReadableStream({ start(c) { c.enqueue(new Uint8Array([1, 2, 3])); c.close(); } });
  const buf = await readCapped(small, 1024);
  assert.equal(buf.length, 3);
});
