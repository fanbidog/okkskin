import { test } from "node:test";
import assert from "node:assert/strict";
import { OK_CLASS, FIXED_CSS, themeToVars, BRAND_CHROME_SELECTORS } from "../src/inject.mjs";

const theme = {
  variant: "dark",
  colors: { background: "#0b0f1a", panel: "#12172a", accent: "#a78bfa", text: "#ece9f5", muted: "#8a86a3", line: "rgba(167,139,250,.22)" },
};

test("themeToVars maps every color to an --ok-* variable", () => {
  const v = themeToVars(theme);
  assert.equal(v["--ok-bg"], "#0b0f1a");
  assert.equal(v["--ok-accent"], "#a78bfa");
  assert.equal(v["--ok-line"], "rgba(167,139,250,.22)");
  assert.equal(Object.keys(v).length, 6);
});
test("FIXED_CSS contains NO theme color values (no string concat of data)", () => {
  for (const val of Object.values(theme.colors)) {
    assert.ok(!FIXED_CSS.includes(val), `FIXED_CSS must not embed ${val}`);
  }
});
test("FIXED_CSS references our class and art var, not brand chrome", () => {
  assert.ok(FIXED_CSS.includes(`html.${OK_CLASS}`));
  assert.ok(FIXED_CSS.includes("var(--ok-art)"));
  for (const sel of BRAND_CHROME_SELECTORS) {
    assert.ok(!FIXED_CSS.includes(sel), `FIXED_CSS must not contain removed brand chrome ${sel}`);
  }
});
