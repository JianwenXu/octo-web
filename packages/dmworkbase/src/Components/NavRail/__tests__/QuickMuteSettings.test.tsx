/** @vitest-environment jsdom */
import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "../../../i18n";
import QuickMuteSettings, { type QuickMuteService, type QuickMuteState } from "../QuickMuteSettings";

const flush = async () => act(async () => { await Promise.resolve(); await Promise.resolve(); });

let container: HTMLDivElement;

beforeEach(() => {
  i18n.setLocale("zh-CN", { notify: false, persist: false });
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => ReactDOM.unmountComponentAtNode(container));
  container.remove();
});

function service(initial: QuickMuteState, overrides: Partial<QuickMuteService> = {}): QuickMuteService {
  return {
    getState: vi.fn(async () => initial),
    setMute: vi.fn(async ({ scope }) => ({ active: true, scope, endAt: Date.now() + 60_000 })),
    resume: vi.fn(async () => ({ active: false, scope: initial.scope })),
    ...overrides,
  };
}

describe("QuickMuteSettings", () => {
  it("submits the selected scope and exposes resume after muting", async () => {
    const api = service({ active: false, scope: "sound" });
    act(() => ReactDOM.render(<QuickMuteSettings service={api} />, container));
    await flush();

    const scope = container.querySelector("select") as HTMLSelectElement;
    act(() => {
      scope.value = "sound-and-popup";
      scope.dispatchEvent(new Event("change", { bubbles: true }));
    });
    act(() => (container.querySelector("button") as HTMLButtonElement).click());
    await flush();

    expect(api.setMute).toHaveBeenCalledWith({ duration: "30m", scope: "sound-and-popup" });
    expect(container.textContent).toContain("已静音");
    expect(Array.from(container.querySelectorAll("button")).some((button) => button.textContent?.includes("恢复提醒"))).toBe(true);
  });

  it("shows a load error and retries the service", async () => {
    const getState = vi.fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ active: false, scope: "sound" });
    const api = service({ active: false, scope: "sound" }, { getState });
    act(() => ReactDOM.render(<QuickMuteSettings service={api} />, container));
    await flush();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("加载失败");

    const retry = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes("重试"));
    act(() => retry?.click());
    await flush();
    expect(getState).toHaveBeenCalledTimes(2);
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it("retries a failed resume instead of submitting a mute", async () => {
    const resume = vi.fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ active: false, scope: "sound" });
    const api = service({ active: true, scope: "sound" }, { resume });
    act(() => ReactDOM.render(<QuickMuteSettings service={api} />, container));
    await flush();
    const resumeButton = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes("恢复提醒"));
    act(() => resumeButton?.click());
    await flush();
    const retry = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes("重试"));
    act(() => retry?.click());
    await flush();
    expect(resume).toHaveBeenCalledTimes(2);
    expect(api.setMute).not.toHaveBeenCalled();
  });
});
