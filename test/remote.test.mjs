import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canonical } from "../src/manifest.mjs";
import { sriOf } from "../src/sri.mjs";

// resolveRemoteTheme 依赖白名单(仅 jsdelivr),本测试聚焦"校验链失败即拒"的纯逻辑:
// 用 resolveFromParts 直接喂 bytes,绕开网络与白名单(网络+白名单已在 fetchsafe 测过)。
import { resolveFromParts, RemoteError } from "../src/remote.mjs";

const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
const pub = publicKey.export({ type: "spki", format: "pem" }).toString();

const themeJson = JSON.stringify({
  schemaVersion: 1, id: "x", name: "n", variant: "dark", image: "bg.jpg",
  colors: { background: "#000000", panel: "#111111", accent: "#222222", text: "#333333", muted: "#444444", line: "#555555" },
});
const themeBytes = Buffer.from(themeJson);
const here = path.dirname(fileURLToPath(import.meta.url));
const imgBytes = fs.readFileSync(path.join(here, "fixtures", "real.jpg"));

function manifestFor(themeSri, imageSri, version = 1) {
  const payload = { skinId: "x", version, variant: "dark",
    themeUrl: "https://cdn.jsdelivr.net/gh/okkmax/codex-skins@abc123/skins/x/theme.json",
    themeSri, imageUrl: "https://cdn.jsdelivr.net/gh/okkmax/codex-skins@abc123/skins/x/bg.jpg",
    imageMirror: "", imageSri };
  const sig = crypto.sign(null, Buffer.from(canonical(payload)), privateKey).toString("base64");
  return { payload, sig };
}

test("resolveFromParts returns validated theme when all checks pass", () => {
  const m = manifestFor(sriOf(themeBytes), sriOf(imgBytes));
  const t = resolveFromParts(m, themeBytes, imgBytes, pub, 0);
  assert.equal(t.id, "x");
  assert.ok(t.imagePath && fs.existsSync(t.imagePath));
});
test("rejects when themeSri mismatches", () => {
  const m = manifestFor("sha384-wrong", sriOf(imgBytes));
  assert.throws(() => resolveFromParts(m, themeBytes, imgBytes, pub, 0), RemoteError);
});
test("rejects when imageSri mismatches", () => {
  const m = manifestFor(sriOf(themeBytes), "sha384-wrong");
  assert.throws(() => resolveFromParts(m, themeBytes, imgBytes, pub, 0), RemoteError);
});
test("rejects bad signature", () => {
  const m = manifestFor(sriOf(themeBytes), sriOf(imgBytes));
  m.sig = Buffer.from("garbage").toString("base64");
  assert.throws(() => resolveFromParts(m, themeBytes, imgBytes, pub, 0), Error);
});
test("rejects svg image bytes even if sri matches", () => {
  const svg = Buffer.from("<svg/>");
  const m = manifestFor(sriOf(themeBytes), sriOf(svg));
  assert.throws(() => resolveFromParts(m, themeBytes, svg, pub, 0), Error);
});
