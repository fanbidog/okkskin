export function isValidColor(v) {
  if (typeof v !== "string") return false;
  const s = v.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return true;
  const m = s.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(0|1|0?\.\d+))?\s*\)$/i);
  if (!m) return false;
  const [r, g, b] = [m[1], m[2], m[3]].map(Number);
  if (r > 255 || g > 255 || b > 255) return false;
  if (m[4] !== undefined) {
    const a = Number(m[4]);
    if (!(a >= 0 && a <= 1)) return false;
  }
  return true;
}
