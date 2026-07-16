import fs from "node:fs";
import path from "node:path";
import { verifyManifest } from "./manifest.mjs";
import { verifySri } from "./sri.mjs";
import { validateTheme } from "./theme.mjs";
import { sanitizeImage } from "./image.mjs";
import { fetchAllowed, assertAllowedUrl } from "./fetchsafe.mjs";
import { OKKSKIN_PUBKEY } from "./pubkey.mjs";

export class RemoteError extends Error {}

const MAX_THEME = 64 * 1024;      // theme JSON ≤ 64KB
const MAX_IMAGE = 16 * 1024 * 1024;

// 纯校验:给定 manifest + 已取到的 bytes,跑完整信任链,返回 {theme..., imagePath}
export function resolveFromParts(manifest, themeBytes, imageBytes, pubkey, lastVersion) {
  const payload = verifyManifest(manifest, pubkey, lastVersion); // 验签 + 防回滚 + fail-closed
  if (!verifySri(themeBytes, payload.themeSri)) throw new RemoteError("theme SRI mismatch");
  if (!verifySri(imageBytes, payload.imageSri)) throw new RemoteError("image SRI mismatch");
  let theme;
  try { theme = validateTheme(JSON.parse(themeBytes.toString("utf8"))); }
  catch (e) { throw new RemoteError(`theme invalid: ${e.message}`); }
  if (theme.id !== payload.skinId) throw new RemoteError("skinId mismatch between manifest and theme");
  const imagePath = sanitizeImage(imageBytes); // sniff + 转码 + 像素上限
  return { ...theme, imagePath, version: payload.version };
}

// 联网:slug → manifest URL(钉死 ref 由调用方给全 URL,或按约定拼)→ 取 → resolveFromParts
export async function resolveRemoteTheme(manifestUrl, lastVersionFor) {
  assertAllowedUrl(manifestUrl);
  const manifestBytes = await fetchAllowed(manifestUrl, MAX_THEME);
  let manifest;
  try { manifest = JSON.parse(manifestBytes.toString("utf8")); }
  catch { throw new RemoteError("manifest not JSON"); }
  const last = lastVersionFor(manifest?.payload?.skinId ?? "");
  // 先只验签拿到 payload 里的 URL(themeUrl/imageUrl 也在白名单内)
  const themeBytes = await fetchAllowed(manifest.payload.themeUrl, MAX_THEME);
  let imageBytes;
  try { imageBytes = await fetchAllowed(manifest.payload.imageUrl, MAX_IMAGE); }
  catch (e) {
    if (manifest.payload.imageMirror) imageBytes = await fetchAllowed(manifest.payload.imageMirror, MAX_IMAGE);
    else throw e;
  }
  return resolveFromParts(manifest, themeBytes, imageBytes, OKKSKIN_PUBKEY, last);
}
