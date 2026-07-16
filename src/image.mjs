import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ALLOWED = new Set(["png", "jpg", "webp"]);

export function sniffImageType(buf) {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length >= 12 && buf.slice(0, 4).toString("ascii") === "RIFF" && buf.slice(8, 12).toString("ascii") === "WEBP") return "webp";
  return null;
}

// 净化:sniff → 类型白名单 → sips 强制转码为 jpeg + 限制最大边像素。返回净化后临时文件路径。
export function sanitizeImage(buf, maxEdge = 4096) {
  const kind = sniffImageType(buf);
  if (!kind || !ALLOWED.has(kind)) throw new Error(`image type not allowed (sniffed: ${kind})`);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "okkskin-img-"));
  const inPath = path.join(dir, `in.${kind}`);
  const outPath = path.join(dir, "out.jpg");
  fs.writeFileSync(inPath, buf);
  try {
    execFileSync("/usr/bin/sips", ["-s", "format", "jpeg", "-s", "formatOptions", "84", "-Z", String(maxEdge), inPath, "--out", outPath], { stdio: "ignore" });
  } catch (e) { throw new Error(`image transcode failed: ${e.message}`); }
  if (!fs.existsSync(outPath) || fs.statSync(outPath).size === 0) throw new Error("transcoded image empty");
  return outPath;
}
