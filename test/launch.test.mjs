import { test } from "node:test";
import assert from "node:assert/strict";
import { randomPort } from "../src/launch.mjs";

test("randomPort in high range", () => {
  for (let i = 0; i < 100; i++) {
    const p = randomPort();
    assert.ok(p >= 20000 && p <= 65535, `port ${p} out of range`);
  }
});
