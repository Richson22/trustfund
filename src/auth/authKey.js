// Turns (email, password) into a separate "login key" that is safe to send to the server.
//
// The server never receives your real password. It receives this key, which is a one-way
// scramble (PBKDF2-SHA256, 600,000 rounds) of the password. The wallet itself is encrypted
// with the real password, in the browser, and the server only ever stores that encrypted copy.
//
// Needs a secure context: works on http://localhost and on https:// sites.
export async function deriveAuthKey(email, password) {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error("This browser cannot do secure login here. Use http://localhost or an https:// address.");
  }
  const enc = new TextEncoder();
  const material = await window.crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await window.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: enc.encode("bitfunds-login-v1:" + email.trim().toLowerCase()),
      iterations: 600000,
    },
    material,
    256
  );
  return Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}