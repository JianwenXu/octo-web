/** @vitest-environment jsdom */
import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isVoiceEnabled: true,
  settingsEnabled: false,
  toastWarning: vi.fn(),
}));

vi.mock("./useTextareaVoice", () => ({
  default: () => ({
    isRecording: false,
    isTranscribing: false,
    isVoiceEnabled: mocks.isVoiceEnabled,
    localAvailable: false,
    startRecording: vi.fn(),
    stopRecordingAndTranscribe: vi.fn(),
    cancelRecording: vi.fn(),
  }),
}));

vi.mock("../../Service/VoiceSettingsStore", () => ({
  getVoiceShortcut: () => "alt-right",
  voiceSettingsStore: {
    get: () => ({ enabled: mocks.settingsEnabled, speakingMode: "toggle", shortcutWindows: "alt-right", shortcutMacos: "alt-right" }),
    subscribe: () => () => {},
  },
}));

vi.mock("../../App", () => ({ default: { shared: { currentSpaceId: "space-a" }, mittBus: { on: vi.fn(), off: vi.fn() } } }));
vi.mock("../../i18n", () => ({ useI18n: () => ({ t: (key: string) => key }) }));
vi.mock("lucide-react", () => ({ Mic: () => <span /> }));
vi.mock("@douyinfe/semi-ui", () => ({
  Toast: { warning: (...args: unknown[]) => mocks.toastWarning(...args), error: vi.fn() },
  Dropdown: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import VoiceInputButton from "./index";

let container: HTMLDivElement;
let input: HTMLTextAreaElement;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isVoiceEnabled = true;
  mocks.settingsEnabled = false;
  Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  container = document.createElement("div");
  input = document.createElement("textarea");
  document.body.appendChild(input);
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => ReactDOM.unmountComponentAtNode(container));
  input.remove();
  container.remove();
});

describe("VoiceInputButton availability", () => {
  it("renders nothing when the voice service is unavailable", () => {
    mocks.isVoiceEnabled = false;
    act(() => ReactDOM.render(<VoiceInputButton inputRef={{ current: input }} onTranscribed={() => undefined} />, container));
    expect(container.querySelector(".wk-vib")).toBeNull();
  });

  it("shows the disabled toast when voice input is not enabled in settings", () => {
    act(() => ReactDOM.render(<VoiceInputButton inputRef={{ current: input }} onTranscribed={() => undefined} />, container));
    act(() => (container.querySelector(".wk-vib__btn") as HTMLElement).click());
    expect(mocks.toastWarning).toHaveBeenCalledWith("base.voiceInput.error.unavailable");
  });
});
