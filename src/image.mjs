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

// macOS:sips 转码为 jpeg + 限制最大边
function transcodeMac(inPath, outPath, maxEdge) {
  execFileSync("/usr/bin/sips", ["-s", "format", "jpeg", "-s", "formatOptions", "84", "-Z", String(maxEdge), inPath, "--out", outPath], { stdio: "ignore" });
}

// Windows:PowerShell + System.Drawing(.NET 内置)重解码 → 缩放 → 存 jpeg(去元数据、防夹带)
function transcodeWin(inPath, outPath, maxEdge) {
  const ps = `
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$img=[System.Drawing.Image]::FromFile('${inPath}')
$g=$null; $bmp=$null
try{
  $max=${maxEdge}
  $s=[Math]::Min(1.0, $max/[Math]::Max($img.Width,$img.Height))
  $nw=[int][Math]::Max(1,[Math]::Round($img.Width*$s)); $nh=[int][Math]::Max(1,[Math]::Round($img.Height*$s))
  $bmp=New-Object System.Drawing.Bitmap $nw,$nh
  $g=[System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($img,0,0,$nw,$nh)
  $enc=[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()|Where-Object{$_.MimeType -eq 'image/jpeg'}
  $ep=New-Object System.Drawing.Imaging.EncoderParameters 1
  $ep.Param[0]=New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality),([long]84)
  $bmp.Save('${outPath}',$enc,$ep)
}finally{ if($g){$g.Dispose()}; if($bmp){$bmp.Dispose()}; $img.Dispose() }`;
  execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", ps], { stdio: "ignore" });
}

// 净化:sniff → 类型白名单 → 重新解码转码为 jpeg(去元数据/防解码器夹带)+ 限制最大边。返回净化后临时文件路径。
export function sanitizeImage(buf, maxEdge = 4096) {
  const kind = sniffImageType(buf);
  if (!kind || !ALLOWED.has(kind)) throw new Error(`image type not allowed (sniffed: ${kind})`);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "okkskin-img-"));
  const inPath = path.join(dir, `in.${kind}`);
  const outPath = path.join(dir, "out.jpg");
  fs.writeFileSync(inPath, buf);
  try {
    if (process.platform === "win32") transcodeWin(inPath, outPath, maxEdge);
    else transcodeMac(inPath, outPath, maxEdge);
  } catch (e) { throw new Error(`image transcode failed: ${e.message}`); }
  if (!fs.existsSync(outPath) || fs.statSync(outPath).size === 0) throw new Error("transcoded image empty");
  return outPath;
}
