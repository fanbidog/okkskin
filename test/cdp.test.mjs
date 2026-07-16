import { test } from "node:test";
import assert from "node:assert/strict";
import { assertLoopbackWsUrl } from "../src/cdp.mjs";

test("accepts loopback ws url on matching port", () => {
  assert.doesNotThrow(() => assertLoopbackWsUrl("ws://127.0.0.1:51234/devtools/page/AB", 51234));
});
test("rejects non-loopback host", () => {
  assert.throws(() => assertLoopbackWsUrl("ws://10.0.0.5:51234/x", 51234));
});
test("rejects port mismatch and non-ws scheme", () => {
  assert.throws(() => assertLoopbackWsUrl("ws://127.0.0.1:9999/x", 51234));
  assert.throws(() => assertLoopbackWsUrl("http://127.0.0.1:51234/x", 51234));
});
