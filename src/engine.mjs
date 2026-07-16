import fs from "node:fs";
import { CdpSession, listCodexTargets } from "./cdp.mjs";
import { OK_CLASS, FIXED_CSS, themeToVars } from "./inject.mjs";

// 在渲染进程里执行的固定函数(审计过):打固定 style、加类、setProperty 颜色、blob 背景图。
function buildEvalExpression(theme, imageBase64, mime) {
  const vars = themeToVars(theme);
  // 只传「数据」:vars(已校验的颜色)、图片 base64、mime。逻辑固定。
  const variant = theme.variant === "light" ? "light" : "dark";
  const payload = JSON.stringify({ cls: OK_CLASS, css: FIXED_CSS, vars, img: imageBase64, mime, variant });
  return `(() => {
    const P = ${payload};
    const root = document.documentElement;
    let st = document.getElementById("okkskin-style");
    if (!st) { st = document.createElement("style"); st.id = "okkskin-style"; document.head.appendChild(st); }
    st.textContent = P.css;
    for (const [k, v] of Object.entries(P.vars)) root.style.setProperty(k, v);
    root.style.setProperty("color-scheme", P.variant);
    if (P.img) {
      const bin = Uint8Array.from(atob(P.img), c => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bin], { type: P.mime }));
      root.style.setProperty("--ok-art", 'url("' + url + '")');
    }
    root.classList.add(P.cls);
    return { ok: true };
  })()`;
}

function mimeFor(imagePath) {
  if (imagePath.endsWith(".png")) return "image/png";
  if (imagePath.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

export async function injectOnce(port, theme) {
  const targets = await listCodexTargets(port);
  if (!targets.length) throw new Error("no Codex app:// target on CDP port");
  const imageBase64 = fs.readFileSync(theme.imagePath).toString("base64");
  const expr = buildEvalExpression(theme, imageBase64, mimeFor(theme.imagePath));
  for (const t of targets) {
    const s = await new CdpSession(t.webSocketDebuggerUrl, port).open();
    try { await s.send("Runtime.enable"); await s.evaluate(expr); } finally { s.close(); }
  }
}
