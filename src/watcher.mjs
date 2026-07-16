import { execFileSync } from "node:child_process";
import { injectOnce } from "./engine.mjs";
import { loadLocalTheme } from "./theme.mjs";
import { listCodexTargets } from "./cdp.mjs";
import { CdpSession } from "./cdp.mjs";

// 存活且确是官方 Codex(命令行含 ChatGPT.app 与该 pid)
export function isSameCodexProcess(pid) {
  try {
    const out = execFileSync("/bin/ps", ["-p", String(pid), "-o", "comm="], { encoding: "utf8" }).trim();
    return out.includes("ChatGPT.app") && out.includes("/MacOS/");
  } catch { return false; }
}

async function watchLoop(port, themeDir, codexPid) {
  const theme = loadLocalTheme(themeDir);
  // 首注
  await injectOnce(port, theme).catch(() => {});
  // 订阅每个 target 的 Page.loadEventFired → 重注;并轮询 Codex 存活
  const sessions = [];
  for (const t of await listCodexTargets(port)) {
    const s = await new CdpSession(t.webSocketDebuggerUrl, port).open();
    await s.send("Page.enable");
    s.ws.addEventListener("message", async (ev) => {
      const m = JSON.parse(String(ev.data));
      if (m.method === "Page.loadEventFired" || m.method === "Page.frameNavigated") {
        await injectOnce(port, theme).catch(() => {});
      }
    });
    sessions.push(s);
  }
  const iv = setInterval(() => {
    if (!isSameCodexProcess(codexPid)) { clearInterval(iv); sessions.forEach((s) => s.close()); process.exit(0); }
  }, 3000);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [port, themeDir, codexPid] = process.argv.slice(2);
  watchLoop(Number(port), themeDir, Number(codexPid));
}
