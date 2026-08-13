import WKApp from "../../App";
import React, { Component } from "react";
import { Button, Progress } from "@douyinfe/semi-ui";
import WKModal from "../WKModal";
import { t } from "../../i18n";
import { checkVersionOnce } from "../../Utils/versionChecker";
import ChangelogMarkdown from "./ChangelogMarkdown";
import SettingsCenter, { OpenSecretsRequest } from "./SettingsCenter";

export interface NavSettingsPanelProps {
    settingSelected: boolean;
    showAppVersion: boolean;
    showAppUpdate: boolean;
    appUpdateProgress: number;
    showAppUpdateOperation: boolean;
    lastVersionInfo?: { appVersion: string; updateDesc: string };
    onOpenOnboarding?: () => void;
    onToggleSetting: () => void;
    onSetShowAppVersion: (v: boolean) => void;
    onInstallUpdate: () => void;
    onNotifyListener: () => void;
}

interface NavSettingsPanelState {
    secretsRequest: OpenSecretsRequest | null;
}

/** The settings button owns one modal. Legacy flyout actions are intentionally not mounted here. */
export default class NavSettingsPanel extends Component<NavSettingsPanelProps, NavSettingsPanelState> {
    private secretsSequence = 0;

    state: NavSettingsPanelState = { secretsRequest: null };

    componentDidMount() {
        WKApp.mittBus.on("wk:open-secrets", this.handleOpenSecrets);
    }

    componentWillUnmount() {
        WKApp.mittBus.off("wk:open-secrets", this.handleOpenSecrets);
    }

    handleOpenSecrets = (payload?: { create?: boolean; name?: string; value?: string }) => {
        this.secretsSequence += 1;
        this.setState({ secretsRequest: { ...payload, sequence: this.secretsSequence } });
        if (!this.props.settingSelected) this.props.onToggleSetting();
    };

    closeSettings = () => {
        this.setState({ secretsRequest: null });
        if (this.props.settingSelected) this.props.onToggleSetting();
    };

    render() {
        const {
            settingSelected,
            showAppVersion,
            showAppUpdate,
            appUpdateProgress,
            showAppUpdateOperation,
            lastVersionInfo,
            onOpenOnboarding,
            onSetShowAppVersion,
            onInstallUpdate,
            onNotifyListener,
        } = this.props;

        const providerId = WKApp.loginInfo.loginProvider;
        const oidcProvider = providerId ? WKApp.remoteConfig.oidcProviders.find((p) => p.id === providerId) : undefined;
        const accountCenterUrl = oidcProvider?.accountUrl;

        return (
            <>
                <SettingsCenter
                    visible={settingSelected}
                    isDesktop={Boolean((WKApp.config as unknown as { isDesktop?: boolean } | undefined)?.isDesktop)}
                    hasAccountCenter={Boolean(accountCenterUrl)}
                    accountCenterUrl={accountCenterUrl}
                    onClose={this.closeSettings}
                    onLogout={() => { this.closeSettings(); void WKApp.shared.logoutUserInitiated(); }}
                    onAbout={() => { void this.checkVersion(); }}
                    onOpenOnboarding={onOpenOnboarding}
                    openSecretsRequest={this.state.secretsRequest}
                />

                <WKModal
                    title={t("base.navRail.settingsPanel.updateCheckTitle")}
                    visible={showAppVersion}
                    options={{ maskClosable: false, closeOnEsc: false }}
                    onCancel={() => { onSetShowAppVersion(false); onNotifyListener(); }}
                    footer={showAppUpdateOperation ? (
                        <>
                            <Button theme="solid" type="tertiary" onClick={() => { onSetShowAppVersion(false); onNotifyListener(); }}>{t("base.common.cancel")}</Button>
                            <Button theme="solid" type="primary" onClick={onInstallUpdate}>{t("base.common.update")}</Button>
                        </>
                    ) : undefined}
                >
                    <div style={{ overflow: "auto", height: 200 }}>
                        {lastVersionInfo && <div className="wk-versioncheckview"><div className="wk-versioncheckview-content"><div className="wk-versioncheckview-updateinfo"><ul>
                            <li>{t("base.navRail.settingsPanel.currentVersion")}: {WKApp.config.appVersion}&nbsp;&nbsp;{t("base.navRail.settingsPanel.targetVersion")}: {lastVersionInfo.appVersion}</li>
                            <li>{t("base.navRail.settingsPanel.updateContent")}</li>
                            <li><ChangelogMarkdown content={lastVersionInfo.updateDesc} /></li>
                        </ul></div></div></div>}
                        {showAppUpdate && <Progress percent={appUpdateProgress} style={{ height: "8px" }} showInfo aria-label="update progress" />}
                    </div>
                </WKModal>
            </>
        );
    }

    private checkVersion = async () => {
        // The About page still uses the shared version checker through the host VM.
        // Keeping this hook local preserves the existing update notification behavior.
        await checkVersionOnce();
    };
}
