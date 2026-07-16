const LOOPBACK = new Set(["127.0.0.1", "localhost", "[::1]"]);

export function assertLoopbackWsUrl(wsUrl, port) {
  const u = new URL(wsUrl);
  if (u.protocol !== "ws:" || !LOOPBACK.has(u.hostname) || Number(u.port) !== port) {
    throw new Error(`rejected non-loopback CDP url: ${wsUrl}`);
  }
  return wsUrl;
}

export async function listCodexTargets(port) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 2000);
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const targets = await res.json();
    return targets.filter((x) => x.type === "page" && (x.url || "").startsWith("app://") && x.webSocketDebuggerUrl);
  } finally { clearTimeout(t); }
}

export class CdpSession {
  constructor(wsUrl, port) {
    this.ws = new WebSocket(assertLoopbackWsUrl(wsUrl, port));
    this.id = 0; this.pending = new Map();
  }
  open() {
    return new Promise((resolve, reject) => {
      const to = setTimeout(() => reject(new Error("CDP open timeout")), 5000);
      this.ws.addEventListener("open", () => { clearTimeout(to); this._wire(); resolve(this); }, { once: true });
      this.ws.addEventListener("error", () => { clearTimeout(to); reject(new Error("CDP open failed")); }, { once: true });
    });
  }
  _wire() {
    this.ws.addEventListener("message", (ev) => {
      const m = JSON.parse(String(ev.data));
      const w = m.id && this.pending.get(m.id);
      if (!w) return;
      this.pending.delete(m.id);
      m.error ? w.reject(new Error(m.error.message)) : w.resolve(m.result);
    });
  }
  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => { if (this.pending.delete(id)) reject(new Error(`CDP timeout: ${method}`)); }, 10000);
    });
  }
  async evaluate(expression) {
    const r = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || "eval failed");
    return r.result?.value;
  }
  close() { try { this.ws.close(); } catch { /* already closed */ } }
}
