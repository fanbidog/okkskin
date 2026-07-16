import { readState } from "../state.mjs";
import { isSameCodexProcess } from "../watcher.mjs";

export async function run() {
  const s = readState();
  if (!s) { console.log("okkskin: no active skin"); return; }
  const alive = isSameCodexProcess(s.codexPid);
  console.log(JSON.stringify({ ...s, codexAlive: alive, risk: "CDP debug port open on 127.0.0.1:" + s.port }, null, 2));
}
