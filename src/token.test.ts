import {
  generateEditKeyPair,
  signContent,
  verifySignature,
  publicKeyFromEditKey,
} from "./token";

describe("generateEditKeyPair", () => {
  it("should return 64-character hex strings for both keys", () => {
    const kp = generateEditKeyPair();
    expect(kp.editKey).toMatch(/^[0-9a-f]{64}$/);
    expect(kp.publicKey).toMatch(/^[0-9a-f]{64}$/);
  });

  it("should return unique keypairs on each call", () => {
    const a = generateEditKeyPair();
    const b = generateEditKeyPair();
    expect(a.editKey).not.toBe(b.editKey);
    expect(a.publicKey).not.toBe(b.publicKey);
  });
});

describe("signContent and verifySignature", () => {
  it("should verify a valid signature", () => {
    const kp = generateEditKeyPair();
    const sig = signContent("hello world", kp.editKey);
    expect(verifySignature("hello world", sig, kp.publicKey)).toBe(true);
  });

  it("should reject a signature for different content", () => {
    const kp = generateEditKeyPair();
    const sig = signContent("hello world", kp.editKey);
    expect(verifySignature("tampered", sig, kp.publicKey)).toBe(false);
  });

  it("should reject a signature from a different key", () => {
    const kp1 = generateEditKeyPair();
    const kp2 = generateEditKeyPair();
    const sig = signContent("hello", kp1.editKey);
    expect(verifySignature("hello", sig, kp2.publicKey)).toBe(false);
  });

  it("should reject a malformed signature", () => {
    const kp = generateEditKeyPair();
    expect(verifySignature("hello", "badbeef", kp.publicKey)).toBe(false);
  });
});

describe("publicKeyFromEditKey", () => {
  it("should derive the same public key as generateEditKeyPair", () => {
    const kp = generateEditKeyPair();
    expect(publicKeyFromEditKey(kp.editKey)).toBe(kp.publicKey);
  });
});
