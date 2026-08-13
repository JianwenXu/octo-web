import APIClient from "../../Service/APIClient";
import type { QuickMuteDuration, QuickMuteService, QuickMuteState } from "./QuickMuteSettings";

interface NotificationPauseResponse {
  paused?: boolean;
  paused_until?: string | null;
  revision?: number;
  server_time?: string;
}

const QUICK_MUTE_SCOPE_KEY = "octo.quickMute.scope";

function getStoredScope(): QuickMuteState["scope"] {
  try {
    return window.localStorage.getItem(QUICK_MUTE_SCOPE_KEY) === "sound"
      ? "sound"
      : "sound-and-popup";
  } catch {
    return "sound-and-popup";
  }
}

function storeScope(scope: QuickMuteState["scope"]) {
  try {
    window.localStorage.setItem(QUICK_MUTE_SCOPE_KEY, scope);
  } catch {
    // Local storage can be unavailable in private browsing or test runtimes.
  }
}

function toState(response: NotificationPauseResponse): QuickMuteState {
  const endAt = response.paused_until ? Date.parse(response.paused_until) : undefined;
  return {
    active: response.paused === true && endAt !== undefined && Number.isFinite(endAt) && endAt > Date.now(),
    endAt,
    scope: getStoredScope(),
    revision: response.revision ?? 0,
    serverTime: response.server_time,
  };
}

export function parseQuickMuteCMD(param: unknown): QuickMuteState | null {
  if (!param || typeof param !== "object") return null;
  const value = param as NotificationPauseResponse;
  if (typeof value.revision !== "number" || typeof value.paused !== "boolean") return null;
  return toState(value);
}

/** Account-level notification pause API. The server is authoritative. */
export class QuickMuteApiService implements QuickMuteService {
  private static readonly PATH = "/user/notification-pause";

  async getState(): Promise<QuickMuteState> {
    return toState(await APIClient.shared.get<NotificationPauseResponse>(QuickMuteApiService.PATH));
  }

  async setMute(input: { duration: QuickMuteDuration; endAt?: number }): Promise<QuickMuteState> {
    const endAt = input.duration === "30m"
      ? Date.now() + 30 * 60_000
      : input.duration === "1h"
        ? Date.now() + 60 * 60_000
        : input.endAt;
    if (!endAt || !Number.isFinite(endAt) || endAt <= Date.now()) {
      throw new Error("A future notification pause time is required");
    }
    return toState(await APIClient.shared.put(QuickMuteApiService.PATH, {
      paused_until: new Date(endAt).toISOString(),
    }));
  }

  async resume(): Promise<QuickMuteState> {
    return toState(await APIClient.shared.delete(QuickMuteApiService.PATH));
  }
}

/** One account-scoped store shared by the settings page and sidebar. */
export class QuickMuteStore implements QuickMuteService {
  private readonly service: QuickMuteService;
  private state: QuickMuteState = { active: false, scope: getStoredScope(), revision: 0 };
  private listeners = new Set<(state: QuickMuteState) => void>();
  private requestVersion = 0;

  constructor(service: QuickMuteService = new QuickMuteApiService()) {
    this.service = service;
  }

  subscribe(listener: (state: QuickMuteState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private apply(next: QuickMuteState) {
    const currentRevision = this.state.revision ?? 0;
    const nextRevision = next.revision ?? 0;
    if (nextRevision < currentRevision) return this.state;
    this.state = { ...next, scope: next.scope ?? getStoredScope() };
    this.listeners.forEach((listener) => listener(this.state));
    return this.state;
  }

  async getState() {
    if (this.state.revision === 0) await this.refresh();
    return this.state;
  }

  async refresh() {
    const version = ++this.requestVersion;
    const next = await this.service.getState();
    if (version === this.requestVersion) this.apply(next);
    return this.state;
  }

  reset() {
    this.requestVersion += 1;
    this.state = { active: false, scope: getStoredScope(), revision: 0 };
    this.listeners.forEach((listener) => listener(this.state));
  }

  applyRemoteCMD(param: unknown) {
    const next = parseQuickMuteCMD(param);
    if (!next) {
      void this.refresh();
      return false;
    }
    const revision = next.revision ?? 0;
    const currentRevision = this.state.revision ?? 0;
    if (revision <= currentRevision) return false;
    if (revision > currentRevision + 1 && currentRevision > 0) void this.refresh();
    this.apply(next);
    return true;
  }

  async setMute(input: { duration: QuickMuteDuration; endAt?: number; scope: QuickMuteState["scope"] }) {
    storeScope(input.scope);
    const next = await this.service.setMute(input);
    return this.apply(next);
  }

  setScope(scope: QuickMuteState["scope"]) {
    storeScope(scope);
    return this.apply({ ...this.state, scope });
  }

  async resume() {
    const next = await this.service.resume();
    return this.apply(next);
  }
}

export const quickMuteStore = new QuickMuteStore();
