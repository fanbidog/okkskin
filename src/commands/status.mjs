import { readState } from "../state.mjs";
import { findCodexMainPid } from "../pulse.mjs";

export async function run() {
  const s = readState();
  const mainPid = findCodexMainPid();
  if (!s) { console.log(`okkskin: 无活动皮肤${mainPid ? "(Codex 运行中)" : "(Codex 未运行)"}`); return; }
  const codexAlive = !!mainPid && mainPid === s.codexPid;
  console.log(JSON.stringify({ ...s, codexAlive, note: "脉冲注入模型:调试口非常开,仅注入瞬间开启后立即关闭" }, null, 2));
}
