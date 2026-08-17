/** @vitest-environment jsdom */
import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  startRecording: vi.fn(),
  toastError: vi.fn(),
  toastWarning: vi.fn(),
  voiceEnabled: false,
}));

vi.mock("../../adapters/voice/useVoiceInput", () => ({
  default: () => ({
    isRecording: false,
    isTranscribing: false,
    startRecording: (...args: unknown[]) => mocks.startRecording(...args),
    stopRecordingAndTranscribe: vi.fn(),
    cancelRecording: vi.fn(),
    isVoiceEnabled: true,
    currentMode: "append_only",
    localAvailable: false,
  }),
}));

vi.mock("../../../../i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock("../../../../Service/VoiceSettingsStore", () => ({
  getVoiceShortcut: () => "alt-right",
  voiceSettingsStore: {
    get: () => ({ enabled: mocks.voiceEnabled, shortcutWindows: "alt-right", shortcutMacos: "alt-right", speakingMode: "toggle" }),
    subscribe: () => () => {},
  },
}));

vi.mock("lucide-react", () => ({ Mic: () => <span /> }));

vi.mock("@douyinfe/semi-ui", () => {
  const Dropdown = ({
    children,
    render,
  }: {
    children: React.ReactNode;
    render?: React.ReactNode;
  }) => <>{children}{render}</>;
  Dropdown.Menu = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  Dropdown.Item = ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>;
  return {
    Dropdown,
    Toast: {
      error: (...args: unknown[]) => mocks.toastError(...args),
      warning: (...args: unknown[]) => mocks.toastWarning(...args),
    },
  };
});

import VoiceInputIndicator from "./VoiceInputIndicator";
import type { ChatComposerVoiceHost } from "../../ports";

let container: HTMLDivElement;
const voiceHost: ChatComposerVoiceHost = {
  getSpaceId: () => "space-a",
  subscribeSpaceChange: () => () => {},
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.voiceEnabled = false;
  Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => ReactDOM.unmountComponentAtNode(container));
  container.remove();
});

describe("VoiceInputIndicator click behavior", () => {
  it("shows the settings hint without starting recording when disabled", async () => {
    await act(async () => {
      ReactDOM.render(
        <VoiceInputIndicator voiceHost={voiceHost} onTranscribed={() => undefined} />,
        container,
      );
    });

    act(() => {
      (container.querySelector(".wk-voice-button-group") as HTMLElement).click();
    });

    expect(mocks.startRecording).not.toHaveBeenCalled();
    expect(mocks.toastWarning).toHaveBeenCalledWith("base.voiceInput.error.disabled");
  });

  it("starts the selected voice mode directly", async () => {
    mocks.voiceEnabled = true;
    await act(async () => {
      ReactDOM.render(
        <VoiceInputIndicator voiceHost={voiceHost} onTranscribed={() => undefined} />,
        container,
      );
    });

    const editMode = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "base.voiceInput.mode.edit",
    ) as HTMLButtonElement;
    act(() => {
      editMode.click();
    });

    expect(mocks.startRecording).toHaveBeenCalledWith("edit_only");
  });
});
