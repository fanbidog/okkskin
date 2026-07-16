import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidColor } from "../src/colors.mjs";

test("accepts 6-digit hex", () => {
  assert.equal(isValidColor("#0b0f1a"), true);
  assert.equal(isValidColor("#A78BFA"), true);
});
test("rejects 3-digit hex and non-hex", () => {
  assert.equal(isValidColor("#fff"), false);
  assert.equal(isValidColor("red"), false);
  assert.equal(isValidColor("#12345g"), false);
});
test("accepts rgb/rgba within range", () => {
  assert.equal(isValidColor("rgb(10,20,30)"), true);
  assert.equal(isValidColor("rgba(167,139,250,.22)"), true);
  assert.equal(isValidColor("rgba(0,0,0,1)"), true);
});
test("rejects out-of-range channels and alpha", () => {
  assert.equal(isValidColor("rgb(256,0,0)"), false);
  assert.equal(isValidColor("rgba(0,0,0,2)"), false);
  assert.equal(isValidColor("rgba(0,0,0,-1)"), false);
});
test("rejects non-strings and injection attempts", () => {
  assert.equal(isValidColor(123), false);
  assert.equal(isValidColor("#000; } body{}"), false);
  assert.equal(isValidColor("url(x)"), false);
});
