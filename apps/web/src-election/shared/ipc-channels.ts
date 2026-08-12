/**
 * Shared IPC channel name constants.
 *
 * Import this file in both the main process and the renderer / preload so
 * that the string literal is only defined once and typos are caught at
 * compile time rather than silently breaking at runtime.
 */

/** Renderer → Main: sync the current unread-message count to the tray. */
export const IPC_CONVERSATION_UNREAD_COUNT = "conversation-manager-unread-count";

/** Renderer ↔ Main: persist and apply the Desktop keep-awake preference. */
export const IPC_KEEP_AWAKE_GET = "keep-awake-get";
export const IPC_KEEP_AWAKE_SET = "keep-awake-set";
