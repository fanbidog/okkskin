# okkskin

给 Codex 桌面端(macOS)换肤 —— 整套界面配色 + 壁纸,通过一次本地「inspector 脉冲」注入:**不改任何 app 文件、不常开调试口**。

## 用法

```bash
# 一次性(当前会话,退出即失)
okkskin apply <主题目录 | 钉死的 manifest URL>

# 持久(退出/Dock 重开自动恢复,装一个登录级常驻 agent)
okkskin enable <主题目录 | 钉死的 manifest URL>
okkskin disable        # 停用常驻 + 移除皮肤

# 其它
okkskin status | restore | doctor
```

`<manifest URL>` 是从 OkkMax 换肤画廊复制的完整钉死链接
`https://cdn.jsdelivr.net/gh/fanbidog/codex-skins@<ref>/skins/<id>/manifest.json`;
CLI 会验 ed25519 签名 manifest、按 SRI 校验 theme JSON 与背景图、净化图片(强制转码),再注入。

## 原理

对运行中的 Codex 主进程发一次 inspector 脉冲(`SIGUSR1` / `process._debugProcess`)→
经 `webContents.executeJavaScript` 向渲染进程注入主题 CSS + 挂 `dom-ready` 重注钩子 →
`process._debugEnd` 立即关闭 inspector 端口。配色来自**覆盖 Codex 自身的设计 token**;
首页铺壁纸,对话页用主题实色底保证可读。**不碰 app.asar、不破坏代码签名。**

## 安全

Node inspector 仅在注入那 ~1 秒于 `127.0.0.1` 打开,随即关闭 —— **不在整会话期间保持开放**。
仍建议仅在**个人可信设备**使用。`okkskin disable` / `restore` 可完全移除。

## 致谢

思路最初受 [Codex-Dream-Skin](https://github.com/Fei-Away/Codex-Dream-Skin)(MIT)启发;
本实现为原创(inspector 脉冲 + 设计 token 覆盖),非其分支。非 OpenAI 官方产品。
