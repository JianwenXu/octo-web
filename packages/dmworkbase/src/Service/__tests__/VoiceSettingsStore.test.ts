import { VOICE_SETTINGS_KEY, VOICE_PROTOCOL_VERSION, voiceSettingsStore } from "../VoiceSettingsStore";

describe("voiceSettingsStore", () => {
  beforeEach(() => {
    localStorage.clear();
    voiceSettingsStore.reset();
  });

  it("defaults to disabled and persists validated local settings", () => {
    expect(voiceSettingsStore.get().enabled).toBe(false);
    voiceSettingsStore.set({ enabled: true, shortcutWindows: "shift-left" });
    expect(JSON.parse(localStorage.getItem(VOICE_SETTINGS_KEY)!).shortcutWindows).toBe("shift-left");
    expect(voiceSettingsStore.get().enabled).toBe(true);
  });

  it("stores protocol consent independently of spaces", () => {
    voiceSettingsStore.acknowledge();
    expect(voiceSettingsStore.get().consent?.protocolVersion).toBe(VOICE_PROTOCOL_VERSION);
  });

  it("restores persisted values and normalizes invalid enum values", async () => {
    localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify({
      enabled: true,
      shortcutWindows: "old-shortcut",
      speakingMode: "old-mode",
    }));
    vi.resetModules();
    const { voiceSettingsStore: restoredStore } = await import("../VoiceSettingsStore");

    expect(restoredStore.get().enabled).toBe(true);
    expect(restoredStore.get().shortcutWindows).toBe("alt-right");
    expect(restoredStore.get().speakingMode).toBe("toggle");
  });

  it("rolls back the in-memory value when persistence fails", () => {
    voiceSettingsStore.set({ enabled: true });
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });

    expect(() => voiceSettingsStore.set({ enabled: false })).toThrow("storage unavailable");
    expect(voiceSettingsStore.get().enabled).toBe(true);
    setItem.mockRestore();
  });
});
