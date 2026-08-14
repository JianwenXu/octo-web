import React, { useEffect, useMemo, useState } from "react";
import { t } from "../../i18n";
import SettingsStatusTag from "./SettingsStatusTag";
import { defaultQuickMuteTime, formatLocalDateTime, quickMuteStore } from "./QuickMuteStore";

export type QuickMuteDuration = "30m" | "1h" | "custom";
export type QuickMuteScope = "sound" | "sound-and-popup";
export interface QuickMuteState {
  active: boolean;
  endAt?: number;
  scope: QuickMuteScope;
  revision?: number;
  serverTime?: string;
}
export interface QuickMuteService {
  getState(): Promise<QuickMuteState>;
  setMute(input: { duration: QuickMuteDuration; endAt?: number; scope: QuickMuteScope }): Promise<QuickMuteState>;
  resume(): Promise<QuickMuteState>;
  subscribe?(listener: (state: QuickMuteState) => void): () => void;
}

export function createMockQuickMuteService(initial: QuickMuteState = { active: false, scope: "sound" }): QuickMuteService {
  let state = initial;
  return {
    async getState() { return state; },
    async setMute({ duration, endAt, scope }) {
      state = { active: true, scope, endAt: duration === "30m" ? Date.now() + 30 * 60_000 : duration === "1h" ? Date.now() + 60 * 60_000 : endAt };
      return state;
    },
    async resume() { state = { active: false, scope: state.scope }; return state; },
  };
}

export default function QuickMuteSettings({ service = quickMuteStore }: { service?: QuickMuteService }) {
  const [state, setState] = useState<QuickMuteState>({ active: false, scope: "sound-and-popup" });
  const [scope, setScope] = useState<QuickMuteScope>("sound-and-popup");
  const [loaded, setLoaded] = useState(false);
  const [customTime, setCustomTime] = useState(defaultQuickMuteTime);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"load" | "save" | null>(null);
  const [lastAction, setLastAction] = useState<QuickMuteDuration | "resume">("30m");
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    void service.getState().then((next) => {
      if (!mounted) return;
      setState(next);
      setScope(next.scope);
      setLoaded(true);
      setRemaining(next.endAt !== undefined ? Math.max(0, next.endAt - Date.now()) : null);
    }).catch(() => setError("load"));
    const unsubscribe = service.subscribe?.((next) => {
      if (!mounted) return;
      setState(next);
      setScope(next.scope);
      setLoaded(true);
      setRemaining(next.endAt !== undefined ? Math.max(0, next.endAt - Date.now()) : null);
    });
    return () => { mounted = false; unsubscribe?.(); };
  }, [service]);

  useEffect(() => {
    const update = () => setRemaining(state.endAt !== undefined ? Math.max(0, state.endAt - Date.now()) : null);
    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, [state.endAt]);

  const submit = async (duration: QuickMuteDuration) => {
    setLastAction(duration);
    const endAt = duration === "custom" ? new Date(customTime).getTime() : undefined;
    if (duration === "custom" && (!Number.isFinite(endAt) || endAt <= Date.now())) { setError("save"); return; }
    setBusy(true); setError(null);
    try { const next = await service.setMute({ duration, endAt, scope }); setState(next); setRemaining(next.endAt !== undefined ? Math.max(0, next.endAt - Date.now()) : null); }
    catch { setError("save"); }
    finally { setBusy(false); }
  };
  const resume = async () => { setLastAction("resume"); setBusy(true); setError(null); try { setState(await service.resume()); setRemaining(null); } catch { setError("save"); } finally { setBusy(false); } };
  const durationText = useMemo(() => remaining === null ? null : `${Math.ceil(remaining / 60_000)} min`, [remaining]);

  return <section className="wk-settings-center__settings-section wk-quick-mute" data-testid="quick-mute-settings">
    <h3>{t("base.navRail.settingsCenter.section.quickMute")}</h3>
    <div className="wk-quick-mute__status"><div><strong>{state.active ? t("base.navRail.settingsCenter.value.muted") : t("base.navRail.settingsCenter.value.remindersOn")}</strong>{durationText && <span>{t("base.navRail.settingsCenter.row.resumeIn")} {durationText}</span>}</div><SettingsStatusTag tone={state.active ? "attention" : "success"} label={state.active ? t("base.navRail.settingsCenter.value.muted") : t("base.navRail.settingsCenter.value.remindersOn")} /></div>
    <div className="wk-settings-center__row"><div className="wk-settings-center__row-main"><div className="wk-settings-center__row-title">{t("base.navRail.settingsCenter.row.muteScope")}</div><div className="wk-settings-center__row-description">{t("base.navRail.settingsCenter.row.muteScopeDescription")}</div></div><select value={scope} onChange={(event) => setScope(event.target.value as QuickMuteScope)} aria-label={t("base.navRail.settingsCenter.row.muteScope")}><option value="sound">{t("base.navRail.settingsCenter.value.soundOnly")}</option><option value="sound-and-popup">{t("base.navRail.settingsCenter.value.soundAndPopup")}</option></select></div>
    <div className="wk-quick-mute__actions"><button type="button" disabled={busy || !loaded} onClick={() => void submit("30m")}>{t("base.navRail.settingsCenter.action.mute30m")}</button><button type="button" disabled={busy || !loaded} onClick={() => void submit("1h")}>{t("base.navRail.settingsCenter.action.mute1h")}</button>{state.active && <button type="button" disabled={busy || !loaded} onClick={() => void resume()}>{t("base.navRail.settingsCenter.action.resume")}</button>}</div>
    <div className="wk-quick-mute__custom"><input type="datetime-local" value={customTime} min={formatLocalDateTime(new Date())} onChange={(event) => setCustomTime(event.target.value)} aria-label={t("base.navRail.settingsCenter.row.customMuteTime")} /><button type="button" disabled={busy || !loaded} onClick={() => void submit("custom")}>{t("base.navRail.settingsCenter.action.muteUntil")}</button></div>
    {busy && <span className="wk-quick-mute__feedback">{t("base.navRail.settingsCenter.value.submitting")}</span>}{error && <span className="wk-quick-mute__error" role="alert">{t(error === "load" ? "base.navRail.settingsCenter.value.loadFailed" : "base.navRail.settingsCenter.value.saveFailed")} <button type="button" onClick={() => error === "load" ? void service.getState().then((next) => { setState(next); setScope(next.scope); setError(null); }).catch(() => setError("load")) : lastAction === "resume" ? void resume() : void submit(lastAction)}>{t("base.navRail.settingsCenter.action.retry")}</button></span>}
  </section>;
}
