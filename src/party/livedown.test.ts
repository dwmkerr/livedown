import { validatePush } from "./livedown";

describe("validatePush", () => {
  it("should accept push when no edit token is set (owner init)", () => {
    const result = validatePush(undefined, "abc123");
    expect(result).toBe(true);
  });

  it("should accept push with matching edit token", () => {
    const result = validatePush("abc123", "abc123");
    expect(result).toBe(true);
  });

  it("should reject push with wrong edit token", () => {
    const result = validatePush("abc123", "wrong");
    expect(result).toBe(false);
  });

  it("should reject push with missing edit token when one is set", () => {
    const result = validatePush("abc123", undefined);
    expect(result).toBe(false);
  });
});
