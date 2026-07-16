import { execFileSync, execFile } from "node:child_process";
import crypto from "node:crypto";

export function randomPort() {
  return 20000 + (crypto.randomInt(45535)); // 20000–65534
}
export function quitCodex() {
  try { execFileSync("/usr/bin/osascript", ["-e", 'tell application "ChatGPT" to quit']); } catch { /* not running */ }
  try { execFileSync("/usr/bin/pkill", ["-x", "ChatGPT"]); } catch { /* already gone */ }
}
export function launchCodexWithCdp(bundlePath, port) {
  execFile("/usr/bin/open", ["-na", bundlePath, "--args",
    "--remote-debugging-address=127.0.0.1", `--remote-debugging-port=${port}`]);
}
export function launchCodexNormally(bundlePath) {
  execFile("/usr/bin/open", ["-a", bundlePath]);
}
export async function waitForCdp(port, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) { const list = await res.json(); if (list.some((t) => (t.url || "").startsWith("app://"))) return true; }
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}
