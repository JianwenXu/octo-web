import React, { Component } from "react";
import { I18nContext, WKApp, t } from "@octo/base";
import { SpaceService } from "@octo/base";
import { Input, Button, Toast, Spin } from "@douyinfe/semi-ui";
import { SpaceCreate } from "@octo/base";
import { LogOut } from "lucide-react";
import "./index.css";

interface SpaceGateState {
    loading: boolean;
    noSpace: boolean;
    inviteCode: string;
    joining: boolean;
    showCreate: boolean;
    showInviteInput: boolean;
}

export default class SpaceGate extends Component<{}, SpaceGateState> {
    static contextType = I18nContext;
    declare context: React.ContextType<typeof I18nContext>;

    state: SpaceGateState = {
        loading: true,
        noSpace: false,
        inviteCode: "",
        joining: false,
        showCreate: false,
        showInviteInput: false,
    };

    private _enterTimer: ReturnType<typeof setTimeout> | null = null;
    private _isEntering = false;
    private _isMounted = false;
    private _unsubscribeRemoteConfig?: () => void;

    componentDidMount() {
        this._isMounted = true;
        this._unsubscribeRemoteConfig = WKApp.remoteConfig.addConfigChangeListener(() => {
            if (!this._isMounted) return;
            if (WKApp.remoteConfig.disableUserCreateSpace && this.state.showCreate) {
                this.setState({ showCreate: false });
                return;
            }
            this.forceUpdate();
        });
        const cached = localStorage.getItem("currentSpaceId");
        if (cached) {
            this.enterSpace(cached);
            return;
        }
        this.checkSpaces();
    }

    componentWillUnmount() {
        this._isMounted = false;
        this._unsubscribeRemoteConfig?.();
        if (this._enterTimer) {
            clearTimeout(this._enterTimer);
            this._enterTimer = null;
        }
    }

    enterSpace = (spaceId: string) => {
        if (this._isEntering) return;
        this._isEntering = true;

        if (this._enterTimer) {
            clearTimeout(this._enterTimer);
            this._enterTimer = null;
        }

        WKApp.shared.currentSpaceId = spaceId;
        WKApp.shared.spaceChecked = true;
        localStorage.setItem("currentSpaceId", spaceId);
        try { WKApp.shared.notifyListener(); } catch (_) {}

        if (this._isMounted) {
            this.forceUpdate();
        }

        this._enterTimer = setTimeout(() => {
            this._enterTimer = null;
            // In MSW-backed E2E, the reload can race the Service Worker taking
            // control of the fresh document and leak the first /space/my/avatar
            // requests to Vite's proxy. The state update above is sufficient to
            // leave the gate in this controlled test path; production keeps the
            // historical reload behavior.
            const mswReady = (globalThis as { __MSW_READY__?: boolean }).__MSW_READY__ === true;
            const e2eSpaceGate = sessionStorage.getItem("__e2e_scenario") === "sp1-space-gate-created";
            if (this._isMounted && document.querySelector(".wk-spacegate") && !mswReady && !e2eSpaceGate) {
                window.location.reload();
            }
        }, 300);
    };

    checkSpaces = async () => {
        try {
            const spaces = await SpaceService.shared.getMySpaces();
            if (spaces.length >= 1) {
                this.enterSpace(spaces[0].space_id);
            } else {
                this.setState({ loading: false, noSpace: true });
            }
        } catch {
            this.setState({ loading: false, noSpace: true });
        }
    };

    joinSpace = async () => {
        const { inviteCode } = this.state;
        if (!inviteCode.trim()) { Toast.warning(t("app.joinSpace.validation.inviteRequired")); return; }
        this.setState({ joining: true });
        try {
            await SpaceService.shared.joinSpace(inviteCode.trim());
            Toast.success(t("app.spaceGate.joinedSpace"));
            this.checkSpaces();
        } catch (e: any) {
            const msg = e?.msg || e?.message || "";
            if (msg.includes(t("app.invite.serverTerms.full", { locale: "zh-CN" })) || msg.includes("SPACE_FULL")) {
                Toast.error(t("app.invite.spaceFullCannotJoin"));
            } else {
                Toast.error(t("app.joinSpace.inviteInvalidOrExpired"));
            }
        } finally {
            this.setState({ joining: false });
        }
    };

    logout = () => {
        void WKApp.shared.logoutUserInitiated();
    };

    render() {
        const { loading, noSpace, inviteCode, joining, showCreate, showInviteInput } = this.state;
        const { t } = this.context;
        const canCreateSpace = !WKApp.remoteConfig.disableUserCreateSpace;

        if (loading && !noSpace) {
            return (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                    <Spin size="large" />
                </div>
            );
        }

        return (
            <div className="wk-spacegate" style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", height: "100vh",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}>
                <div style={{
                    background: "white", borderRadius: 16, padding: "48px 40px",
                    textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                    minWidth: 360, maxWidth: 420, color: "#333333",
                }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
                    <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px" }}>{t("app.spaceGate.welcome", { values: { appName: WKApp.config.appName } })}</h2>
                    <p style={{ color: "#888", fontSize: 14, marginBottom: 32 }}>{t("app.spaceGate.subtitle")}</p>

                    {!showInviteInput ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <Button type="primary" size="large" style={{ width: "100%", height: 44 }}
                                onClick={() => this.setState({ showInviteInput: true })}>
                                📩 {t("app.spaceGate.joinByInvite")}
                            </Button>
                            {canCreateSpace && (
                                <Button type="secondary" size="large" style={{ width: "100%", height: 44 }}
                                    onClick={() => this.setState({ showCreate: true })}>
                                    ✨ {t("app.spaceGate.createTeam")}
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <Input
                                placeholder={t("app.joinSpace.inputInvitePlaceholder")}
                                size="large"
                                value={inviteCode}
                                onChange={(v) => this.setState({ inviteCode: v })}
                                onEnterPress={this.joinSpace}
                            />
                            <Button type="primary" size="large" loading={joining}
                                style={{ width: "100%", height: 44 }}
                                onClick={this.joinSpace}>
                                {t("app.spaceGate.join")}
                            </Button>
                            <Button type="tertiary" size="small"
                                onClick={() => this.setState({ showInviteInput: false })}>
                                ← {t("app.common.back")}
                            </Button>
                        </div>
                    )}
                    <div className="wk-spacegate-logout">
                        <button type="button" className="wk-spacegate-logout-btn" onClick={this.logout}>
                            <LogOut size={14} aria-hidden="true" />
                            <span>{t("app.spaceGate.logout")}</span>
                        </button>
                    </div>
                </div>

                <SpaceCreate
                    visible={canCreateSpace && showCreate}
                    onClose={() => this.setState({ showCreate: false })}
                    onSuccess={(_spaceId) => this.checkSpaces()}
                />
            </div>
        );
    }
}
