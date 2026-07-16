#!/usr/bin/env node
const [cmd, ...args] = process.argv.slice(2);
const COMMANDS = new Set(["apply", "status", "stop", "restore", "doctor"]);

async function main() {
  if (!cmd || !COMMANDS.has(cmd)) {
    console.error("usage: okkskin <apply|status|stop|restore|doctor> [args]");
    process.exit(2);
  }
  const mod = await import(`../src/commands/${cmd}.mjs`);
  await mod.run(args);
}
main().catch((e) => { console.error(`okkskin: ${e.message}`); process.exit(1); });
