# Publishing checklist

Pre-flight steps to run before publishing `okkskin` to npm. **Do not publish until every box is checked.**

- [ ] Replace `src/pubkey.mjs` `OKKSKIN_PUBKEY` with the **real** ed25519 public key generated on the
      offline signing machine (the placeholder `PLACEHOLDER_REPLACE_BEFORE_PUBLISH` must be gone).
- [ ] Bump `version` in `package.json` (monotonic; matches the manifest `version` bump in `codex-skins`).
- [ ] Enable **2FA** on the npm account used to publish.
- [ ] Publish via npm **trusted publishing (OIDC)** with `--provenance` so the package carries a
      verifiable provenance attestation.
- [ ] After publish, smoke-test with the real gallery URL:
      `npx okkskin@<version> apply <real-gallery-url>`, then `okkskin restore`.
