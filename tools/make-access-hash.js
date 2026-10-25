/*
 * myFuture Nigeria — make the access-code hash for js/questions.js
 * Usage: node tools/make-access-hash.js NEW-CODE
 * Paste the printed lines over the ones inside access: { ... } in js/questions.js.
 * Normalising and hashing must match codeMatches() in js/app.js.
 */
const crypto = require("crypto");

const code = String(process.argv[2] || "").toLowerCase().replace(/\s+/g, "");
if (!code) {
  console.error("Usage: node tools/make-access-hash.js NEW-CODE");
  process.exit(1);
}
const iterations = 250000;
const salt = crypto.randomBytes(16);
const hash = crypto.pbkdf2Sync(code, salt, iterations, 32, "sha256");
console.log(`      salt: "${salt.toString("hex")}",`);
console.log(`      iterations: ${iterations},`);
console.log(`      hash: "${hash.toString("hex")}"`);
