import { execFileSync } from "node:child_process";

const BUNDLE_EXE = "/ChatGPT.app/Contents/MacOS/ChatGPT";

// Codex 主进程 PID(comm 是主执行档且参数不含 --type=,排除 renderer/gpu 等 helper)
export function findCodexMainPid() {
  let out;
  try { out = execFileSync("/bin/ps", ["-axo", "pid=,command="], { encoding: "utf8" }); }
  catch { return null; }
  for (const line of out.split("\n")) {
    const m = line.trim().match(/^(\d+)\s+(.*)$/);
    if (!m) continue;
    const pid = Number(m[1]), cmd = m[2];
    if (cmd.includes(BUNDLE_EXE) && !cmd.includes("--type=")) return pid;
  }
  return null;
}

// SIGUSR1 打开主进程 node inspector,等 9229 就绪,返回 ws url
async function openInspector(pid, port = 9229, timeoutMs = 8000) {
  process.kill(pid, "SIGUSR1");
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) { const list = await res.json(); if (list[0]?.webSocketDebuggerUrl) return list[0].webSocketDebuggerUrl; }
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("node inspector 未在 SIGUSR1 后开启(9229 超时)");
}

/**
 * 脉冲:SIGUSR1 开 inspector → 在主进程 eval 表达式 → 关闭 inspector(_debugEnd)。
 * 端口只在这几百毫秒内开着。返回表达式的值。
 */
export async function pulse(expr, { awaitPromise = false } = {}) {
  const pid = findCodexMainPid();
  if (!pid) throw new Error("Codex 未运行");
  const wsUrl = await openInspector(pid);
  const ws = new WebSocket(wsUrl);
  let id = 0; const pend = new Map();
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id; pend.set(i, { res, rej });
    ws.send(JSON.stringify({ id: i, method, params }));
    setTimeout(() => { if (pend.delete(i)) rej(new Error("inspector 超时: " + method)); }, 10000);
  });
  await new Promise((res, rej) => {
    ws.addEventListener("open", res, { once: true });
    ws.addEventListener("error", () => rej(new Error("inspector ws 连接失败")), { once: true });
  });
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(String(e.data)); const w = m.id && pend.get(m.id);
    if (w) { pend.delete(m.id); m.error ? w.rej(new Error(m.error.message)) : w.res(m.result); }
  });
  await send("Runtime.enable");
  let value, err;
  try {
    const r = await send("Runtime.evaluate", { expression: expr, includeCommandLineAPI: true, returnByValue: true, awaitPromise });
    if (r.exceptionDetails) err = new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    else value = r.result?.value;
  } catch (e) { err = e; }
  // 收尾:关闭 inspector(fire-and-forget,连接随之断开)
  try {
    ws.send(JSON.stringify({ id: ++id, method: "Runtime.evaluate", params: {
      expression: "setTimeout(()=>{try{require('inspector').close()}catch(e){};try{if(process._debugEnd)process._debugEnd()}catch(e){}},30)",
    } }));
  } catch { /* ignore */ }
  await new Promise((r) => setTimeout(r, 250));
  try { ws.close(); } catch { /* ignore */ }
  if (err) throw err;
  return value;
}
