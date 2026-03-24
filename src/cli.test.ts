import { execSync } from "child_process";
import path from "path";

describe("cli", () => {
  const cli = path.resolve(__dirname, "cli.ts");

  it("should show help text", () => {
    const output = execSync(`npx ts-node ${cli} --help`, {
      encoding: "utf8",
    });
    expect(output).toContain("livedown");
    expect(output).toContain("share");
    expect(output).toContain("open");
  });

  it("should show version", () => {
    const output = execSync(`npx ts-node ${cli} --version`, {
      encoding: "utf8",
    });
    expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
