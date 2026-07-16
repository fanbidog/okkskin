export const OK_CLASS = "okkskin";

// 被明确删除、且不得出现在注入里的 CDS 品牌 chrome 选择器(§1)
export const BRAND_CHROME_SELECTORS = [
  ".dream-skin-brand", ".dream-skin-status", ".dream-skin-quote", ".dream-skin-particles",
];

// 固定 CSS:只做「Codex DOM 选择器 → --ok-* 变量」的映射,不含任何主题数据。
// 颜色值全部通过 setProperty 注入的 CSS 变量提供;背景图为 --ok-art(blob url)。
// 整套主题:Codex 是 token 驱动的(html 上一整套 --color-* / --codex-base-* 变量),
// 所以直接覆盖它自己的设计 token —— 文字/图标/边框/按钮/面板全部随之重上色,
// 干净彻底、不用逐元素 hack、不会给图标加方框。只额外补一条壁纸结构规则。
export const FIXED_CSS = `
html.${OK_CLASS}{
  /* 文字 / 图标 */
  --color-text-foreground: var(--ok-text) !important;
  --color-text-foreground-secondary: var(--ok-muted) !important;
  --color-text-foreground-tertiary: color-mix(in srgb, var(--ok-muted) 72%, transparent) !important;
  --color-icon-primary: var(--ok-text) !important;
  --color-icon-secondary: var(--ok-muted) !important;
  --color-icon-tertiary: color-mix(in srgb, var(--ok-muted) 70%, transparent) !important;
  --color-icon-accent: var(--ok-accent) !important;
  --color-text-accent: var(--ok-accent) !important;
  --color-text-link-foreground: var(--ok-accent) !important;
  /* 边框 */
  --color-border: var(--ok-line) !important;
  --color-border-light: color-mix(in srgb, var(--ok-line) 60%, transparent) !important;
  --color-border-heavy: var(--ok-line) !important;
  --color-border-focus: var(--ok-accent) !important;
  /* 面板 / 表面 */
  --color-background-panel: var(--ok-panel) !important;
  --color-background-surface: var(--ok-panel) !important;
  --color-background-surface-under: color-mix(in srgb, var(--ok-panel) 78%, var(--ok-bg)) !important;
  --color-background-control: var(--ok-panel) !important;
  --color-background-control-opaque: var(--ok-panel) !important;
  /* 代码/编辑器背景不覆盖 —— 遵循 Codex 自身,保证语法高亮可读 */
  /* 抬升层(弹窗/下拉/菜单/toast/横幅)必须不透明,否则会穿帮糊在下层 */
  --color-background-elevated-primary: var(--ok-panel) !important;
  --color-background-elevated-primary-opaque: var(--ok-panel) !important;
  --color-background-elevated-secondary: var(--ok-panel) !important;
  --color-background-elevated-secondary-opaque: var(--ok-panel) !important;
  /* accent 底色态 */
  --color-background-accent: color-mix(in srgb, var(--ok-accent) 16%, transparent) !important;
  --color-background-accent-hover: color-mix(in srgb, var(--ok-accent) 22%, transparent) !important;
  --color-background-accent-active: color-mix(in srgb, var(--ok-accent) 28%, transparent) !important;
  /* 主按钮 + 状态 */
  --color-background-button-primary: var(--ok-accent) !important;
  --color-background-button-primary-hover: color-mix(in srgb, var(--ok-accent) 86%, black) !important;
  --color-background-button-primary-active: color-mix(in srgb, var(--ok-accent) 74%, black) !important;
  --color-background-button-primary-inactive: color-mix(in srgb, var(--ok-accent) 45%, transparent) !important;
  --color-text-button-primary: var(--ok-bg) !important;
  --color-text-on-accent: var(--ok-bg) !important;
  /* 次级按钮(默认深色微透,深色主题会隐形)→ 用 --ok-text 的低透明度派生 */
  --color-background-button-secondary: color-mix(in srgb, var(--ok-text) 9%, transparent) !important;
  --color-background-button-secondary-hover: color-mix(in srgb, var(--ok-text) 14%, transparent) !important;
  --color-background-button-secondary-active: color-mix(in srgb, var(--ok-text) 18%, transparent) !important;
  --color-background-button-secondary-inactive: color-mix(in srgb, var(--ok-text) 5%, transparent) !important;
  --color-text-button-secondary: var(--ok-text) !important;
  /* 三级(幽灵)按钮 */
  --color-background-button-tertiary: transparent !important;
  --color-background-button-tertiary-hover: color-mix(in srgb, var(--ok-text) 10%, transparent) !important;
  --color-background-button-tertiary-active: color-mix(in srgb, var(--ok-text) 16%, transparent) !important;
  --color-text-button-tertiary: var(--ok-muted) !important;
  /* Codex 内置强调蓝/紫 → 统一到主题 accent,避免蓝色乱入 */
  --color-accent-blue: var(--ok-accent) !important;
  --color-background-accent: color-mix(in srgb, var(--ok-accent) 16%, transparent) !important;
  /* Codex 基色 */
  --codex-base-accent: var(--ok-accent) !important;
  --codex-base-ink: var(--ok-text) !important;
  --codex-base-surface: var(--ok-panel) !important;
}

/* 唯一结构性规则:主区铺壁纸(token 覆盖不了背景图);scrim 用 --ok-bg 上色,明暗自适应 */
html.${OK_CLASS} body { background: var(--ok-bg) !important; }
html.${OK_CLASS} ::selection { background: color-mix(in srgb, var(--ok-accent) 32%, transparent); }
html.${OK_CLASS} { scrollbar-color: color-mix(in srgb, var(--ok-text) 26%, transparent) transparent; }
html.${OK_CLASS} main.main-surface {
  background:
    linear-gradient(color-mix(in srgb, var(--ok-bg) 55%, transparent), color-mix(in srgb, var(--ok-bg) 70%, transparent)),
    var(--ok-art) center / cover no-repeat !important;
}

/* 侧边栏:显式按主题 panel 色上色(token 不够、且 color-scheme 会让 Codex 用原生侧栏,故必须显式) */
html.${OK_CLASS} aside.app-shell-left-panel {
  background: var(--ok-panel) !important;
  border-right: 1px solid var(--ok-line) !important;
}
html.${OK_CLASS} aside.app-shell-left-panel nav { background: transparent !important; }
html.${OK_CLASS} aside.app-shell-left-panel button:hover {
  background: color-mix(in srgb, var(--ok-accent) 15%, transparent) !important;
}
html.${OK_CLASS} aside.app-shell-left-panel [class~="bg-token-list-hover-background"],
html.${OK_CLASS} aside.app-shell-left-panel [aria-current="page"] {
  background: color-mix(in srgb, var(--ok-accent) 20%, transparent) !important;
  box-shadow: inset 3px 0 var(--ok-accent) !important;
}

/* 对话页(有 data-turn-key 回合节点):不铺壁纸,纯主题实色工作区,保证文字/代码绝对可读(方案 A)。
   主题色仍在(token 全局),壁纸只留给首页。 */
html.${OK_CLASS} main.main-surface:has([data-turn-key]) {
  background: var(--ok-bg) !important;
}
`.trim();

export function themeToVars(theme) {
  const c = theme.colors;
  return {
    "--ok-bg": c.background,
    "--ok-panel": c.panel,
    "--ok-accent": c.accent,
    "--ok-text": c.text,
    "--ok-muted": c.muted,
    "--ok-line": c.line,
  };
}
