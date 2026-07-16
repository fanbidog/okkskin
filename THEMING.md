# okkskin 主题规范

一个主题 = **6 个颜色 + 1 张壁纸 + 明暗标记**,人工按图手配。皮肤怎么套是 engine 自动的,作者只管配这 6 个色。

## theme.json 格式

```json
{
  "schemaVersion": 1,
  "id": "purple-night",          // 小写短横线,唯一
  "name": "紫夜",                 // 展示名
  "variant": "dark",             // dark | light
  "image": "bg.jpg",             // 壁纸文件名(同目录)
  "colors": {
    "background": "#0b0f1a",
    "panel": "#12172a",
    "accent": "#a78bfa",
    "text": "#ece9f5",
    "muted": "#8a86a3",
    "line": "rgba(167,139,250,.22)"
  }
}
```

## 6 个颜色怎么定(按图手配)

| 字段 | 含义 | 配法 |
|---|---|---|
| `background` | 页面/工作区底色 | 深色主题取图里最深的主色调;浅色主题取近白 |
| `panel` | 侧栏/面板 | 比 background 差一档(深色略亮、浅色略灰) |
| `accent` | 强调色 | 从图里挑最出彩的一个颜色(按钮/图标/链接/选中/滚动条都用它) |
| `text` | 主文字 | 深色主题用近白、浅色主题用近黑;**必须和 background 有足够对比** |
| `muted` | 次要文字/图标 | text 的低饱和 / 低对比版 |
| `line` | 边框/分隔 | 通常是 accent 的低透明度,如 `rgba(<accent>,.22)` |

壁纸:横向、够大(建议宽 ≥ 2000px)。

## 皮肤怎么套(engine 自动,作者不用管)

- **token 覆盖**:重写 Codex 自己的设计 token(`--color-*` / `--codex-base-*`)→ 整个界面的文字/图标/边框/按钮/面板/次级按钮/选中/滚动条随之统一重上色。不逐元素 hack。
- **首页**:`main.main-surface` 铺壁纸 + `--ok-bg` 蒙层(蒙层用 background 上色,深压暗、浅提亮,明暗自适应)。
- **对话页**(`main.main-surface:has([data-turn-key])`):纯 `--ok-bg` 实色、不铺壁纸 → 保证长对话/表格/行内代码可读(方案 A)。
- **代码块**:遵循 Codex 自身,不覆盖(保语法高亮可读)。
- **弹窗/下拉/菜单/toast/横幅**:强制不透明,防穿帮。
- `color-scheme` 跟随 `variant`。

## 新主题验收清单

- [ ] 首页:文字压在壁纸上可读,accent 明显
- [ ] 对话页:正文/表格/行内代码清晰
- [ ] 侧栏菜单、次级/三级按钮不发灰、不隐形
- [ ] 弹窗/横幅不透明、不糊在下层
- [ ] `variant` 与图的明暗一致(白底图 → light)
- [ ] 强调色只有主题 accent,无残留蓝色
