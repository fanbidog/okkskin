import { clearState } from "../state.mjs";
import { findCodexMainPid, pulse } from "../pulse.mjs";
import { RESTORE_EXPR } from "../engine.mjs";
import { uninstallAgent } from "../persist.mjs";

export async function run() {
  uninstallAgent();
  if (findCodexMainPid()) {
    try { await pulse(RESTORE_EXPR); }
    catch (e) { console.warn("okkskin: 还原脉冲未完成:" + e.message); }
  }
  clearState();
  console.log("okkskin: 已停用常驻、移除皮肤、卸载 agent。");
}
