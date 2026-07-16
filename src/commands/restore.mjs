import { readState, clearState } from "../state.mjs";
import { killWatcher } from "../proc.mjs";
import { findCodexBundle } from "../codex.mjs";
import { quitCodex, launchCodexNormally } from "../launch.mjs";

export async function run() {
  const s = readState();
  if (s?.watcherPid) killWatcher(s.watcherPid);
  quitCodex();
  await new Promise((r) => setTimeout(r, 1500));
  launchCodexNormally(findCodexBundle().bundlePath); // 无调试口重启 → 关闭 CDP、皮肤消失
  clearState();
  console.log("okkskin: restored (debug port closed, Codex relaunched normally).");
}
