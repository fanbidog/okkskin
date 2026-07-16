import fs from "node:fs";
import { OK_CLASS, FIXED_CSS, themeToVars } from "./inject.mjs";

function mimeFor(p) {
  if (p.endsWith(".png")) return "image/png";
  if (p.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}
export function readImageB64(theme) { return fs.readFileSync(theme.imagePath).toString("base64"); }
export function mimeForTheme(theme) { return mimeFor(theme.imagePath); }

// 在渲染进程里执行的注入 JS(自包含字符串):建 style、设 CSS 变量、blob 背景图、加类、设 color-scheme。
export function rendererInjectJS(theme, imageBase64, mime) {
  const payload = JSON.stringify({
    cls: OK_CLASS, css: FIXED_CSS, vars: themeToVars(theme),
    img: imageBase64, mime, variant: theme.variant === "light" ? "light" : "dark",
  });
  return `(() => {
    const P = ${payload};
    const root = document.documentElement;
    let st = document.getElementById("okkskin-style");
    if (!st) { st = document.createElement("style"); st.id = "okkskin-style"; (document.head || root).appendChild(st); }
    st.textContent = P.css;
    for (const [k, v] of Object.entries(P.vars)) root.style.setProperty(k, v);
    root.style.setProperty("color-scheme", P.variant);
    if (P.img) { const bin = Uint8Array.from(atob(P.img), c => c.charCodeAt(0)); const u = URL.createObjectURL(new Blob([bin], { type: P.mime })); root.style.setProperty("--ok-art", 'url("' + u + '")'); }
    root.classList.add(P.cls);
    return "ok";
  })()`;
}

// 主进程 setup 表达式:存当前 RJS、对每个 app 窗口挂一次 dom-ready 重注钩子、立即注入、并 hook 未来新窗口。
// 钩子活在 Codex 主进程,不依赖 inspector 端口 —— 端口脉冲后即关,钩子仍在,刷新自动重注。
export function buildApplyExpr(rjs) {
  return `(() => {
    const { BrowserWindow, app } = require("electron");
    globalThis.__okkskinRJS = ${JSON.stringify(rjs)};
    const isApp = (wc) => (wc.getURL() || "").startsWith("app://");
    const inject = (wc) => { try { if (globalThis.__okkskinRJS && isApp(wc)) wc.executeJavaScript(globalThis.__okkskinRJS).catch(() => {}); } catch (e) {} };
    const hookWC = (wc) => { if (!wc.__okkskinHooked) { wc.__okkskinHooked = true; wc.on("dom-ready", () => inject(wc)); } inject(wc); };
    BrowserWindow.getAllWindows().forEach((w) => hookWC(w.webContents));
    if (!globalThis.__okkskinNewWin) { globalThis.__okkskinNewWin = true; app.on("browser-window-created", (e, w) => hookWC(w.webContents)); }
    return "applied";
  })()`;
}

// 主进程 teardown 表达式:停钩子(RJS 置空)+ 移除已注入的样式/变量。不重启 Codex。
export const RESTORE_EXPR = `(() => {
  globalThis.__okkskinRJS = "";
  const { BrowserWindow } = require("electron");
  const R = "(()=>{const s=document.getElementById('okkskin-style');if(s)s.remove();const r=document.documentElement;r.classList.remove('okkskin');r.style.removeProperty('color-scheme');['--ok-bg','--ok-panel','--ok-accent','--ok-text','--ok-muted','--ok-line','--ok-art'].forEach(v=>r.style.removeProperty(v));})()";
  BrowserWindow.getAllWindows().forEach((w) => { try { if ((w.webContents.getURL() || "").startsWith("app://")) w.webContents.executeJavaScript(R).catch(() => {}); } catch (e) {} });
  return "restored";
})()`;
