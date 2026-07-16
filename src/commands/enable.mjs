import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { loadLocalTheme } from "../theme.mjs";
import { resolveRemoteTheme } from "../remote.mjs";
import { lastManifestVersion, readState, writeState } from "../state.mjs";
import { findCodexBundle, verifyCodexSignature } from "../codex.mjs";
import { findCodexMainPid, pulse } from "../pulse.mjs";
import { rendererInjectJS, readImageB64, mimeForTheme, buildApplyExpr } from "../engine.mjs";

const HOME = process.env.HOME;
const STATE_DIR = path.join(HOME, "Library/Application Support/okkskin");
const CURRENT = path.join(STATE_DIR, "current");
const LABEL = "com.okkmax.okkskin";
const PLIST = path.join(HOME, "Library/LaunchAgents", LABEL + ".plist");
const AGENT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "agent.mjs");

async function resolveTheme(target) {
  if (target.startsWith("https://")) return resolveRemoteTheme(target, lastManifestVersion);
  const abs = path.resolve(target);
  if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) return loadLocalTheme(abs);
  throw new Error("请传完整 https URL 或本地主题目录");
}

// 把主题暂存到稳定目录,供常驻 agent 每次重套读取
function stage(theme) {
  fs.rmSync(CURRENT, { recursive: true, force: true });
  fs.mkdirSync(CURRENT, { recursive: true });
  const ext = path.extname(theme.imagePath) || ".jpg";
  fs.copyFileSync(theme.imagePath, path.join(CURRENT, "bg" + ext));
  fs.writeFileSync(path.join(CURRENT, "theme.json"), JSON.stringify({
    schemaVersion: 1, id: theme.id, name: theme.name, variant: theme.variant,
    image: "bg" + ext, colors: theme.colors,
  }));
}

function writePlist() {
  fs.mkdirSync(path.dirname(PLIST), { recursive: true });
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>${LABEL}</string>
  <key>ProgramArguments</key><array>
    <string>${process.execPath}</string>
    <string>${AGENT}</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>${path.join(STATE_DIR, "agent.log")}</string>
  <key>StandardErrorPath</key><string>${path.join(STATE_DIR, "agent.log")}</string>
</dict></plist>`;
  fs.writeFileSync(PLIST, plist);
}

function agentLoaded(uid) {
  try { execFileSync("/bin/launchctl", ["print", `gui/${uid}/${LABEL}`], { stdio: "ignore" }); return true; }
  catch { return false; }
}

// 幂等加载:已加载就 kickstart 重启(避免对已加载的 label 重复 bootstrap 报 EIO);未加载才 bootstrap;失败自愈重试。
function loadAgent(uid) {
  if (agentLoaded(uid)) {
    try { execFileSync("/bin/launchctl", ["kickstart", "-k", `gui/${uid}/${LABEL}`], { stdio: "ignore" }); } catch { /* ignore */ }
    return;
  }
  try { execFileSync("/bin/launchctl", ["bootstrap", `gui/${uid}`, PLIST]); return; }
  catch {
    try { execFileSync("/bin/launchctl", ["bootout", `gui/${uid}/${LABEL}`], { stdio: "ignore" }); } catch { /* ignore */ }
    execFileSync("/bin/launchctl", ["bootstrap", `gui/${uid}`, PLIST]); // 再试一次,还失败就抛出
  }
}

export async function run(args) {
  const target = args[0];
  if (!target) throw new Error("用法: okkskin enable <主题目录|URL>");
  const theme = await resolveTheme(target);
  const codex = findCodexBundle();
  if (!verifyCodexSignature(codex.bundlePath)) throw new Error("Codex 签名校验未通过,拒绝启用");

  stage(theme);
  writeState({ skinId: theme.id, enabled: true, appliedPid: null, startedAt: new Date().toISOString() });
  writePlist();
  loadAgent(process.getuid());

  // 若 Codex 正在跑,立即套一次(否则等它下次启动由 agent 套)
  if (findCodexMainPid()) {
    const rjs = rendererInjectJS(theme, readImageB64(theme), mimeForTheme(theme));
    await pulse(buildApplyExpr(rjs));
    writeState({ ...readState(), appliedPid: findCodexMainPid() });
  }
  console.log(`okkskin: 已启用常驻(${theme.id})—— Codex 每次启动都会自动套上。停用:okkskin disable`);
  console.log("⚠ 每次套用会瞬间开一次本地调试口(注完即关);仅个人可信设备使用。");
}
