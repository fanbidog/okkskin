import { test } from "node:test";
import assert from "node:assert/strict";
import { sniffImageType } from "../src/image.mjs";

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const webp = Buffer.concat([Buffer.from("RIFF"), Buffer.from([0, 0, 0, 0]), Buffer.from("WEBP")]);
const svg = Buffer.from("<svg xmlns='...'>");
const gif = Buffer.from("GIF89a");

test("sniffs png/jpg/webp", () => {
  assert.equal(sniffImageType(png), "png");
  assert.equal(sniffImageType(jpg), "jpg");
  assert.equal(sniffImageType(webp), "webp");
});
test("rejects svg/gif/unknown as null", () => {
  assert.equal(sniffImageType(svg), null);
  assert.equal(sniffImageType(gif), null);
  assert.equal(sniffImageType(Buffer.from("<html>")), null);
});
