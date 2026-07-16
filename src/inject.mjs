export const OK_CLASS = "okkskin";

// 被明确删除、且不得出现在注入里的 CDS 品牌 chrome 选择器(§1)
export const BRAND_CHROME_SELECTORS = [
  ".dream-skin-brand", ".dream-skin-status", ".dream-skin-quote", ".dream-skin-particles",
];

// 固定 CSS:只做「Codex DOM 选择器 → --ok-* 变量」的映射,不含任何主题数据。
// 颜色值全部通过 setProperty 注入的 CSS 变量提供;背景图为 --ok-art(blob url)。
export const FIXED_CSS = `
html.${OK_CLASS} body { background: var(--ok-bg) !important; color: var(--ok-text) !important; }
html.${OK_CLASS} aside.app-shell-left-panel {
  background: var(--ok-panel) !important;
  border: 1px solid var(--ok-line) !important; color: var(--ok-text) !important;
}
html.${OK_CLASS} aside.app-shell-left-panel [aria-current="page"] {
  box-shadow: inset 3px 0 var(--ok-accent) !important;
}
html.${OK_CLASS} main.main-surface {
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--ok-bg) 78%, transparent), color-mix(in srgb, var(--ok-bg) 82%, transparent)),
    var(--ok-art) center / cover no-repeat !important;
}
html.${OK_CLASS} main.main-surface [role="main"] { background: transparent !important; }
html.${OK_CLASS} .composer-surface-chrome {
  border: 1px solid var(--ok-line) !important; background: var(--ok-panel) !important;
}
html.${OK_CLASS} .ProseMirror { color: var(--ok-text) !important; caret-color: var(--ok-accent) !important; }
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
