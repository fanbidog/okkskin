#!/usr/bin/env node
// 本地作者/签名工具(dev-only,不随 npm 包发布 —— 见 package.json "files")。
// 读桌面私钥,把「壁纸 + 6 色 + 明暗」打成 theme.json / bg.<ext> / 已签名 manifest.json,
// URL 钉死 www.okkmax.com,产出到 out/<id>/,供后台上传。
//
// 用法:
//   node scripts/author.mjs \
//     --id road --name "山湖公路" --variant dark --image ~/wallpaper.jpg \
//     --bg "#0c1519" --panel "#10242b" --accent "#37b0c4" \
//     --text "#e9f3f4" --muted "#93b0b3" --line "rgba(55,176,196,.22)" \
//     [--version 1] [--key ~/Desktop/okkskin-ed25519-private.pem] [--out out]
//
// 私钥永不入库/上服务器,仅本地离线签名用。

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { sniffImageType } from "../src/image.mjs";
import { validateTheme } from "../src/theme.mjs";
import { canonical } from "../src/manifest.mjs";
import { sriOf } from "../src/sri.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE = "https://www.okkmax.com/skins"; // 与 webapp publish.ts 的 BASE 一致

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k.startsWith("--")) { a[k.slice(2)] = argv[i + 1]?.startsWith("--") || argv[i + 1] === undefined ? true : argv[++i]; }
  }
  return a;
}

function die(msg) { console.error("✗ " + msg); process.exit(1); }

function expandHome(p) { return p.startsWith("~") ? path.join(os.homedir(), p.slice(1)) : p; }

const args = parseArgs(process.argv.slice(2));
if (args.help || args.h) {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").filter((l) => l.startsWith("//")).map((l) => l.slice(3)).join("\n"));
  process.exit(0);
}

// —— 校验入参 ——
const id = String(args.id || "");
if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id)) die("--id 需为小写字母/数字/连字符(1-64),如 road");
const name = String(args.name || "");
if (!name || name.length > 80) die("--name 必填,长度 1-80");
const variant = String(args.variant || "");
if (variant !== "light" && variant !== "dark") die("--variant 必须是 light 或 dark");
const version = Number(args.version ?? 1);
if (!Number.isInteger(version) || version < 1) die("--version 必须是 ≥1 的整数(更新同一皮肤时 +1)");

const colors = {
  background: args.bg, panel: args.panel, accent: args.accent,
  text: args.text, muted: args.muted, line: args.line,
};
for (const [k, v] of Object.entries(colors)) if (!v || v === true) die(`缺颜色 --${k === "background" ? "bg" : k}(6 色全填:bg/panel/accent/text/muted/line)`);

// —— 读图 + 嗅探类型 ——
const imgPath = expandHome(String(args.image || ""));
if (!imgPath || !fs.existsSync(imgPath)) die("--image 指向的壁纸文件不存在");
const bgBytes = fs.readFileSync(imgPath);
const bgExt = sniffImageType(bgBytes);
if (!bgExt) die("壁纸不是 png/jpg/webp(魔数嗅探失败)");

// —— 读私钥 ——
const keyPath = expandHome(String(args.key || "~/Desktop/okkskin-ed25519-private.pem"));
if (!fs.existsSync(keyPath)) die(`私钥不存在:${keyPath}(用 --key 指定;私钥永不入库)`);
let privateKey;
try { privateKey = crypto.createPrivateKey(fs.readFileSync(keyPath)); }
catch (e) { die("私钥读取失败:" + e.message); }

// —— 组 theme.json 并校验 ——
const theme = { schemaVersion: 1, id, name, variant, image: `bg.${bgExt}`, colors };
try { validateTheme(theme); } catch (e) { die("theme 校验失败:" + e.message); }
const themeBytes = Buffer.from(JSON.stringify(theme, null, 2));

// —— SRI + 签名 payload ——
const payload = {
  skinId: id,
  version,
  variant,
  themeUrl: `${BASE}/${id}/theme.json`,
  themeSri: sriOf(themeBytes),
  imageUrl: `${BASE}/${id}/bg.${bgExt}`,
  imageMirror: "",
  imageSri: sriOf(bgBytes),
};
const sig = crypto.sign(null, Buffer.from(canonical(payload)), privateKey).toString("base64");
const manifest = { payload, sig };
const manifestBytes = Buffer.from(JSON.stringify(manifest, null, 2));

// —— 落盘 out/<id>/ ——
const outDir = path.resolve(HERE, "..", String(args.out || "out"), id);
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "theme.json"), themeBytes);
fs.writeFileSync(path.join(outDir, `bg.${bgExt}`), bgBytes);
fs.writeFileSync(path.join(outDir, "manifest.json"), manifestBytes);

console.log(`✓ 已产出到 ${outDir}`);
console.log(`  theme.json / bg.${bgExt} / manifest.json  (v${version}, ${variant})`);
console.log("\n下一步:");
console.log("  1. 把这套皮肤套到 Codex 截一张换肤后的 preview.jpg(卡片缩略图)");
console.log(`  2. 打开后台「皮肤 → 上传/更新皮肤」,填 id=${id} + 分类/色系,上传 4 个文件:`);
console.log(`     manifest.json / theme.json / bg.${bgExt} / preview.jpg`);
console.log("  3. 上传成功后默认草稿,去列表把状态改为「已发布」");
