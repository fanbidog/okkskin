# okkskin

Apply OkkMax skins to the Codex desktop app via local CDP injection.

## Usage

```bash
npx okkskin@0.1.0 apply <gallery-url>
```

`<gallery-url>` is the full, pinned `https://cdn.jsdelivr.net/gh/okkmax/codex-skins@<ref>/skins/<id>/manifest.json`
URL copied from the OkkMax skin gallery. The CLI verifies the ed25519-signed manifest, checks the
theme JSON and background image against their SRI hashes, sanitizes the image (mandatory transcode),
and injects the theme into Codex.

To undo:

```bash
okkskin restore
```

## ⚠️ CDP risk notice

`okkskin apply` works by launching the Codex desktop app with the Chrome DevTools Protocol (CDP)
debugging port **open**, and it stays open for as long as the skinned session runs. While that port
is open, **any local process can drive or inspect the Codex app** through it.

- Use `okkskin` **only on a personal, trusted machine** — never on shared, multi-user, or untrusted hosts.
- The debugging port is open for the whole skinned session, not just during injection.
- Run `okkskin restore` to close it and return Codex to its normal, un-debugged state.

Only apply skins from sources you trust; the trust anchor is the ed25519 public key built into this CLI.

## Attribution

Portions of this implementation are derived from **Codex-Dream-Skin** (MIT).
