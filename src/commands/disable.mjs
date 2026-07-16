import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { clearState } from "../state.mjs";
import { findCodexMainPid, pulse } from "../pulse.mjs";
import { RESTORE_EXPR } from "../engine.mjs";

const HOME = process.env.HOME;
const LABEL = "com.okkmax.okkskin";
const PLIST = path.join(HOME, "Library/LaunchAgents", LABEL + ".plist");

export async function run() {
  const uid = process.getuid();
  try { execFileSync("/bin/launchctl", ["bootout", `gui/${uid}/${LABEL}`], { stdio: "ignore" }); } catch { /* 未加载 */ }
  try { fs.rmSync(PLIST, { force: true }); } catch { /* 已删 */ }
  if (findCodexMainPid()) {
    try { await pulse(RESTORE_EXPR); }
    catch (e) { console.warn("okkskin: 还原脉冲未完成:" + e.message); }
  }
  clearState();
  console.log("okkskin: 已停用常驻、移除皮肤、卸载 agent。");
}
