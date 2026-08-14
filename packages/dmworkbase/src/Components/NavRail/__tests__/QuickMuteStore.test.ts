import { describe, expect, it, vi } from "vitest";
import { QuickMuteStore, parseQuickMuteCMD } from "../QuickMuteStore";
import type { QuickMuteService, QuickMuteState } from "../QuickMuteSettings";

const state = (revision: number, active = true): QuickMuteState => ({
  active,
  endAt: active ? Date.now() + 60_000 : undefined,
  scope: "sound-and-popup",
  revision,
});

function fakeService(initial: QuickMuteState): QuickMuteService {
  let current = initial;
  return {
    getState: vi.fn(async () => current),
    setMute: vi.fn(async () => { current = state((current.revision ?? 0) + 1); return current; }),
    resume: vi.fn(async () => { current = state((current.revision ?? 0) + 1, false); return current; }),
  };
}

describe("QuickMuteStore", () => {
  it("ignores stale CMD and applies newer state", async () => {
    const store = new QuickMuteStore(fakeService(state(1, false)));
    await store.getState();
    const listener = vi.fn();
    store.subscribe(listener);
    expect(store.applyRemoteCMD({ paused: true, paused_until: new Date(Date.now() + 60_000).toISOString(), revision: 1 })).toBe(false);
    expect(store.applyRemoteCMD({ paused: true, paused_until: new Date(Date.now() + 60_000).toISOString(), revision: 2 })).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.lastCall?.[0].active).toBe(true);
  });

  it("refreshes when a CMD is incomplete or has a revision gap", async () => {
    const service = fakeService(state(1, false));
    const store = new QuickMuteStore(service);
    await store.getState();
    store.applyRemoteCMD({ paused: true });
    store.applyRemoteCMD({ paused: true, paused_until: new Date(Date.now() + 60_000).toISOString(), revision: 3 });
    await Promise.resolve();
    expect(service.getState).toHaveBeenCalledTimes(2);
  });

  it("rejects malformed CMD payloads", () => {
    expect(parseQuickMuteCMD({ paused: true })).toBeNull();
    expect(parseQuickMuteCMD(null)).toBeNull();
  });
});
