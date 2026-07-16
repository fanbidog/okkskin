import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function stateDir() {
  if (process.env.OKKSKIN_STATE_DIR) return process.env.OKKSKIN_STATE_DIR;
  if (process.platform === "win32")
    return path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "okkskin");
  return path.join(os.homedir(), "Library", "Application Support", "okkskin");
}
export function statePath() { return path.join(stateDir(), "state.json"); }
export function currentDir() { return path.join(stateDir(), "current"); }

export function readState() {
  try { return JSON.parse(fs.readFileSync(statePath(), "utf8")); }
  catch { return null; }
}
export function writeState(s) {
  fs.mkdirSync(stateDir(), { recursive: true });
  const tmp = statePath() + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(s, null, 2));
  fs.renameSync(tmp, statePath()); // 原子替换
}
export function clearState() {
  try { fs.unlinkSync(statePath()); } catch { /* already gone */ }
}
export function lastManifestVersion(skinId) {
  const s = readState();
  return (s && s.seenVersions && s.seenVersions[skinId]) || 0;
}
export function recordManifestVersion(skinId, version) {
  const s = readState() || {};
  s.seenVersions = s.seenVersions || {};
  s.seenVersions[skinId] = version;
  writeState(s);
}
