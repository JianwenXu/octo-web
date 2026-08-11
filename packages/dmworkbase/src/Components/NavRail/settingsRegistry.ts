import type { ReactNode } from "react";
import type { RuntimeEnvironment } from "../../Runtime";

export type SettingsCenterCapability = "desktop" | "account";
export type SettingsItem = { id: string; label: string; capabilities?: SettingsCenterCapability[] };
export type SettingsGroup = { title: string; items: SettingsItem[] };

export const settingsGroups: SettingsGroup[] = [
  { title: "设置", items: [{ id: "general", label: "通用" }, { id: "account", label: "账号与安全" }, { id: "notifications", label: "通知与声音" }, { id: "voice", label: "语音输入" }] },
  { title: "桌面应用", items: [{ id: "desktop-behavior", label: "应用行为", capabilities: ["desktop"] }, { id: "downloads", label: "文件与下载", capabilities: ["desktop"] }] },
  { title: "工具与资源", items: [{ id: "shortcuts", label: "键盘快捷键" }, { id: "devices", label: "在其他设备上使用 Octo" }, { id: "about", label: "帮助与关于" }] },
];

export interface SettingsRegistryContext {
  environment: RuntimeEnvironment;
  hasAccountCenter: boolean;
}

export function getAvailableSettingsGroups(context: SettingsRegistryContext): SettingsGroup[] {
  return settingsGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        (item.capabilities ?? []).every((capability) =>
          capability === "desktop"
            ? context.environment.target === "desktop"
            : context.hasAccountCenter,
        ),
      ),
    }))
    .filter((group) => group.items.length > 0);
}

export type SettingsIconName = SettingsItem["id"];
export type SettingsPageRenderer = (item: SettingsItem) => ReactNode;
