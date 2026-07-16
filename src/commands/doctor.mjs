import { findCodexBundle, verifyCodexSignature } from "../codex.mjs";
import { loadLocalTheme } from "../theme.mjs";
import { readState } from "../state.mjs";

export async function run(args) {
  const checks = [];
  try { const b = findCodexBundle(); checks.push(["Codex bundle", b.bundlePath]);
    checks.push(["signature", verifyCodexSignature(b.bundlePath) ? "ok" : "INVALID"]);
  } catch (e) { checks.push(["Codex bundle", "FAIL: " + e.message]); }
  if (args[0]) { try { const t = loadLocalTheme(args[0]); checks.push(["theme", `ok (${t.id})`]); }
    catch (e) { checks.push(["theme", "FAIL: " + e.message]); } }
  const s = readState();
  checks.push(["state", s ? `active skin=${s.skinId} port=${s.port}` : "none"]);
  checks.push(["DOM markers", "run against live Codex to confirm (main.main-surface / aside.app-shell-left-panel / .composer-surface-chrome)"]);
  for (const [k, v] of checks) console.log(`${k.padEnd(14)} ${v}`);
}
