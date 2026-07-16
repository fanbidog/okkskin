import { readState, writeState } from "../state.mjs";
import { killWatcher } from "../proc.mjs";

export async function run() {
  const s = readState();
  if (!s) { console.log("okkskin: nothing to stop"); return; }
  killWatcher(s.watcherPid);
  writeState({ ...s, watcherPid: null });
  console.log("okkskin: watcher stopped. Skin stays until next reload; Codex debug port is STILL OPEN — run 'okkskin restore' to close it.");
}
