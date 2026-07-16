import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const BUNDLE_ID = "com.openai.codex";

/* ───────── macOS ───────── */
function plistValue(bundlePath, key) {
  try {
    return execFileSync("/usr/bin/plutil", ["-extract", key, "raw", "-o", "-", path.join(bundlePath, "Contents/Info.plist")], { encoding: "utf8" }).trim();
  } catch { return ""; }
}
function findMacBundle() {
  const override = process.env.OKKSKIN_CODEX_CANDIDATES;
  const candidates = override
    ? override.split(":")
    : ["/Applications/ChatGPT.app", path.join(process.env.HOME || "", "Applications/ChatGPT.app")];
  let bundlePath = candidates.find((c) => fs.existsSync(c) && plistValue(c, "CFBundleIdentifier") === BUNDLE_ID);
  if (!bundlePath && !override) {
    try {
      const hit = execFileSync("/usr/bin/mdfind", [`kMDItemCFBundleIdentifier == "${BUNDLE_ID}"`], { encoding: "utf8" }).split("\n")[0].trim();
      if (hit && fs.existsSync(hit)) bundlePath = hit;
    } catch { /* mdfind unavailable */ }
  }
  if (!bundlePath) throw new Error(`could not find Codex app bundle (${BUNDLE_ID})`);
  const exe = plistValue(bundlePath, "CFBundleExecutable");
  const execPath = path.join(bundlePath, "Contents/MacOS", exe);
  if (!fs.existsSync(execPath)) throw new Error(`Codex executable missing: ${execPath}`);
  return { bundlePath, execPath, bundleId: BUNDLE_ID };
}

/* ───────── Windows(Store Appx: OpenAI.Codex) ───────── */
function winAppx() {
  const ps = "$p=Get-AppxPackage OpenAI.Codex | Select-Object -First 1; if($p){[pscustomobject]@{Loc=$p.InstallLocation;Sig=$p.SignatureKind}|ConvertTo-Json -Compress}";
  let out;
  try { out = execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", ps], { encoding: "utf8" }).trim(); }
  catch { return null; }
  if (!out) return null;
  try { return JSON.parse(out); } catch { return null; }
}
function findWinBundle() {
  const info = winAppx();
  if (!info || !info.Loc) throw new Error("找不到 Codex(OpenAI.Codex);请确认已从应用商店安装");
  const cands = [path.join(info.Loc, "ChatGPT.exe"), path.join(info.Loc, "app", "ChatGPT.exe")];
  const execPath = cands.find((c) => fs.existsSync(c));
  if (!execPath) throw new Error("找不到 ChatGPT.exe(在 " + info.Loc + ")");
  return { bundlePath: info.Loc, execPath, bundleId: BUNDLE_ID, signatureKind: info.Sig };
}

/* ───────── 跨平台入口 ───────── */
export function findCodexBundle() {
  return process.platform === "win32" ? findWinBundle() : findMacBundle();
}

// mac: codesign 校验官方签名;win: Appx SignatureKind 必须为 Store。
export function verifyCodexSignature(bundlePath) {
  if (process.platform === "win32") {
    const info = winAppx();
    return !!info && info.Sig === "Store";
  }
  try {
    execFileSync("/usr/bin/codesign", ["--verify", "--deep", "--strict", bundlePath], { stdio: "ignore" });
    return true;
  } catch { return false; }
}
