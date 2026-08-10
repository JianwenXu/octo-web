import React, { useMemo, useState } from "react";
import { Select, Switch, Tag } from "@douyinfe/semi-ui";
import WKApp from "../../App";
import { i18n, t } from "../../i18n";
import { NotificationUtil } from "../../Utils/NotificationUtil";
import WKModal from "../WKModal";
import "./SettingsCenter.css";

export type SettingsCenterCapability = "desktop" | "account";
export interface SettingsCenterProps {
  visible: boolean;
  isDesktop?: boolean;
  hasAccountCenter?: boolean;
  onClose: () => void;
  onSpaceManagement?: () => void;
  onLogout?: () => void;
  onSecrets?: () => void;
  onVoice?: () => void;
  onAbout?: () => void;
}
type SettingsItem = { id: string; label: string; capabilities?: SettingsCenterCapability[] };
type SettingsGroup = { title: string; items: SettingsItem[] };
const groups: SettingsGroup[] = [
  { title: "设置", items: [{ id: "general", label: "通用" }, { id: "account", label: "账号与安全", capabilities: ["account"] }, { id: "notifications", label: "通知与声音" }, { id: "voice", label: "语音输入" }] },
  { title: "桌面应用", items: [{ id: "desktop-behavior", label: "应用行为", capabilities: ["desktop"] }, { id: "downloads", label: "文件与下载", capabilities: ["desktop"] }] },
  { title: "工具与资源", items: [{ id: "shortcuts", label: "键盘快捷键" }, { id: "devices", label: "在其他设备上使用 Octo" }, { id: "about", label: "帮助与关于" }] },
];
function SettingsIcon({ name }: { name: string }) { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={name === "account" ? "M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 8a6 6 0 0 1 12 0" : name === "notifications" ? "M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8h18c0-1-3-1-3-8ZM10 21h4" : "M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"} /></svg>; }
export function SettingsRow({ title, description, trailing }: { title: string; description?: string; trailing?: React.ReactNode }) { return <div className="wk-settings-center__row"><div className="wk-settings-center__row-main"><div className="wk-settings-center__row-title">{title}</div>{description && <div className="wk-settings-center__row-description">{description}</div>}</div>{trailing}</div>; }
function SettingsPage({ item, onLanguageChange, onSecrets, onVoice }: { item?: SettingsItem; onLanguageChange: (locale: string) => void; onSecrets?: () => void; onVoice?: () => void }) {
  if (item?.id === "general") return <SettingsPageFrame title="通用" description="管理你的语言和界面外观"><SettingsRow title="界面语言" description={`当前：${i18n.getLocale() === "zh-CN" ? "简体中文" : "English"}`} trailing={<Select aria-label="selected" value={i18n.getLocale()} onChange={(value) => onLanguageChange(String(value))} optionList={[{ value: "zh-CN", label: "简体中文" }, { value: "en-US", label: "English" }]} />} /><SettingsRow title="深色模式" description="深色主题即将上线" trailing={<Tag color="blue" size="small">即将上线</Tag>} /></SettingsPageFrame>;
  if (item?.id === "account") return <SettingsPageFrame title="账号与安全" description="查看账号资料和安全设置"><SettingsRow title="姓名" description={WKApp.loginInfo.name || "未设置"} /><SettingsRow title="Octo 号" description={WKApp.loginInfo.shortNo || "未设置"} /><SettingsRow title="密钥管理" description="列表不显示密钥明文" trailing={<button type="button" className="wk-settings-center__link" onClick={onSecrets}>管理</button>} /></SettingsPageFrame>;
  if (item?.id === "notifications") return <SettingsPageFrame title="通知与声音" description="管理通知状态和系统权限"><SettingsRow title="桌面通知" description={WKApp.shared.notificationIsClose ? "已关闭" : "已开启"} trailing={<Switch checked={!WKApp.shared.notificationIsClose} onChange={() => { WKApp.shared.notificationIsClose = !WKApp.shared.notificationIsClose; }} aria-label="桌面通知" />} /><SettingsRow title="系统通知权限" description={typeof Notification === "undefined" ? "当前环境不支持" : Notification.permission === "granted" ? "已允许" : "未授权"} trailing={typeof Notification !== "undefined" && Notification.permission !== "granted" ? <button type="button" className="wk-settings-center__link" onClick={() => { void NotificationUtil.getInstance().requestPermission(); }}>授权</button> : undefined} /></SettingsPageFrame>;
  if (item?.id === "voice") return <SettingsPageFrame title="语音输入" description="复用现有语音输入设置"><SettingsRow title="语音输入设置" description="沿用当前 Space 语音配置和保存逻辑" trailing={<button type="button" className="wk-settings-center__link" onClick={onVoice}>打开</button>} /></SettingsPageFrame>;
  if (item?.id === "shortcuts") return <SettingsPageFrame title="键盘快捷键" description="查看当前客户端快捷键"><SettingsRow title="搜索" description="Ctrl / Cmd + K" /><SettingsRow title="设置" description="Ctrl / Cmd + ," /></SettingsPageFrame>;
  if (item?.id === "devices") return <SettingsPageFrame title="在其他设备上使用 Octo" description="已确认的 Octo 开源资源"><SettingsRow title="Octo Android" description="Android 最新版本" trailing={<a className="wk-settings-center__link" href="https://github.com/Mininglamp-OSS/octo-android/releases/latest" target="_blank" rel="noreferrer">打开</a>} /><SettingsRow title="OctoASR" description="语音识别开源项目" trailing={<a className="wk-settings-center__link" href="https://github.com/Mininglamp-AI/OctoASR" target="_blank" rel="noreferrer">打开</a>} /></SettingsPageFrame>;
  if (item?.id === "about") return <SettingsPageFrame title="帮助与关于" description={`当前版本 ${WKApp.config.appVersion}`}><SettingsRow title="更新检查" description="复用现有版本检查和更新日志能力" trailing={<button type="button" className="wk-settings-center__link" onClick={() => { void onVoice?.(); }}>检查</button>} /><SettingsRow title="更新日志" description="查看当前版本更新内容" /></SettingsPageFrame>;
  return <SettingsPageFrame title={item?.label || "设置"} description="管理你的 Octo 使用偏好"><SettingsRow title="设置项" description="更多设置将在后续阶段接入。" /></SettingsPageFrame>;
}
function SettingsPageFrame({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <div className="wk-settings-center__page"><header className="wk-settings-center__page-header"><h2>{title}</h2><p>{description}</p></header><section className="wk-settings-center__section-content">{children}</section></div>; }
export default function SettingsCenter({ visible, isDesktop = false, hasAccountCenter = false, onClose, onSpaceManagement, onLogout, onSecrets, onVoice }: SettingsCenterProps) {
  const availableGroups = useMemo(() => groups.map((group) => ({ ...group, items: group.items.filter((item) => (item.capabilities ?? []).every((capability) => capability === "desktop" ? isDesktop : hasAccountCenter)) })).filter((group) => group.items.length > 0), [hasAccountCenter, isDesktop]);
  const [selectedId, setSelectedId] = useState("general");
  const selected = availableGroups.flatMap((group) => group.items).find((item) => item.id === selectedId) ?? availableGroups[0]?.items[0];
  return <WKModal visible={visible} onCancel={onClose} title={null} width="min(1080px, calc(100vw - 48px))" className="wk-settings-center-modal" bodyStyle={{ padding: 0 }} options={{ maskClosable: true }}><div className="wk-settings-center" data-testid="settings-center"><aside className="wk-settings-center__sidebar" aria-label={t("base.navRail.settingsCenter.navigation")}><h1>设置</h1><nav className="wk-settings-center__navigation">{availableGroups.map((group) => <section className="wk-settings-center__group" key={group.title}><h2>{group.title}</h2><div className="wk-settings-center__nav-list">{group.items.map((item) => <button type="button" key={item.id} data-testid={`settings-center-nav-${item.id}`} className={`wk-settings-center__nav-item${selected?.id === item.id ? " is-active" : ""}`} aria-current={selected?.id === item.id ? "page" : undefined} onClick={() => setSelectedId(item.id)}><SettingsIcon name={item.id} /><span>{item.label}</span></button>)}</div></section>)}</nav><div className="wk-settings-center__footer">{onSpaceManagement && <button type="button" data-testid="settings-center-space-management" onClick={onSpaceManagement}>⌘ {t("base.navRail.settingsPanel.spaceManagement")}</button>}{onLogout && <button type="button" className="is-danger" data-testid="settings-center-logout" onClick={onLogout}>↪ {t("base.navRail.settingsPanel.logout")}</button>}</div></aside><main className="wk-settings-center__content" data-testid="settings-center-content"><button type="button" className="wk-settings-center__close" aria-label={t("base.common.close")} onClick={onClose}>×</button><SettingsPage item={selected} onLanguageChange={(locale) => i18n.setLocale(locale)} onSecrets={onSecrets} onVoice={onVoice} /></main></div></WKModal>;
}
