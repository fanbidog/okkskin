import fs from "node:fs";
import path from "node:path";
import { isValidColor } from "./colors.mjs";

export class ThemeError extends Error {}

const TOP = new Set(["schemaVersion", "id", "name", "variant", "image", "colors"]);
const COLORS = ["background", "panel", "accent", "text", "muted", "line"];

export function validateTheme(obj) {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) throw new ThemeError("theme must be an object");
  for (const k of Object.keys(obj)) if (!TOP.has(k)) throw new ThemeError(`unknown field: ${k}`);
  if (obj.schemaVersion !== 1) throw new ThemeError("schemaVersion must be 1");
  if (typeof obj.id !== "string" || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(obj.id)) throw new ThemeError("invalid id");
  if (typeof obj.name !== "string" || obj.name.length < 1 || obj.name.length > 80) throw new ThemeError("invalid name");
  if (obj.variant !== "light" && obj.variant !== "dark") throw new ThemeError("variant must be light|dark");
  if (typeof obj.image !== "string" || obj.image !== path.basename(obj.image) || obj.image.startsWith(".")) throw new ThemeError("image must be a bare filename");
  const c = obj.colors;
  if (c === null || typeof c !== "object" || Array.isArray(c)) throw new ThemeError("colors must be an object");
  for (const k of Object.keys(c)) if (!COLORS.includes(k)) throw new ThemeError(`unknown color: ${k}`);
  for (const k of COLORS) {
    if (!(k in c)) throw new ThemeError(`missing color: ${k}`);
    if (!isValidColor(c[k])) throw new ThemeError(`invalid color ${k}: ${c[k]}`);
  }
  return obj;
}

export function loadLocalTheme(dir) {
  const jsonPath = path.join(dir, "theme.json");
  let raw;
  try { raw = JSON.parse(fs.readFileSync(jsonPath, "utf8")); }
  catch (e) { throw new ThemeError(`cannot read ${jsonPath}: ${e.message}`); }
  const t = validateTheme(raw);
  const imagePath = path.join(dir, t.image);
  if (!fs.existsSync(imagePath)) throw new ThemeError(`image not found: ${imagePath}`);
  return { ...t, imagePath };
}
