import fs from "node:fs";
import path from "node:path";
import { loadLocalTheme } from "../theme.mjs";
import { resolveRemoteTheme } from "../remote.mjs";
import { lastManifestVersion, recordManifestVersion } from "../state.mjs";
import { findCodexBundle, verifyCodexSignature } from "../codex.mjs";
import { randomPort, quitCodex, launchCodexWithCdp, waitForCdp } from "../launch.mjs";
import { listCodexTargets } from "../cdp.mjs";
import { readState, writeState, clearState } from "../state.mjs";
import { killWatcher, spawnWatcher } from "../proc.mjs";
import { execFileSync } from "node:child_process";

const MANIFEST_BASE = "https://cdn.jsdelivr.net/gh/okkmax/codex-skins"; // ref 由发布流程钉,见下

async function resolveTheme(target) {
  if (target.startsWith("https://")) {
    return resolveRemoteTheme(target, lastManifestVersion);
  }
  if (fs.existsSync(path.resolve(target)) && fs.statSync(path.resolve(target)).isDirectory()) {
    return loadLocalTheme(path.resolve(target)); // 本地目录(Phase 1 路径,开发/自测用)
  }
  // slug:按约定拼 manifest URL(ref 占位,发布时由生成的命令带全 URL 更稳)
  throw new Error(`slug resolution needs a pinned manifest URL; pass the full https URL from the gallery`);
}

export async function run(args) {
  const target = args[0];
  if (!target) throw new Error("usage: okkskin apply <theme-dir>");
  const theme = await resolveTheme(target);
  const skinId = theme.id;

  // 落地为稳定本地主题目录(watcher 重注要复用)
  const applied = path.join(process.env.HOME, "Library/Application Support/okkskin/current");
  fs.rmSync(applied, { recursive: true, force: true });
  fs.mkdirSync(applied, { recursive: true });
  fs.copyFileSync(theme.imagePath, path.join(applied, "bg.jpg"));
  fs.writeFileSync(path.join(applied, "theme.json"), JSON.stringify({
    schemaVersion: 1, id: theme.id, name: theme.name, variant: theme.variant,
    image: "bg.jpg", colors: theme.colors,
  }));

  const prev = readState();
  if (prev?.watcherPid) killWatcher(prev.watcherPid); // 换主题:先停旧 watcher

  const codex = findCodexBundle();
  if (!verifyCodexSignature(codex.bundlePath)) throw new Error("Codex signature invalid — refusing to inject");

  const port = randomPort();
  quitCodex();
  await new Promise((r) => setTimeout(r, 1500));
  launchCodexWithCdp(codex.bundlePath, port);
  if (!(await waitForCdp(port))) { clearState(); throw new Error("Codex CDP did not come up"); }

  const targets = await listCodexTargets(port);
  const codexPid = Number(execFileSync("/usr/bin/pgrep", ["-n", "-x", "ChatGPT"], { encoding: "utf8" }).trim());
  const watcherPid = spawnWatcher(port, applied, codexPid);
  writeState({ codexPid, watcherPid, port, skinId, startedAt: new Date().toISOString() });
  if (theme.version) recordManifestVersion(skinId, theme.version);
  console.log(`okkskin: applied ${skinId} (port ${port}). Run 'okkskin restore' to remove & close the debug port.`);
  console.log("⚠ Codex debug port is open while it runs; use only on a personal, trusted machine.");
}
