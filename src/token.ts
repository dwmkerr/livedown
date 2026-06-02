import nacl from "tweetnacl";

export interface EditKeyPair {
  editKey: string; // 64 hex chars — the secret shared with trusted editors
  publicKey: string; // 64 hex chars — broadcast freely for verification
}

export function generateEditKeyPair(): EditKeyPair {
  const seed = nacl.randomBytes(32);
  const kp = nacl.sign.keyPair.fromSeed(seed);
  return {
    editKey: toHex(seed),
    publicKey: toHex(kp.publicKey),
  };
}

export function signContent(content: string, editKeyHex: string): string {
  const seed = fromHex(editKeyHex);
  const kp = nacl.sign.keyPair.fromSeed(seed);
  const msg = new TextEncoder().encode(content);
  const sig = nacl.sign.detached(msg, kp.secretKey);
  return toHex(sig);
}

export function verifySignature(
  content: string,
  signatureHex: string,
  publicKeyHex: string
): boolean {
  try {
    const msg = new TextEncoder().encode(content);
    const sig = fromHex(signatureHex);
    const pub = fromHex(publicKeyHex);
    return nacl.sign.detached.verify(msg, sig, pub);
  } catch {
    return false;
  }
}

export function publicKeyFromEditKey(editKeyHex: string): string {
  const seed = fromHex(editKeyHex);
  const kp = nacl.sign.keyPair.fromSeed(seed);
  return toHex(kp.publicKey);
}

// View key for private mode. Symmetric secret, independent of the edit key;
// the edit key is a superset that also grants view access (verified relay-side
// by public-key derivation), so this is only needed for view-only distribution.
export function generateViewKey(): string {
  return toHex(nacl.randomBytes(32));
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
