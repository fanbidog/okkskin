import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadLocalTheme } from "../theme.mjs";
import { resolveRemoteTheme } from "../remote.mjs";
import { lastManifestVersion, readState, writeState, currentDir } from "../state.mjs";
import { findCodexBundle, verifyCodexSignature } from "../codex.mjs";
import { findCodexMainPid, pulse } from "../pulse.mjs";
import { rendererInjectJS, readImageB64, mimeForTheme, buildApplyExpr } from "../engine.mjs";
import { installAgent } from "../persist.mjs";

const CURRENT = currentDir();
const AGENT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "agent.mjs");

async function resolveTheme(target) {
  if (target.startsWith("https://")) return resolveRemoteTheme(target, lastManifestVersion);
  const abs = path.resolve(target);
  if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) return loadLocalTheme(abs);
  throw new Error("请传完整 https URL 或本地主题目录");
}

// 把主题暂存到稳定目录,供常驻 agent 每次重套读取
function stage(theme) {
  fs.rmSync(CURRENT, { recursive: true, force: true });
  fs.mkdirSync(CURRENT, { recursive: true });
  const ext = path.extname(theme.imagePath) || ".jpg";
  fs.copyFileSync(theme.imagePath, path.join(CURRENT, "bg" + ext));
  fs.writeFileSync(path.join(CURRENT, "theme.json"), JSON.stringify({
    schemaVersion: 1, id: theme.id, name: theme.name, variant: theme.variant,
    image: "bg" + ext, colors: theme.colors,
  }));
}

export async function run(args) {
  const target = args[0];
  if (!target) throw new Error("用法: okkskin enable <主题目录|URL>");
  const theme = await resolveTheme(target);
  const codex = findCodexBundle();
  if (!verifyCodexSignature(codex.bundlePath)) throw new Error("Codex 签名校验未通过,拒绝启用");

  stage(theme);
  writeState({ skinId: theme.id, enabled: true, appliedPid: null, startedAt: new Date().toISOString() });
  installAgent(AGENT);

  // 若 Codex 正在跑,立即套一次(否则等它下次启动由 agent 套)
  if (findCodexMainPid()) {
    const rjs = rendererInjectJS(theme, readImageB64(theme), mimeForTheme(theme));
    await pulse(buildApplyExpr(rjs));
    writeState({ ...readState(), appliedPid: findCodexMainPid() });
  }
  console.log(`okkskin: 已启用常驻(${theme.id})—— Codex 每次启动都会自动套上。停用:okkskin disable`);
  console.log("⚠ 每次套用会瞬间开一次本地调试口(注完即关);仅个人可信设备使用。");
}
