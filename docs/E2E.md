# okkskin Phase 1 — 真机 e2e 验证步骤

macOS + 已装 Codex(`/Applications/ChatGPT.app`,`com.openai.codex`)。

## 1. 造真实图主题
```bash
mkdir -p /tmp/okk-real && cp <某张横图> /tmp/okk-real/bg.png
cat > /tmp/okk-real/theme.json <<'JSON'
{"schemaVersion":1,"id":"real","name":"real","variant":"dark","image":"bg.png",
 "colors":{"background":"#0b0f1a","panel":"#12172a","accent":"#a78bfa","text":"#ece9f5","muted":"#8a86a3","line":"rgba(167,139,250,.22)"}}
JSON
```

## 2. apply
```bash
node bin/okkskin.mjs apply /tmp/okk-real
```
预期:打印 `applied ...` + 调试口风险提示;Codex 重启后主区出现壁纸 + 配色,**界面无任何品牌字样**,原生控件完好。

## 3. status
```bash
node bin/okkskin.mjs status
```
预期:JSON 含 `codexPid/watcherPid/port/skinId/startedAt` + `codexAlive:true` + risk 行。

## 4. watcher 自杀(退出 Codex,不走 restore)
```bash
osascript -e 'tell application "ChatGPT" to quit'; sleep 8
ps -p <watcherPid>          # 应无输出(已自杀)
curl http://127.0.0.1:<port>/json/list   # 应连不上(端口关)
```

## 5. restore
```bash
node bin/okkskin.mjs restore
```
预期:清 state、Codex 正常重启、`status` 显示 no active skin、调试口关闭。

## 已验证结论(2026-07-16)
apply / status / watcher 自杀 / 端口随 Codex 关 / restore 收尾 —— 全部通过。皮肤为壁纸 + CSS 变量配色,无品牌 chrome。

## Phase 2 — 信任链 e2e(2026-07-16)
- 签名主题 resolveFromParts:正常通过;篡改图/篡改 theme/回滚 **全部被拒**(image/theme SRI mismatch、rollback)。
- 离线 sign-manifest.mjs 签名 ↔ CLI verifyManifest 交叉验证一致(canonical 字段序不漂移)。
- 真机 apply 签名主题(本地目录路径)→ 换肤生效、Task 6 未回归 → restore 关口还原。
