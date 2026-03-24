import { generateEditToken } from "./token";

describe("generateEditToken", () => {
  it("should return a 32-character hex string", () => {
    const token = generateEditToken();
    expect(token).toMatch(/^[0-9a-f]{32}$/);
  });

  it("should return unique values on each call", () => {
    const a = generateEditToken();
    const b = generateEditToken();
    expect(a).not.toBe(b);
  });
});
