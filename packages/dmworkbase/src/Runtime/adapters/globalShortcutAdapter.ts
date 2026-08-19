import type { RuntimeEnvironment } from "../runtimeEnvironment";
import { IPC_GLOBAL_SHORTCUT_REGISTER, IPC_GLOBAL_SHORTCUT_TRIGGERED, IPC_GLOBAL_SHORTCUT_UNREGISTER } from "../../../../../apps/web/src-election/shared/ipc-channels";

export interface GlobalShortcutAdapter {
  register(shortcut: string): Promise<{ ok: boolean; registered?: boolean; reason?: string }>;
  unregister(): Promise<boolean>;
  onTriggered(callback: (shortcut: string) => void): () => void;
}

type Ipc = { invoke: (channel: string, ...args: unknown[]) => Promise<unknown>; on: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) => void; removeListener: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) => void };
class ElectronGlobalShortcutAdapter implements GlobalShortcutAdapter {
  constructor(private readonly ipc: Ipc) {}
  register(shortcut: string) { return this.ipc.invoke(IPC_GLOBAL_SHORTCUT_REGISTER, shortcut) as Promise<{ ok: boolean; registered?: boolean; reason?: string }>; }
  unregister() { return this.ipc.invoke(IPC_GLOBAL_SHORTCUT_UNREGISTER) as Promise<boolean>; }
  onTriggered(callback: (shortcut: string) => void) {
    const listener = (_event: unknown, shortcut: unknown) => { if (typeof shortcut === "string") callback(shortcut); };
    this.ipc.on(IPC_GLOBAL_SHORTCUT_TRIGGERED, listener);
    return () => this.ipc.removeListener(IPC_GLOBAL_SHORTCUT_TRIGGERED, listener);
  }
}

export function createGlobalShortcutAdapter(environment: RuntimeEnvironment): GlobalShortcutAdapter | null {
  const ipc = typeof window !== "undefined" ? (window as Window & { ipc?: Ipc }).ipc : undefined;
  return environment.target === "desktop" && environment.shell === "electron" && ipc ? new ElectronGlobalShortcutAdapter(ipc) : null;
}
