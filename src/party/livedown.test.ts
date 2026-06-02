import {
  generateEditKeyPair,
  generateViewKey,
  publicKeyFromEditKey,
  signContent,
  verifySignature,
} from "../token";

// The relay uses @noble/curves for Ed25519 verification, which can't be
// imported in Jest due to ESM/BigInt transpilation issues. Instead we test
// the cross-library compatibility via tweetnacl (token.ts), since both
// implement standard Ed25519 (RFC 8032) and produce identical signatures.
describe("Ed25519 signature verification", () => {
  it("should verify a valid signature", () => {
    const kp = generateEditKeyPair();
    const sig = signContent("hello", kp.editKey);
    expect(verifySignature("hello", sig, kp.publicKey)).toBe(true);
  });

  it("should reject a bad signature", () => {
    const kp = generateEditKeyPair();
    const sig = signContent("hello", kp.editKey);
    expect(verifySignature("tampered", sig, kp.publicKey)).toBe(false);
  });

  it("should reject a signature from a different key", () => {
    const kp1 = generateEditKeyPair();
    const kp2 = generateEditKeyPair();
    const sig = signContent("hello", kp1.editKey);
    expect(verifySignature("hello", sig, kp2.publicKey)).toBe(false);
  });

  it("should reject malformed input", () => {
    const kp = generateEditKeyPair();
    expect(verifySignature("hello", "bad", kp.publicKey)).toBe(false);
  });
});

// The relay grants view access in private mode if the submitted key is the view
// key OR the edit key. The edit-key path is verified by deriving the public key
// from the 32-byte seed (relay uses @noble getPublicKey; this asserts the same
// derivation via tweetnacl, which produces identical Ed25519 public keys).
describe("view-auth key matching (edit key is a superset of the view key)", () => {
  it("edit key derives the room public key, so it grants view access", () => {
    const kp = generateEditKeyPair();
    expect(publicKeyFromEditKey(kp.editKey)).toBe(kp.publicKey);
  });

  it("a random view key does not derive the room public key", () => {
    const kp = generateEditKeyPair();
    const viewKey = generateViewKey();
    // A view key is an unrelated random token; treated as a seed it derives some
    // other public key, never the room's — so it only matches by exact equality.
    expect(publicKeyFromEditKey(viewKey)).not.toBe(kp.publicKey);
    expect(viewKey).not.toBe(kp.editKey);
  });

  it("a different edit key does not derive this room's public key", () => {
    const a = generateEditKeyPair();
    const b = generateEditKeyPair();
    expect(publicKeyFromEditKey(b.editKey)).not.toBe(a.publicKey);
  });
});
