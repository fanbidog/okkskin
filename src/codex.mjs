import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const BUNDLE_ID = "com.openai.codex";

function plistValue(bundlePath, key) {
  try {
    return execFileSync("/usr/bin/plutil", ["-extract", key, "raw", "-o", "-", path.join(bundlePath, "Contents/Info.plist")], { encoding: "utf8" }).trim();
  } catch { return ""; }
}

export function findCodexBundle() {
  const override = process.env.OKKSKIN_CODEX_CANDIDATES;
  const candidates = override
    ? override.split(":")
    : ["/Applications/ChatGPT.app", path.join(process.env.HOME, "Applications/ChatGPT.app")];
  let bundlePath = candidates.find((c) => fs.existsSync(c) && plistValue(c, "CFBundleIdentifier") === BUNDLE_ID);
  // 只有在未显式指定候选时才用 Spotlight 兜底(显式指定 = 只认这些)
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

export function verifyCodexSignature(bundlePath) {
  try {
    execFileSync("/usr/bin/codesign", ["--verify", "--deep", "--strict", bundlePath], { stdio: "ignore" });
    return true;
  } catch { return false; }
}
