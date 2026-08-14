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

export function formatLocalDateTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function defaultQuickMuteTime(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return formatLocalDateTime(date);
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
  private loaded = false;
  private inFlight?: Promise<QuickMuteState>;
  private serverOffset = 0;

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
    if (next.serverTime) {
      const serverTime = Date.parse(next.serverTime);
      if (Number.isFinite(serverTime)) this.serverOffset = serverTime - Date.now();
    }
    const endAt = next.endAt;
    this.state = { ...next, active: Boolean(next.active && endAt && endAt > Date.now() + this.serverOffset), scope: next.scope ?? getStoredScope() };
    this.loaded = true;
    this.listeners.forEach((listener) => listener(this.state));
    return this.state;
  }

  async getState() {
    if (!this.loaded) await this.refresh();
    else this.state = { ...this.state, active: Boolean(this.state.endAt && this.state.endAt > Date.now() + this.serverOffset) };
    return this.state;
  }

  async refresh() {
    if (this.inFlight) return this.inFlight;
    const version = ++this.requestVersion;
    this.inFlight = this.service.getState().then((next) => {
      if (version === this.requestVersion) this.apply(next);
      return this.state;
    }).finally(() => { this.inFlight = undefined; });
    return this.inFlight;
  }

  reset() {
    this.requestVersion += 1;
    this.loaded = false;
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
    const version = ++this.requestVersion;
    const next = await this.service.setMute(input);
    if (version === this.requestVersion) return this.apply(next);
    return this.state;
  }

  setScope(scope: QuickMuteState["scope"]) {
    storeScope(scope);
    return this.apply({ ...this.state, scope });
  }

  async resume() {
    const version = ++this.requestVersion;
    const next = await this.service.resume();
    if (version === this.requestVersion) return this.apply(next);
    return this.state;
  }
}

export const quickMuteStore = new QuickMuteStore();
