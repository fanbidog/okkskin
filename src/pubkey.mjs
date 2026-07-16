// 发布公钥(ed25519, SPKI PEM)。占位 —— 发布前用离线生成的真实公钥替换。
// 私钥永不进仓库;签 manifest 在离线机器上用 scripts/sign-manifest.mjs 完成。
export const OKKSKIN_PUBKEY = process.env.OKKSKIN_PUBKEY_OVERRIDE ||
`-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAsJliUf0LyLC2cS+pjBWf4jshxaiiPulvpvUeQX6sruw=
-----END PUBLIC KEY-----`;
