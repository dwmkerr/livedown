import { generateEditKeyPair, signContent, verifySignature } from "../token";

// Relay uses Web Crypto API (not available in Jest/Node).
// Test the signing/verification logic via the token module instead,
// which uses tweetnacl (same Ed25519 algorithm, compatible signatures).
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
