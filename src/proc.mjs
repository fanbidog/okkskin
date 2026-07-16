import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const watcherScript = path.join(path.dirname(fileURLToPath(import.meta.url)), "watcher.mjs");

export function spawnWatcher(port, themeDir, codexPid) {
  const child = spawn(process.execPath, [watcherScript, String(port), themeDir, String(codexPid)],
    { detached: true, stdio: "ignore" });
  child.unref();
  return child.pid;
}
export function killWatcher(pid) {
  if (!pid) return;
  try { process.kill(pid, "SIGTERM"); } catch { /* already gone */ }
}
