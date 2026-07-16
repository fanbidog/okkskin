import crypto from "node:crypto";

export function sriOf(bytes) {
  const hash = crypto.createHash("sha384").update(bytes).digest("base64");
  return `sha384-${hash}`;
}
export function verifySri(bytes, sri) {
  if (typeof sri !== "string" || !sri.startsWith("sha384-")) return false;
  const expected = sri.slice("sha384-".length);
  const actual = crypto.createHash("sha384").update(bytes).digest("base64");
  const a = Buffer.from(actual), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
