import { execFile } from "node:child_process";

// 正常启动 Codex(不带调试口、不重启)。仅 macOS;Windows 待补。
export function launchCodexNormally(bundlePath) {
  execFile("/usr/bin/open", ["-a", bundlePath]);
}
