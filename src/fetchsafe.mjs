// 完整路径前缀白名单。okkmax 自托管为主(固定路径,完整性靠签名 + version 防回滚);
// jsDelivr 两条保留向后兼容(推特首发那批,ref 必须钉死的 commit/tag,不接受 @main)。
export const ALLOWED_PREFIXES = [
  /^https:\/\/www\.okkmax\.com\/skins\/[a-z0-9][a-z0-9-]{0,63}\//,
  /^https:\/\/cdn\.jsdelivr\.net\/gh\/fanbidog\/codex-skins@[0-9a-f]{7,40}\//,
  /^https:\/\/cdn\.jsdelivr\.net\/gh\/fanbidog\/codex-skins@v[0-9][0-9A-Za-z.\-]*\//,
];

export function assertAllowedUrl(url) {
  if (typeof url !== "string" || !ALLOWED_PREFIXES.some((re) => re.test(url))) {
    throw new Error(`url not in whitelist: ${url}`);
  }
  return url;
}

export async function readCapped(stream, maxBytes) {
  const reader = stream.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) { try { await reader.cancel(); } catch { /* ignore */ } throw new Error(`response exceeds ${maxBytes} bytes`); }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

// 取白名单内 URL,禁重定向,流式硬截断
export async function fetchAllowed(url, maxBytes) {
  assertAllowedUrl(url);
  const res = await fetch(url, { redirect: "error" });
  if (!res.ok) throw new Error(`fetch ${url}: HTTP ${res.status}`);
  return readCapped(res.body, maxBytes);
}
