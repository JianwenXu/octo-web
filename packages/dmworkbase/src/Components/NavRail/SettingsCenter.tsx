import React, { useMemo, useState } from "react";
import WKModal from "../WKModal";
import { t } from "../../i18n";
import "./SettingsCenter.css";

export type SettingsCenterCapability = "desktop" | "account";
export interface SettingsCenterProps {
  visible: boolean;
  isDesktop?: boolean;
  hasAccountCenter?: boolean;
  onClose: () => void;
  onSpaceManagement?: () => void;
  onLogout?: () => void;
}
type SettingsSection = { title: string; items: { id: string; label: string; capabilities?: SettingsCenterCapability[] }[] };
const sections: SettingsSection[] = [
  { title: "设置", items: [{ id: "general", label: "通用" }, { id: "account", label: "账号与安全", capabilities: ["account"] }, { id: "notifications", label: "通知与声音" }, { id: "voice", label: "语音输入" }] },
  { title: "桌面应用", items: [{ id: "desktop-behavior", label: "应用行为", capabilities: ["desktop"] }, { id: "downloads", label: "文件与下载", capabilities: ["desktop"] }] },
  { title: "工具与资源", items: [{ id: "shortcuts", label: "键盘快捷键" }, { id: "devices", label: "在其他设备上使用 Octo" }, { id: "about", label: "帮助与关于" }] },
];

export default function SettingsCenter({ visible, isDesktop = false, hasAccountCenter = false, onClose, onSpaceManagement, onLogout }: SettingsCenterProps) {
  const availableSections = useMemo(() => sections.map((section) => ({ ...section, items: section.items.filter((item) => (item.capabilities ?? []).every((capability) => capability === "desktop" ? isDesktop : hasAccountCenter)) })).filter((section) => section.items.length > 0), [hasAccountCenter, isDesktop]);
  const [selectedId, setSelectedId] = useState("general");
  const selected = availableSections.flatMap((section) => section.items).find((item) => item.id === selectedId) ?? availableSections[0]?.items[0];
  return (
    <WKModal visible={visible} onCancel={onClose} title={t("base.navRail.settingsCenter.title")} width="min(960px, calc(100vw - 48px))" className="wk-settings-center-modal" bodyStyle={{ padding: 0 }} options={{ maskClosable: true }}>
      <div className="wk-settings-center" data-testid="settings-center">
        <aside className="wk-settings-center__sidebar" aria-label={t("base.navRail.settingsCenter.navigation")}>
          {availableSections.map((section) => <div className="wk-settings-center__section" key={section.title}><div className="wk-settings-center__section-title">{section.title}</div>{section.items.map((item) => <button type="button" key={item.id} data-testid={`settings-center-nav-${item.id}`} className={`wk-settings-center__nav-item${selected?.id === item.id ? " is-active" : ""}`} aria-current={selected?.id === item.id ? "page" : undefined} onClick={() => setSelectedId(item.id)}>{item.label}</button>)}</div>)}
          <div className="wk-settings-center__sidebar-spacer" />
          {onSpaceManagement && <button type="button" className="wk-settings-center__footer-action" data-testid="settings-center-space-management" onClick={onSpaceManagement}>{t("base.navRail.settingsPanel.spaceManagement")}</button>}
          {onLogout && <button type="button" className="wk-settings-center__footer-action" data-testid="settings-center-logout" onClick={onLogout}>{t("base.navRail.settingsPanel.logout")}</button>}
        </aside>
        <main className="wk-settings-center__content" data-testid="settings-center-content"><h2>{selected?.label}</h2><p>{t("base.navRail.settingsCenter.placeholder")}</p></main>
      </div>
    </WKModal>
  );
}
