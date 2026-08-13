import { describe, expect, it } from "vitest";
import { getAvailableSettingsGroups } from "../settingsRegistry";

const environment = (target: "web" | "desktop") => ({
  target,
  shell: target === "desktop" ? "electron" as const : null,
  os: "unknown" as const,
  capabilities: new Set(["voiceInput" as const]),
});

const itemIds = (target: "web" | "desktop", hasAccountCenter: boolean) =>
  getAvailableSettingsGroups({ environment: environment(target), hasAccountCenter })
    .flatMap((group) => group.items.map((item) => item.id));

describe("settings registry", () => {
  it("keeps web settings focused on supported pages", () => {
    expect(itemIds("web", false)).toEqual([
      "general",
      "account",
      "notifications",
      "shortcuts",
      "devices",
      "about",
    ]);
  });

  it("keeps account settings available with or without an external account center", () => {
    expect(itemIds("web", true)).toContain("account");
    expect(itemIds("web", false)).toContain("account");
  });

  it("adds desktop behavior and downloads only for desktop runtime", () => {
    expect(itemIds("desktop", false)).toEqual([
      "general",
      "account",
      "notifications",
      "desktop-behavior",
      "downloads",
      "shortcuts",
      "devices",
      "about",
    ]);
  });
});
