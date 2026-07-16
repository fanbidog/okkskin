// okkskin 常驻 agent(由 launchd 拉起,RunAtLoad+KeepAlive)。
// 逻辑:每几秒看一次 Codex 主进程;若出现了新进程(区别于上次已套的 pid)→ 脉冲套上已暂存的主题。
// 不持有端口、不重启 Codex;仅在 Codex 新启动的那一下脉冲一次(注完即关口)。
import { setTimeout as sleep } from "node:timers/promises";
import { loadLocalTheme } from "./theme.mjs";
import { findCodexMainPid, pulse } from "./pulse.mjs";
import { rendererInjectJS, readImageB64, mimeForTheme, buildApplyExpr } from "./engine.mjs";
import { readState, writeState, currentDir } from "./state.mjs";

const CURRENT = currentDir();

async function tick() {
  const s = readState();
  if (!s || !s.enabled) return;            // 未启用常驻 → 空转
  const pid = findCodexMainPid();
  if (!pid) return;                        // Codex 没在跑
  if (s.appliedPid === pid) return;        // 这个实例已经套过了
  const theme = loadLocalTheme(CURRENT);   // 暂存主题
  const rjs = rendererInjectJS(theme, readImageB64(theme), mimeForTheme(theme));
  await pulse(buildApplyExpr(rjs));
  writeState({ ...readState(), appliedPid: pid });
}

for (;;) {
  try { await tick(); } catch { /* 窗口还没就绪等下一轮 */ }
  await sleep(3500);
}
