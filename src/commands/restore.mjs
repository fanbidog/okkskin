import { clearState } from "../state.mjs";
import { findCodexMainPid, pulse } from "../pulse.mjs";
import { RESTORE_EXPR } from "../engine.mjs";

export async function run() {
  if (findCodexMainPid()) {
    try { await pulse(RESTORE_EXPR); }
    catch (e) { console.warn("okkskin: 还原脉冲未完成(Codex 可能正在关闭):" + e.message); }
  }
  clearState();
  console.log("okkskin: 已还原(移除皮肤,调试口已关,未重启 Codex)");
}
