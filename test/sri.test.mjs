import { test } from "node:test";
import assert from "node:assert/strict";
import { sriOf, verifySri } from "../src/sri.mjs";

const bytes = Buffer.from("hello okkskin");

test("sriOf produces sha384- prefixed base64", () => {
  const s = sriOf(bytes);
  assert.match(s, /^sha384-[A-Za-z0-9+/]+=*$/);
});
test("verifySri passes for matching bytes", () => {
  assert.equal(verifySri(bytes, sriOf(bytes)), true);
});
test("verifySri fails for tampered bytes", () => {
  assert.equal(verifySri(Buffer.from("tampered"), sriOf(bytes)), false);
});
test("verifySri rejects malformed sri string", () => {
  assert.equal(verifySri(bytes, "md5-xxx"), false);
  assert.equal(verifySri(bytes, "not-an-sri"), false);
});
