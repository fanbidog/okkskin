import path from "node:path";
import { loadLocalTheme } from "../theme.mjs";
import { findCodexBundle, verifyCodexSignature } from "../codex.mjs";
import { randomPort, quitCodex, launchCodexWithCdp, waitForCdp } from "../launch.mjs";
import { listCodexTargets } from "../cdp.mjs";
import { readState, writeState, clearState } from "../state.mjs";
import { killWatcher, spawnWatcher } from "../proc.mjs";
import { execFileSync } from "node:child_process";

export async function run(args) {
  const target = args[0];
  if (!target) throw new Error("usage: okkskin apply <theme-dir>");
  const themeDir = path.resolve(target);
  loadLocalTheme(themeDir); // 先校验,失败则不动现有皮肤

  const prev = readState();
  if (prev?.watcherPid) killWatcher(prev.watcherPid); // 换主题:先停旧 watcher

  const codex = findCodexBundle();
  if (!verifyCodexSignature(codex.bundlePath)) throw new Error("Codex signature invalid — refusing to inject");

  const port = randomPort();
  quitCodex();
  await new Promise((r) => setTimeout(r, 1500));
  launchCodexWithCdp(codex.bundlePath, port);
  if (!(await waitForCdp(port))) { clearState(); throw new Error("Codex CDP did not come up"); }

  const targets = await listCodexTargets(port);
  const codexPid = Number(execFileSync("/usr/bin/pgrep", ["-n", "-x", "ChatGPT"], { encoding: "utf8" }).trim());
  const watcherPid = spawnWatcher(port, themeDir, codexPid);
  writeState({ codexPid, watcherPid, port, skinId: path.basename(themeDir), startedAt: new Date().toISOString() });
  console.log(`okkskin: applied ${path.basename(themeDir)} (port ${port}). Run 'okkskin restore' to remove & close the debug port.`);
  console.log("⚠ Codex debug port is open while it runs; use only on a personal, trusted machine.");
}
