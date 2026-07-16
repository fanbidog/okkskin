import crypto from "node:crypto";

export class ManifestError extends Error {}

const FIELDS = ["skinId", "version", "variant", "themeUrl", "themeSri", "imageUrl", "imageMirror", "imageSri"];

// 规范化:按固定字段顺序序列化,签名与验签必须用同一函数
export function canonical(payload) {
  const o = {};
  for (const k of FIELDS) o[k] = payload[k];
  return JSON.stringify(o);
}

export function verifyManifest(manifest, publicKeyPem, lastSeenVersion) {
  if (!manifest || typeof manifest !== "object") throw new ManifestError("manifest not an object");
  const { payload, sig } = manifest;
  if (!payload || typeof payload !== "object") throw new ManifestError("missing payload");
  if (typeof sig !== "string") throw new ManifestError("missing sig");
  for (const k of Object.keys(payload)) if (!FIELDS.includes(k)) throw new ManifestError(`unknown payload field: ${k}`);
  for (const k of FIELDS) if (!(k in payload)) throw new ManifestError(`missing payload field: ${k}`);
  if (!Number.isInteger(payload.version) || payload.version < 1) throw new ManifestError("bad version");
  let ok = false;
  try { ok = crypto.verify(null, Buffer.from(canonical(payload)), publicKeyPem, Buffer.from(sig, "base64")); }
  catch { throw new ManifestError("signature verify error"); }
  if (!ok) throw new ManifestError("signature invalid");
  if (payload.version <= lastSeenVersion) throw new ManifestError(`rollback: version ${payload.version} <= seen ${lastSeenVersion}`);
  return payload;
}
