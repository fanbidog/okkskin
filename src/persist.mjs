// 常驻 agent 的安装/卸载(跨平台)。Mac = launchd LaunchAgent;Windows = 任务计划程序(登录触发)。
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { stateDir } from "./state.mjs";

const LABEL = "com.okkmax.okkskin";   // macOS launchd label
const WIN_TASK = "OkkSkin";           // Windows 计划任务名

/* ───────── macOS: launchd ───────── */
const plistPath = () => path.join(os.homedir(), "Library/LaunchAgents", LABEL + ".plist");

function macWritePlist(agentPath) {
  const log = path.join(stateDir(), "agent.log");
  fs.mkdirSync(path.dirname(plistPath()), { recursive: true });
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>${LABEL}</string>
  <key>ProgramArguments</key><array>
    <string>${process.execPath}</string>
    <string>${agentPath}</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>${log}</string>
  <key>StandardErrorPath</key><string>${log}</string>
</dict></plist>`;
  fs.writeFileSync(plistPath(), plist);
}
function macLoaded(uid) {
  try { execFileSync("/bin/launchctl", ["print", `gui/${uid}/${LABEL}`], { stdio: "ignore" }); return true; }
  catch { return false; }
}
function macLoad(uid) {
  if (macLoaded(uid)) {
    try { execFileSync("/bin/launchctl", ["kickstart", "-k", `gui/${uid}/${LABEL}`], { stdio: "ignore" }); } catch { /* ignore */ }
    return;
  }
  try { execFileSync("/bin/launchctl", ["bootstrap", `gui/${uid}`, plistPath()]); return; }
  catch {
    try { execFileSync("/bin/launchctl", ["bootout", `gui/${uid}/${LABEL}`], { stdio: "ignore" }); } catch { /* ignore */ }
    execFileSync("/bin/launchctl", ["bootstrap", `gui/${uid}`, plistPath()]);
  }
}
function installMac(agentPath) { macWritePlist(agentPath); macLoad(process.getuid()); }
function uninstallMac() {
  const uid = process.getuid();
  try { execFileSync("/bin/launchctl", ["bootout", `gui/${uid}/${LABEL}`], { stdio: "ignore" }); } catch { /* 未加载 */ }
  try { fs.rmSync(plistPath(), { force: true }); } catch { /* 已删 */ }
}

/* ───────── Windows: 任务计划程序(登录触发,常驻循环) ───────── */
function installWin(agentPath) {
  const tr = `"${process.execPath}" "${agentPath}"`;
  execFileSync("schtasks", ["/Create", "/TN", WIN_TASK, "/SC", "ONLOGON", "/RL", "LIMITED", "/F", "/TR", tr], { stdio: "ignore" });
  try { execFileSync("schtasks", ["/Run", "/TN", WIN_TASK], { stdio: "ignore" }); } catch { /* 首次登录时才跑也行 */ }
}
function uninstallWin() {
  try { execFileSync("schtasks", ["/Delete", "/TN", WIN_TASK, "/F"], { stdio: "ignore" }); } catch { /* 未创建 */ }
}

/* ───────── 入口 ───────── */
export function installAgent(agentPath) {
  return process.platform === "win32" ? installWin(agentPath) : installMac(agentPath);
}
export function uninstallAgent() {
  return process.platform === "win32" ? uninstallWin() : uninstallMac();
}
