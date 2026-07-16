import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { canonical, verifyManifest, ManifestError } from "../src/manifest.mjs";

const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
const pubPem = publicKey.export({ type: "spki", format: "pem" }).toString();

function make(payload) {
  const sig = crypto.sign(null, Buffer.from(canonical(payload)), privateKey).toString("base64");
  return { payload, sig };
}
const goodPayload = {
  skinId: "purple-night", version: 3, variant: "dark",
  themeUrl: "https://cdn.jsdelivr.net/gh/fanbidog/codex-skins@abc/skins/purple-night/theme.json",
  themeSri: "sha384-x", imageUrl: "https://cdn.jsdelivr.net/gh/fanbidog/codex-skins@abc/skins/purple-night/bg.jpg",
  imageMirror: "", imageSri: "sha384-y",
};

test("verifyManifest accepts a valid signature", () => {
  const m = verifyManifest(make(goodPayload), pubPem, 0);
  assert.equal(m.skinId, "purple-night");
});
test("rejects tampered payload (sig mismatch)", () => {
  const m = make(goodPayload);
  m.payload.themeUrl = m.payload.themeUrl.replace("abc", "evil");
  assert.throws(() => verifyManifest(m, pubPem, 0), ManifestError);
});
test("rejects wrong public key", () => {
  const other = crypto.generateKeyPairSync("ed25519").publicKey.export({ type: "spki", format: "pem" }).toString();
  assert.throws(() => verifyManifest(make(goodPayload), other, 0), ManifestError);
});
test("anti-rollback: rejects version <= last seen", () => {
  assert.throws(() => verifyManifest(make(goodPayload), pubPem, 3), ManifestError);
  assert.throws(() => verifyManifest(make(goodPayload), pubPem, 5), ManifestError);
});
test("rejects unknown payload fields (fail-closed)", () => {
  const m = make({ ...goodPayload, evil: 1 });
  assert.throws(() => verifyManifest(m, pubPem, 0), ManifestError);
});
