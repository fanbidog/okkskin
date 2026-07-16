import fs from "node:fs";
import path from "node:path";
import { loadLocalTheme } from "../theme.mjs";
import { resolveRemoteTheme } from "../remote.mjs";
import { lastManifestVersion, recordManifestVersion, writeState } from "../state.mjs";
import { findCodexBundle, verifyCodexSignature } from "../codex.mjs";
import { launchCodexNormally } from "../launch.mjs";
import { findCodexMainPid, pulse } from "../pulse.mjs";
import { rendererInjectJS, readImageB64, mimeForTheme, buildApplyExpr } from "../engine.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function resolveTheme(target) {
  if (target.startsWith("https://")) return resolveRemoteTheme(target, lastManifestVersion);
  const abs = path.resolve(target);
  if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) return loadLocalTheme(abs);
  throw new Error("slug 需从画廊取钉死 manifest URL;请传完整 https URL 或本地主题目录");
}

// 等 Codex 主进程 + 窗口就绪(SIGUSR1 需要主进程在跑、窗口已建)
async function ensureCodexReady() {
  const codex = findCodexBundle();
  if (!verifyCodexSignature(codex.bundlePath)) throw new Error("Codex 签名校验未通过,拒绝注入");
  if (findCodexMainPid()) return;
  launchCodexNormally(codex.bundlePath); // 正常启动,不带调试口、不重启
  for (let i = 0; i < 40 && !findCodexMainPid(); i++) await sleep(500);
  if (!findCodexMainPid()) throw new Error("Codex 未能启动");
  await sleep(3500); // 等窗口/渲染就绪
}

export async function run(args) {
  const target = args[0];
  if (!target) throw new Error("用法: okkskin apply <主题目录|URL>");
  const theme = await resolveTheme(target);

  await ensureCodexReady();

  const rjs = rendererInjectJS(theme, readImageB64(theme), mimeForTheme(theme));
  await pulse(buildApplyExpr(rjs)); // SIGUSR1 脉冲:装钩子 + 立即注入 + 关口

  writeState({ codexPid: findCodexMainPid(), skinId: theme.id, startedAt: new Date().toISOString() });
  if (theme.version) recordManifestVersion(theme.id, theme.version);
  console.log(`okkskin: 已套用 ${theme.id}(脉冲注入,调试口已关闭)。刷新/切页面会自动保持。还原:okkskin restore`);
}
