import crypto from "crypto";

export function generateEditToken(): string {
  return crypto.randomBytes(16).toString("hex");
}
