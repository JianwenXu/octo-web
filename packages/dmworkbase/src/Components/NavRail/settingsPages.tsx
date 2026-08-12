import React, { useState } from "react";
import { Select, Switch } from "@douyinfe/semi-ui";
import WKApp, { ThemeMode } from "../../App";
import { updateUserLanguagePreference } from "../../Service/UserLanguageService";
import { i18n, t } from "../../i18n";
import { Locale } from "../../i18n/types";
import type { SettingsItem } from "./settingsRegistry";
import { createNotificationAdapter } from "../../Runtime/adapters";
import SettingsStatusTag from "./SettingsStatusTag";
import { MeInfo } from "../MeInfo";

export function SettingsRow({ title, description, trailing, children }: { title: string; description?: string; trailing?: React.ReactNode; children?: React.ReactNode }) { return <div className="wk-settings-center__row"><div className="wk-settings-center__row-main"><div className="wk-settings-center__row-title">{title}</div>{description && <div className="wk-settings-center__row-description">{description}</div>}</div>{children ?? trailing}</div>; }

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="wk-settings-center__settings-section"><h3>{title}</h3>{children}</section>; }

export type ResourceStatus = "available" | "unavailable" | "coming-soon";
type ResourceDefinition = {
  id: string;
  title: string;
  descriptionKey: string;
  status: ResourceStatus;
  statusKey: string;
  url?: string;
  actionKey?: string;
};
type ResourceGroup = { titleKey: string; category: "clients" | "resources"; resources: ResourceDefinition[] };

export const settingsResourceGroups: ResourceGroup[] = [
  {
    titleKey: "base.navRail.settingsCenter.resource.mobile",
    category: "clients",
    resources: [
      { id: "android", title: "Android", descriptionKey: "base.navRail.settingsCenter.resource.androidDescription", status: "available", statusKey: "base.navRail.settingsCenter.resource.downloadConfirmed", url: "https://github.com/Mininglamp-OSS/octo-android/releases/latest", actionKey: "base.navRail.settingsCenter.action.download" },
      { id: "iphone", title: "iPhone", descriptionKey: "base.navRail.settingsCenter.resource.iosDescription", status: "coming-soon", statusKey: "base.navRail.settingsCenter.resource.appStorePending", actionKey: "base.navRail.settingsCenter.action.download" },
    ],
  },
  {
    titleKey: "base.navRail.settingsCenter.resource.openSource",
    category: "resources",
    resources: [
      { id: "octo-asr", title: "OctoASR", descriptionKey: "base.navRail.settingsCenter.resource.asrDescription", status: "available", statusKey: "base.navRail.settingsCenter.resource.projectConfirmed", url: "https://github.com/Mininglamp-AI/OctoASR", actionKey: "base.navRail.settingsCenter.action.viewProject" },
    ],
  },
  {
    titleKey: "base.navRail.settingsCenter.resource.desktop",
    category: "clients",
    resources: [
      { id: "windows", title: "Windows", descriptionKey: "base.navRail.settingsCenter.resource.windowsDescription", status: "coming-soon", statusKey: "base.navRail.settingsCenter.resource.downloadPending" },
      { id: "macos", title: "macOS", descriptionKey: "base.navRail.settingsCenter.resource.macosDescription", status: "coming-soon", statusKey: "base.navRail.settingsCenter.resource.downloadPending" },
    ],
  },
  {
    titleKey: "base.navRail.settingsCenter.resource.extensions",
    category: "resources",
    resources: [
      { id: "chrome", title: "Octo Chrome Extension", descriptionKey: "base.navRail.settingsCenter.resource.chromeDescription", status: "coming-soon", statusKey: "base.navRail.settingsCenter.resource.downloadPending", actionKey: "base.navRail.settingsCenter.action.download" },
      { id: "openclaw", title: "OpenClaw Plugin", descriptionKey: "base.navRail.settingsCenter.resource.openclawDescription", status: "coming-soon", statusKey: "base.navRail.settingsCenter.resource.downloadPending", actionKey: "base.navRail.settingsCenter.action.download" },
    ],
  },
];

export function SettingsPage({ item, environment, accountCenterUrl, onSecrets, onVoice, onAbout, onOpenOnboarding }: { item?: SettingsItem; environment: import("../../Runtime").RuntimeEnvironment; accountCenterUrl?: string; onSecrets?: () => void; onVoice?: () => void; onAbout?: () => void; onOpenOnboarding?: () => void }) {
  if (item?.id === "general") return <SettingsPageFrame title={t("base.navRail.settingsCenter.page.general.title")}><SettingsSection title={t("base.navRail.settingsCenter.section.displayLanguage")}><SettingsRow title={t("base.navRail.settingsCenter.row.language")} description={t("base.navRail.settingsCenter.row.languageDescription")} trailing={<Select aria-label={t("base.navRail.settingsCenter.row.language")} value={i18n.getLocale()} onChange={(value) => { const locale = String(value) as Locale; i18n.setLocale(locale); if (WKApp.shared.isLogined()) void updateUserLanguagePreference(locale); }} optionList={[{ value: "zh-CN", label: "简体中文" }, { value: "en-US", label: "English" }]} />} /><SettingsRow title={t("base.navRail.settingsCenter.row.darkMode")} description={t("base.navRail.settingsCenter.row.darkModeDescription")} trailing={<span className="wk-settings-center__status">{t("base.navRail.settingsCenter.value.comingSoon")}</span>} /></SettingsSection></SettingsPageFrame>;
  if (item?.id === "account") return <SettingsPageFrame title={t("base.navRail.settingsCenter.page.account.title")}><>{accountCenterUrl && <SettingsSection title={t("base.navRail.settingsCenter.section.accountSecurity")}><SettingsRow title={t("base.navRail.settingsCenter.row.accountCenter")} description={t("base.navRail.settingsCenter.row.accountCenterDescription")} trailing={<a className="wk-settings-center__external-link" href={accountCenterUrl} target="_blank" rel="noreferrer" aria-label={t("base.navRail.settingsCenter.row.accountCenter")}>↗</a>} /></SettingsSection>}<SettingsSection title={t("base.navRail.settingsCenter.section.profile")}><MeInfo onClose={() => undefined} embedded /></SettingsSection><SettingsSection title={t("base.navRail.settingsCenter.section.verification")}><SettingsRow title={t("base.navRail.settingsCenter.row.realname")} trailing={<span className="wk-settings-center__row-value">{t("base.navRail.settingsCenter.value.unverified")} <span aria-hidden="true">›</span></span>} /></SettingsSection><SettingsSection title={t("base.navRail.settingsCenter.section.secrets")}><SettingsRow title={t("base.navRail.settingsCenter.row.manageSecrets")} description={t("base.navRail.settingsCenter.row.manageSecretsDescription")} trailing={<button type="button" className="wk-settings-center__manage-button" onClick={onSecrets}>{t("base.navRail.settingsCenter.action.manage")}</button>} /><SettingsRow title={t("base.navRail.settingsCenter.row.referenceSecrets")} description={t("base.navRail.settingsCenter.row.referenceSecretsDescription")} /></SettingsSection></></SettingsPageFrame>;
  if (item?.id === "notifications") {
    return <NotificationsSettingsPage environment={environment} />;
  }
  if (item?.id === "desktop-behavior") return <SettingsPageFrame title={t("base.navRail.settingsCenter.page.desktopBehavior.title")}><SettingsSection title={t("base.navRail.settingsCenter.section.display")}><SettingsRow title={t("base.navRail.settingsCenter.row.interfaceScale")} description={t("base.navRail.settingsCenter.row.interfaceScaleDescription")} trailing={<select className="wk-settings-center__demo-select" disabled aria-label={t("base.navRail.settingsCenter.row.interfaceScale")} defaultValue="100"><option value="80">80%</option><option value="90">90%</option><option value="100">100%</option><option value="110">110%</option><option value="125">125%</option></select>} /></SettingsSection><SettingsSection title={t("base.navRail.settingsCenter.section.system")}><SettingsRow title={t("base.navRail.settingsCenter.row.launchAtStartup")} description={t("base.navRail.settingsCenter.row.launchAtStartupDescription")} trailing={<Switch disabled checked={false} aria-label={t("base.navRail.settingsCenter.row.launchAtStartup")} />} /><SettingsRow title={t("base.navRail.settingsCenter.row.systemTray")} description={t("base.navRail.settingsCenter.row.systemTrayDescription")} trailing={<Switch disabled checked aria-label={t("base.navRail.settingsCenter.row.systemTray")} />} /><SettingsRow title={t("base.navRail.settingsCenter.row.keepAwake")} description={t("base.navRail.settingsCenter.row.keepAwakeDescription")} trailing={<Switch disabled checked={false} aria-label={t("base.navRail.settingsCenter.row.keepAwake")} />} /><SettingsRow title={t("base.navRail.settingsCenter.row.closeWindowBehavior")} description={t("base.navRail.settingsCenter.row.closeWindowBehaviorDescription")} trailing={<select className="wk-settings-center__demo-select" disabled aria-label={t("base.navRail.settingsCenter.row.closeWindowBehavior")} defaultValue="background"><option value="background">{t("base.navRail.settingsCenter.value.continueInBackground")}</option><option value="quit">{t("base.navRail.settingsCenter.value.quitOcto")}</option></select>} /></SettingsSection></SettingsPageFrame>;
  if (item?.id === "downloads") return <SettingsPageFrame title={t("base.navRail.settingsCenter.page.downloads.title")}><SettingsSection title={t("base.navRail.settingsCenter.section.downloads")}><SettingsRow title={t("base.navRail.settingsCenter.row.downloadDirectory")} description={t("base.navRail.settingsCenter.row.downloadDirectoryDescription")}><div className="wk-settings-center__download-location"><code>{t("base.navRail.settingsCenter.value.defaultDownloadPath")}</code><button type="button" className="wk-settings-center__manage-button" disabled>{t("base.navRail.settingsCenter.action.change")}</button></div></SettingsRow><SettingsRow title={t("base.navRail.settingsCenter.row.askBeforeSaving")} description={t("base.navRail.settingsCenter.row.askBeforeSavingDescription")} trailing={<Switch disabled checked={false} aria-label={t("base.navRail.settingsCenter.row.askBeforeSaving")} />} /></SettingsSection></SettingsPageFrame>;
  if (item?.id === "voice") return <SettingsPageFrame title={t("base.navRail.settingsCenter.page.voice.title")} description={t("base.navRail.settingsCenter.page.voice.description")}><SettingsRow title={t("base.navRail.settingsCenter.row.voice")} description={t("base.navRail.settingsCenter.row.voiceDescription")} trailing={<button type="button" className="wk-settings-center__link" onClick={onVoice}>{t("base.navRail.settingsCenter.action.open")}</button>} /></SettingsPageFrame>;
  if (item?.id === "shortcuts") return <SettingsPageFrame title={t("base.navRail.settingsCenter.page.shortcuts.title")} description={t("base.navRail.settingsCenter.page.shortcuts.description")}><div className="wk-settings-center__shortcut-catalog"><section className="wk-settings-center__shortcut-group"><h3>{t("base.navRail.settingsCenter.shortcut.chat")}</h3><ShortcutRow label={t("base.navRail.settingsCenter.shortcut.newChat")} keys={["Ctrl", "N"]} /><ShortcutRow label={t("base.navRail.settingsCenter.shortcut.quickChat")} keys={["Ctrl", "Alt", "N"]} /><ShortcutRow label={t("base.navRail.settingsCenter.shortcut.archiveChat")} keys={["Ctrl", "Shift", "A"]} /></section><section className="wk-settings-center__shortcut-group"><h3>{t("base.navRail.settingsCenter.shortcut.navigation")}</h3><ShortcutRow label={t("base.navRail.settingsCenter.shortcut.search")} keys={["Ctrl", "F"]} /><ShortcutRow label={t("base.navRail.settingsCenter.shortcut.back")} keys={["Alt", "←"]} /><ShortcutRow label={t("base.navRail.settingsCenter.shortcut.forward")} keys={["Alt", "→"]} /></section><section className="wk-settings-center__shortcut-group"><h3>{t("base.navRail.settingsCenter.shortcut.voice")}</h3><ShortcutRow label={t("base.navRail.settingsCenter.shortcut.holdToTalk")} keys={["Ctrl", "Shift", "Space"]} /><ShortcutRow label={t("base.navRail.settingsCenter.shortcut.cancelVoice")} keys={["Esc"]} /></section></div></SettingsPageFrame>;
  if (item?.id === "devices") return <SettingsPageFrame title={t("base.navRail.settingsCenter.page.devices.title")}><div className="wk-settings-center__resource-sections">{settingsResourceGroups.map((group) => <ResourceSection key={group.titleKey} title={t(group.titleKey)} category={group.category}>{group.resources.map((resource) => <ResourceCard key={resource.id} {...resource} description={t(resource.descriptionKey)} statusLabel={t(resource.statusKey)} category={group.category} action={resource.url && resource.actionKey ? <a className="wk-settings-center__resource-action" href={resource.url} target="_blank" rel="noreferrer">↗ {t(resource.actionKey)}</a> : undefined} />)}</ResourceSection>)}</div></SettingsPageFrame>;
  if (item?.id === "about") return <SettingsPageFrame title={t("base.navRail.settingsCenter.page.about.title")} description={t("base.navRail.settingsCenter.page.about.versionPrefix") + " " + WKApp.config.appVersion}><SettingsSection title={t("base.navRail.settingsCenter.section.help")}><SettingsRow title={t("base.navRail.settingsCenter.row.guide")} description={t("base.navRail.settingsCenter.row.guideDescription")} trailing={onOpenOnboarding ? <button type="button" className="wk-settings-center__link" onClick={onOpenOnboarding}>{t("base.navRail.settingsCenter.action.open")}</button> : undefined} /><SettingsRow title={t("base.navRail.settingsCenter.row.changelog")} description={t("base.navRail.settingsCenter.row.changelogDescription")} trailing={<a className="wk-settings-center__external-link" href="https://im.deepminer.com.cn/changelog/" target="_blank" rel="noreferrer" aria-label={t("base.navRail.settingsCenter.row.changelog")}>↗</a>} /></SettingsSection><SettingsSection title={t("base.navRail.settingsCenter.section.about")}><SettingsRow title={t("base.navRail.settingsCenter.row.updateCheck")} description={t("base.navRail.settingsCenter.row.updateCheckDescription")} trailing={<button type="button" className="wk-settings-center__link" onClick={onAbout}>{t("base.navRail.settingsCenter.action.check")}</button>} /></SettingsSection></SettingsPageFrame>;
  return <SettingsPageFrame title={t("base.navRail.settingsCenter.page.fallback.title")} description={t("base.navRail.settingsCenter.page.fallback.description")}><SettingsRow title={t("base.navRail.settingsCenter.row.placeholder")} description={t("base.navRail.settingsCenter.placeholder")} /></SettingsPageFrame>;
}
function NotificationsSettingsPage({ environment }: { environment: import("../../Runtime").RuntimeEnvironment }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => !WKApp.shared.notificationIsClose);
  const [muteScope, setMuteScope] = useState<"sound" | "sound-and-popup">("sound");
  const [permission, setPermission] = useState(() => createNotificationAdapter(environment).getPermission());
  const notificationAdapter = createNotificationAdapter(environment);
  const isDesktop = environment.target === "desktop";
  const permissionLabel = permission === "unsupported" ? t("base.navRail.settingsCenter.value.unsupported") : permission === "denied" ? t("base.navRail.settingsCenter.value.denied") : permission === "granted" ? t("base.navRail.settingsCenter.value.granted") : t("base.navRail.settingsCenter.value.unset");
  const permissionTone: "success" | "attention" | "danger" | "neutral" = permission === "granted" ? "success" : permission === "denied" ? "danger" : permission === "default" ? "attention" : "neutral";
  const requestPermission = async () => setPermission(await notificationAdapter.requestPermission());
  return <SettingsPageFrame title={t("base.navRail.settingsCenter.page.notifications.title")} description={t("base.navRail.settingsCenter.page.notifications.description")}>
    <SettingsSection title={t("base.navRail.settingsCenter.section.quickMute")}>
      <SettingsRow title={t("base.navRail.settingsCenter.row.muteScope")} description={t("base.navRail.settingsCenter.row.muteScopeDescription")} trailing={<select className="wk-settings-center__demo-select" aria-label={t("base.navRail.settingsCenter.row.muteScope")} value={muteScope} onChange={(event) => setMuteScope(event.target.value as typeof muteScope)}><option value="sound">{t("base.navRail.settingsCenter.value.soundOnly")}</option><option value="sound-and-popup">{t("base.navRail.settingsCenter.value.soundAndPopup")}</option></select>} />
    </SettingsSection>
    <SettingsSection title={t("base.navRail.settingsCenter.section.desktopSystemNotifications")}>
      <SettingsRow title={t("base.navRail.settingsCenter.row.notificationOptions")} description={isDesktop ? t("base.navRail.settingsCenter.row.notificationOptionsDesktopDescription") : t("base.navRail.settingsCenter.row.notificationOptionsWebDescription")} trailing={<Switch checked={notificationsEnabled} onChange={(checked) => { setNotificationsEnabled(checked); WKApp.shared.notificationIsClose = !checked; }} aria-label={t("base.navRail.settingsCenter.row.notificationOptions")} />} />
      <SettingsRow title={t("base.navRail.settingsCenter.row.systemPermission")} description={isDesktop ? t("base.navRail.settingsCenter.row.systemPermissionDesktopDescription") : t("base.navRail.settingsCenter.row.systemPermissionWebDescription")} trailing={<span className="wk-settings-center__row-actions"><SettingsStatusTag tone={permissionTone} label={permissionLabel} />{permission === "default" && <button type="button" className="wk-settings-center__manage-button" onClick={() => { void requestPermission(); }}>{t("base.navRail.settingsCenter.action.authorize")}</button>}</span>} />
    </SettingsSection>
  </SettingsPageFrame>;
}
function SettingsPageFrame({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) { return <div className="wk-settings-center__page"><header className="wk-settings-center__page-header"><h2>{title}</h2>{description && <p>{description}</p>}</header><section className="wk-settings-center__section-content">{children}</section></div>; }
function ShortcutRow({ label, keys }: { label: string; keys: string[] }) { return <div className="wk-settings-center__shortcut-row"><span>{label}</span><span className="wk-settings-center__shortcut-keys">{keys.map((key) => <kbd key={key}>{key}</kbd>)}</span></div>; }
function ResourceSection({ title, category, children }: { title: string; category: ResourceGroup["category"]; children: React.ReactNode }) { return <section className={`wk-settings-center__resource-section wk-settings-center__resource-section--${category}`}><h3>{title}</h3><div className="wk-settings-center__resource-grid">{children}</div></section>; }
function ResourceCard({ title, description, status, statusLabel, category, action }: ResourceDefinition & { description: string; statusLabel: string; category: ResourceGroup["category"]; action?: React.ReactNode }) { return <article className={`wk-settings-center__resource-card wk-settings-center__resource-card--${category}`} data-resource-status={status}><div className="wk-settings-center__resource-identity"><span className="wk-settings-center__resource-icon" aria-hidden="true">{title === "Android" ? "▣" : title === "iPhone" || title === "macOS" ? "●" : title === "Windows" ? "⊞" : "◇"}</span><div><h4>{title}</h4><p>{description}</p></div></div><span className="wk-settings-center__resource-status">{statusLabel}</span>{action && <div>{action}</div>}</article>; }
