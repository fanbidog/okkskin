// 完整路径前缀白名单:只认我们仓库、且 ref 必须是钉死的(40 位十六进制 commit 或 tag),不接受 @main
export const ALLOWED_PREFIXES = [
  /^https:\/\/cdn\.jsdelivr\.net\/gh\/okkmax\/codex-skins@[0-9a-f]{7,40}\//,
  /^https:\/\/cdn\.jsdelivr\.net\/gh\/okkmax\/codex-skins@v[0-9][0-9A-Za-z.\-]*\//,
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
