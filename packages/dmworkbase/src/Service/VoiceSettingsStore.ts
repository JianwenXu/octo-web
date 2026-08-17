export type VoiceShortcut = "alt-right" | "shift-right" | "shift-left" | "disabled";
export type VoiceSpeakingMode = "toggle" | "hold";

export interface VoiceSettings {
  enabled: boolean;
  consent?: { protocolVersion: string; ackedAt: string };
  shortcutWindows: VoiceShortcut;
  shortcutMacos: VoiceShortcut;
  speakingMode: VoiceSpeakingMode;
  microphoneDeviceId: string;
  localEnabled: boolean;
  localTimeoutMs: number;
  localProbeUrl: string;
  localTranscribeUrl: string;
}

export const VOICE_SETTINGS_KEY = "octo.voice-input.v1";
export const VOICE_PROTOCOL_VERSION = "1.12";

const defaults: VoiceSettings = {
  enabled: false,
  shortcutWindows: "alt-right",
  shortcutMacos: "alt-right",
  speakingMode: "toggle",
  microphoneDeviceId: "",
  localEnabled: false,
  localTimeoutMs: 10000,
  localProbeUrl: "http://localhost:8787/",
  localTranscribeUrl: "http://localhost:8787/v1/voice/transcribe",
};

const validShortcuts = new Set<VoiceShortcut>(["alt-right", "shift-right", "shift-left", "disabled"]);
const validModes = new Set<VoiceSpeakingMode>(["toggle", "hold"]);
const listeners = new Set<(settings: VoiceSettings) => void>();
const microphonePermissionListeners = new Set<(permission: PermissionState) => void>();
let microphonePermission: PermissionState = "prompt";

export function setMicrophonePermission(permission: PermissionState): void {
  microphonePermission = permission;
  microphonePermissionListeners.forEach((listener) => listener(permission));
}

export function getMicrophonePermission(): PermissionState { return microphonePermission; }

export function subscribeMicrophonePermission(listener: (permission: PermissionState) => void): () => void {
  microphonePermissionListeners.add(listener);
  return () => microphonePermissionListeners.delete(listener);
}

function read(): VoiceSettings {
  try {
    const value = JSON.parse(window.localStorage.getItem(VOICE_SETTINGS_KEY) || "null") as Partial<VoiceSettings> | null;
    if (!value || typeof value !== "object") return { ...defaults };
    return {
      ...defaults,
      ...value,
      enabled: value.enabled === true,
      shortcutWindows: validShortcuts.has(value.shortcutWindows as VoiceShortcut) ? value.shortcutWindows! : defaults.shortcutWindows,
      shortcutMacos: validShortcuts.has(value.shortcutMacos as VoiceShortcut) ? value.shortcutMacos! : defaults.shortcutMacos,
      speakingMode: validModes.has(value.speakingMode as VoiceSpeakingMode) ? value.speakingMode! : defaults.speakingMode,
      localTimeoutMs: typeof value.localTimeoutMs === "number" && value.localTimeoutMs > 0 ? value.localTimeoutMs : defaults.localTimeoutMs,
      microphoneDeviceId: typeof value.microphoneDeviceId === "string" ? value.microphoneDeviceId : "",
      localEnabled: value.localEnabled === true,
      localProbeUrl: typeof value.localProbeUrl === "string" ? value.localProbeUrl : defaults.localProbeUrl,
      localTranscribeUrl: typeof value.localTranscribeUrl === "string" ? value.localTranscribeUrl : defaults.localTranscribeUrl,
    };
  } catch {
    return { ...defaults };
  }
}

let current = read();

export const voiceSettingsStore = {
  get(): VoiceSettings { return { ...current }; },
  set(patch: Partial<VoiceSettings>): VoiceSettings {
    const previous = current;
    const next = { ...current, ...patch };
    try {
      window.localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(next));
      current = next;
      listeners.forEach((listener) => listener({ ...current }));
      return { ...current };
    } catch (error) {
      current = previous;
      throw error;
    }
  },
  acknowledge(protocolVersion = VOICE_PROTOCOL_VERSION): VoiceSettings {
    return this.set({ consent: { protocolVersion, ackedAt: new Date().toISOString() } });
  },
  reset(): VoiceSettings {
    current = { ...defaults };
    try { window.localStorage.removeItem(VOICE_SETTINGS_KEY); } catch { /* unavailable storage */ }
    listeners.forEach((listener) => listener({ ...current }));
    return { ...current };
  },
  subscribe(listener: (settings: VoiceSettings) => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function getVoiceShortcut(settings: VoiceSettings, os: "windows" | "macos"): VoiceShortcut {
  return os === "macos" ? settings.shortcutMacos : settings.shortcutWindows;
}
