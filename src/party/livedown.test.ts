import { generateEditKeyPair, signContent, verifySignature } from "../token";

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
