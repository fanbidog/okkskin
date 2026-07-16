import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { loadLocalTheme, validateTheme, ThemeError } from "../src/theme.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const goodDir = path.join(here, "fixtures", "good-theme");

const base = () => ({
  schemaVersion: 1, id: "x", name: "n", variant: "dark", image: "bg.png",
  colors: { background: "#000000", panel: "#111111", accent: "#222222", text: "#333333", muted: "#444444", line: "#555555" },
});

test("loads a good local theme dir", () => {
  const t = loadLocalTheme(goodDir);
  assert.equal(t.id, "purple-night");
  assert.equal(t.imagePath, path.join(goodDir, "bg.png"));
});
test("rejects unknown top-level field (fail-closed)", () => {
  const o = base(); o.evil = "x";
  assert.throws(() => validateTheme(o), ThemeError);
});
test("rejects unknown color key", () => {
  const o = base(); o.colors.evil = "#000000";
  assert.throws(() => validateTheme(o), ThemeError);
});
test("rejects missing color", () => {
  const o = base(); delete o.colors.accent;
  assert.throws(() => validateTheme(o), ThemeError);
});
test("rejects bad color value", () => {
  const o = base(); o.colors.accent = "red";
  assert.throws(() => validateTheme(o), ThemeError);
});
test("rejects image with path separators", () => {
  const o = base(); o.image = "../evil.png";
  assert.throws(() => validateTheme(o), ThemeError);
});
test("rejects wrong variant / schemaVersion", () => {
  assert.throws(() => validateTheme({ ...base(), variant: "neon" }), ThemeError);
  assert.throws(() => validateTheme({ ...base(), schemaVersion: 2 }), ThemeError);
});
