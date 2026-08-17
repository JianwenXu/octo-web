import { useState, useEffect, useRef, useCallback } from "react";
import { Toast } from "@douyinfe/semi-ui";
import VoiceService, {
  VoiceConfig,
  VoiceContextResponse,
  VoiceMode,
} from "../../Service/VoiceService";
import VoiceFeedback, { type AsrParams } from "../../Service/VoiceFeedback";
import LocalModelService from "../../Service/LocalModelService";
import WKApp from "../../App";
import { ChatContextResult } from "../Conversation/chatContext";
import { t } from "../../i18n";
import { getMicrophonePermission, setMicrophonePermission, voiceSettingsStore } from "../../Service/VoiceSettingsStore";
import {
  fetchAndApplySpaceSetting,
  resetSharedSpaceSetting,
  setSharedVoiceConfig,
  getSharedSpaceFeedbackState,
  subscribe as subscribeSpaceFeedback,
} from "./useSpaceFeedbackSetting";

export interface UseVoiceInputOptions {
  maxDuration?: number;
  onTranscribed?: (text: string) => void;
  onError?: (error: Error) => void;
  onRecordingFailed?: () => void;
  getChatContext?: () => ChatContextResult | Promise<ChatContextResult>;
  mode?: VoiceMode;
  scene?: string;
}

export interface UseVoiceInputReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  startRecording: (overrideMode?: VoiceMode) => void;
  stopRecordingAndTranscribe: (contextText?: string) => void;
  cancelRecording: () => void;
  isVoiceEnabled: boolean;
  currentMode: VoiceMode;
  localAvailable: boolean;
  currentUtteranceId: string;
}

function getSupportedMimeType(): string {
  if (
    typeof MediaRecorder !== "undefined" &&
    MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
  ) {
    return "audio/webm;codecs=opus";
  }
  return "audio/mp4";
}

export default function useVoiceInput(
  options: UseVoiceInputOptions = {}
): UseVoiceInputReturn {
  const {
    maxDuration = 60,
    onTranscribed,
    onError,
    onRecordingFailed,
    getChatContext,
    mode = "smart",
    scene = "chat",
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [currentMode, setCurrentMode] = useState<VoiceMode>(mode);
  const [localAvailable, setLocalAvailable] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const maxDurationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const contextTextRef = useRef<string | undefined>(undefined);
  const recordingModeRef = useRef<VoiceMode>(mode);
  const utteranceIdRef = useRef("");
  // 每次开始/取消都会推进代次；所有异步录音/识别结果必须属于当前代次才允许回写。
  const sessionEpochRef = useRef(0);
  const cancelRecordingRef = useRef<() => void>(() => {});

  const getChatContextRef = useRef(getChatContext);
  getChatContextRef.current = getChatContext;
  const stopFnRef = useRef<(contextText?: string) => void>(() => {});

  const voiceContextRef = useRef<VoiceContextResponse | null>(null);
  const voiceContextPromiseRef =
    useRef<Promise<VoiceContextResponse | null> | null>(null);
  const voiceContextSpaceIdRef = useRef<string>("");
  const maxFileSizeRef = useRef<number>(0);
  const backendMaxDurationRef = useRef<number | null>(null);
  const backendEnabledRef = useRef(false);
  const feedbackUrlRef = useRef<string | undefined>(undefined);
  const voiceFeedbackOnRef = useRef<number>(0);
  const spaceSeqRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    LocalModelService.shared.loadConfig(localStorage);
    LocalModelService.shared.updateConfig({ enabled: false }, localStorage);

    VoiceService.shared
      .getConfig()
      .then((config: VoiceConfig) => {
        if (cancelled) return;
        setIsVoiceEnabled(voiceSettingsStore.get().enabled);
        backendEnabledRef.current = config.enabled;
        maxFileSizeRef.current = config.max_file_size || 0;
        if (config.max_duration != null) {
          backendMaxDurationRef.current = config.max_duration;
        }
        feedbackUrlRef.current = config.feedback_url;
        setSharedVoiceConfig(config);

        const spaceId = WKApp.shared.currentSpaceId;
        if (spaceId) {
          const seq = ++spaceSeqRef.current;
          fetchAndApplySpaceSetting(spaceId, config.feedback_url).then(() => {
            if (cancelled || spaceSeqRef.current !== seq) return;
            const st = getSharedSpaceFeedbackState();
            voiceFeedbackOnRef.current = (st.spaceSetting?.voice_input_enabled === 1 && st.spaceSetting?.voice_feedback_on === 1) ? 1 : 0;
          });
        } else {
          VoiceFeedback.init(undefined);
        }

      })
      .catch(() => {
        if (cancelled) return;
        setIsVoiceEnabled(voiceSettingsStore.get().enabled);
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => voiceSettingsStore.subscribe((settings) => {
    setIsVoiceEnabled(settings.enabled);
    if (!settings.enabled) cancelRecordingRef.current();
  }), []);

  useEffect(() => {
    const applyLocalSettings = () => {
      const settings = voiceSettingsStore.get();
      LocalModelService.shared.updateConfig({
        enabled: settings.localEnabled,
        requestTimeoutMs: settings.localTimeoutMs,
        ...(settings.localProbeUrl ? { probeUrl: settings.localProbeUrl } : {}),
        ...(settings.localTranscribeUrl ? { transcribeUrl: settings.localTranscribeUrl } : {}),
      }, localStorage);
      if (settings.localEnabled) void LocalModelService.shared.probe().then(setLocalAvailable);
      else setLocalAvailable(false);
    };
    applyLocalSettings();
    return voiceSettingsStore.subscribe(applyLocalSettings);
  }, []);

  // Listen for space changes: destroy + reinit VoiceFeedback
  useEffect(() => {
    const handler = () => {
      cancelRecordingRef.current();
      const prevSpaceId = voiceContextSpaceIdRef.current;
      if (prevSpaceId) {
        VoiceService.shared.clearVoiceContextCache(prevSpaceId);
      }
      voiceContextRef.current = null;
      voiceContextPromiseRef.current = null;
      voiceContextSpaceIdRef.current = "";

      VoiceFeedback.destroy();
      resetSharedSpaceSetting();
      voiceFeedbackOnRef.current = 0;

      const newSpaceId = WKApp.shared.currentSpaceId;
      const url = feedbackUrlRef.current;
      if (newSpaceId) {
        const seq = ++spaceSeqRef.current;
        fetchAndApplySpaceSetting(newSpaceId, url).then(() => {
          if (spaceSeqRef.current !== seq) return;
          const st = getSharedSpaceFeedbackState();
          voiceFeedbackOnRef.current = (st.spaceSetting?.voice_input_enabled === 1 && st.spaceSetting?.voice_feedback_on === 1) ? 1 : 0;
        });
      }
    };
    WKApp.mittBus.on("space-changed", handler);
    return () => {
      WKApp.mittBus.off("space-changed", handler);
    };
  }, []);

  useEffect(() => {
    return subscribeSpaceFeedback(() => {
      const st = getSharedSpaceFeedbackState();
      voiceFeedbackOnRef.current = (st.spaceSetting?.voice_input_enabled === 1 && st.spaceSetting?.voice_feedback_on === 1) ? 1 : 0;
    });
  }, []);

  const cleanup = useCallback(() => {
    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current);
      maxDurationTimeoutRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const invalidateSession = useCallback(() => {
    sessionEpochRef.current += 1;
    voiceContextRef.current = null;
    voiceContextPromiseRef.current = null;
    voiceContextSpaceIdRef.current = "";
    contextTextRef.current = undefined;
  }, []);

  const startRecording = useCallback(
    async (overrideMode?: VoiceMode) => {
      if (isRecording || isTranscribing) {
        return;
      }

      recordingModeRef.current = overrideMode ?? mode;
      setCurrentMode(recordingModeRef.current);

      const sessionEpoch = ++sessionEpochRef.current;

      utteranceIdRef.current =
        crypto.randomUUID?.() ??
        Math.random().toString(36).slice(2) + Date.now().toString(36);

      voiceContextRef.current = null;

      const spaceId = WKApp.shared.currentSpaceId;
      voiceContextSpaceIdRef.current = spaceId;

      if (spaceId) {
        const promise = VoiceService.shared
          .getVoiceContext(spaceId)
          .then((resp) => {
            if (sessionEpochRef.current === sessionEpoch && voiceContextSpaceIdRef.current === spaceId) {
              voiceContextRef.current = resp;
            }
            return resp;
          })
          .catch(() => {
            return null;
          });
        voiceContextPromiseRef.current = promise;
      } else {
        voiceContextPromiseRef.current = null;
      }

      try {
        // 聊天入口和快捷键只使用已授权的麦克风；权限申请必须由设置中心的“授权”按钮触发。
        if (navigator.permissions?.query) {
          const permission = await navigator.permissions.query({ name: "microphone" as PermissionName });
          setMicrophonePermission(permission.state);
          if (permission.state !== "granted") {
            throw new Error("NotAllowedError: microphone permission is not granted");
          }
        } else if (getMicrophonePermission() !== "granted") {
          throw new Error("NotAllowedError: microphone permission is not granted");
        }
        const microphoneDeviceId = voiceSettingsStore.get().microphoneDeviceId;
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: microphoneDeviceId ? { deviceId: { exact: microphoneDeviceId } } : true,
        });
        if (sessionEpochRef.current !== sessionEpoch) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        stream.getTracks().forEach((track) => {
          track.addEventListener("ended", () => {
            if (sessionEpochRef.current !== sessionEpoch) return;
            cancelRecordingRef.current();
            onError?.(new Error("NotReadableError: microphone device ended"));
          });
        });

        const mimeType = getSupportedMimeType();
        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (e: BlobEvent) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        recorder.start();
        setIsRecording(true);

        startTimeRef.current = Date.now();

        const effectiveDuration = Math.max(
          5,
          backendMaxDurationRef.current ?? maxDuration
        );
        maxDurationTimeoutRef.current = setTimeout(() => {
          stopFnRef.current();
        }, effectiveDuration * 1000);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Microphone access denied");
        if (onError) onError(error);
        cleanup();
        if (sessionEpochRef.current === sessionEpoch && onRecordingFailed) onRecordingFailed();
      }
    },
    [isRecording, isTranscribing, maxDuration, onError, onRecordingFailed, cleanup]
  );

  const stopRecordingAndTranscribe = useCallback(
    (contextText?: string) => {
      if (contextText !== undefined) {
        contextTextRef.current = contextText;
      }
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        cleanup();
        setIsRecording(false);
        return;
      }

      const capturedStartTime = startTimeRef.current;
      const sessionEpoch = sessionEpochRef.current;

      recorder.onstop = async () => {
        const mimeType = getSupportedMimeType();
        const blob = new Blob(chunksRef.current, { type: mimeType });
        cleanup();
        setIsRecording(false);

        if (sessionEpochRef.current !== sessionEpoch) return;

        const recordingDurationMs = Date.now() - capturedStartTime;
        if (recordingDurationMs < 1000) {
          Toast.warning(t("base.voiceInput.error.noSpeech"));
          return;
        }

        if (maxFileSizeRef.current > 0 && blob.size > maxFileSizeRef.current) {
          Toast.error(t("base.voiceInput.error.fileTooLarge"));
          if (onError) onError(new Error("Recording file size exceeds limit"));
          return;
        }

        setIsTranscribing(true);
        const notifyFeedback = (
          text: string,
          source: "local" | "remote",
          requestId?: string,
          asrParams?: AsrParams,
        ) => {
          if (voiceFeedbackOnRef.current !== 1) return;
          VoiceFeedback.shared()?.onTranscribeResult({
            utteranceId: utteranceIdRef.current,
            modelText: text,
            source,
            requestId,
            scene,
            audioBlob: source === "local" ? blob : undefined,
            asrParams,
          });
        };

        const allowFeedback = voiceFeedbackOnRef.current === 1;

        try {
          if (sessionEpochRef.current !== sessionEpoch) return;
          const localConfig = LocalModelService.shared.config;
          const useLocalFirst =
            localConfig.preferLocal &&
            localConfig.enabled;

          if (useLocalFirst) {
            const contextPromise = voiceContextPromiseRef.current
              ? Promise.race([
                  voiceContextPromiseRef.current,
                  new Promise<null>((resolve) =>
                    setTimeout(() => resolve(null), 3000)
                  ),
                ])
              : Promise.resolve(null);
            const chatCtxPromise =
              getChatContextRef.current?.() ?? Promise.resolve({});

            await contextPromise;
            voiceContextPromiseRef.current = null;

            let personalContext: string | undefined;
            const voiceCtx = voiceContextRef.current;
            if (voiceCtx && voiceCtx.has_context === true && voiceCtx.context) {
              personalContext = voiceCtx.context;
            }

            const chatCtxResult = (await chatCtxPromise) ?? {};
            const memberContext = chatCtxResult.memberContext;
            const chatContext = chatCtxResult.chatContext;
            const selfName = chatCtxResult.selfName;

            const localResult =
              await LocalModelService.shared.transcribe(
                blob,
                contextTextRef.current,
                chatContext,
                personalContext,
                memberContext,
                recordingModeRef.current,
                selfName,
              );
            if (sessionEpochRef.current !== sessionEpoch) return;
            if (localResult) {
              if (localResult.text) {
                notifyFeedback(localResult.text, "local", undefined, {
                  contextText: contextTextRef.current,
                  chatContext,
                  personalContext,
                  memberContext,
                  selfName,
                  mode: recordingModeRef.current,
                  channelType: chatCtxResult.channelType,
                  model: localResult.m,
                  allowFeedback,
                });
                if (onTranscribed) onTranscribed(localResult.text);
              }
              return;
            }

            if (!backendEnabledRef.current) {
              Toast.error(t("base.voiceInput.error.localTranscriptionFailed"));
              if (onError) onError(new Error("Transcription failed"));
              return;
            }

            const result = await VoiceService.shared.transcribe(
              blob,
              contextTextRef.current,
              chatContext,
              personalContext,
              memberContext,
              recordingModeRef.current,
              true,
              chatCtxResult.channelType,
              allowFeedback,
              selfName,
            );
            if (sessionEpochRef.current !== sessionEpoch) return;
            if (result.text) {
              notifyFeedback(result.text, "remote", result.request_id);
              if (onTranscribed) onTranscribed(result.text);
            }
            return;
          }

          if (voiceContextPromiseRef.current) {
            await voiceContextPromiseRef.current;
            voiceContextPromiseRef.current = null;
          }

          let personalContext: string | undefined;
          const voiceCtx = voiceContextRef.current;
          if (voiceCtx && voiceCtx.has_context === true && voiceCtx.context) {
            personalContext = voiceCtx.context;
          }

          const chatCtxResult = (await getChatContextRef.current?.()) ?? {};
          const memberContext = chatCtxResult.memberContext;
          const chatContext = chatCtxResult.chatContext;
          const selfName = chatCtxResult.selfName;

          if (!backendEnabledRef.current) {
            Toast.error(t("base.voiceInput.error.unavailable"));
            if (onError) onError(new Error("Transcription failed"));
            return;
          }

          const result = await VoiceService.shared.transcribe(
            blob,
            contextTextRef.current,
            chatContext,
            personalContext,
            memberContext,
            recordingModeRef.current,
            true,
            chatCtxResult.channelType,
            allowFeedback,
            selfName,
          );
          if (sessionEpochRef.current !== sessionEpoch) return;
          if (result.text) {
            notifyFeedback(result.text, "remote", result.request_id);
            if (onTranscribed) onTranscribed(result.text);
          }
        } catch (err) {
          if (sessionEpochRef.current !== sessionEpoch) return;
          Toast.error(t("base.voiceInput.error.transcriptionFailedRetry"));
          if (onError) onError(new Error("Transcription failed"));
        } finally {
          if (sessionEpochRef.current === sessionEpoch) {
            setIsTranscribing(false);
            contextTextRef.current = undefined;
          }
        }
      };

      recorder.stop();
    },
    [cleanup, onTranscribed, onError]
  );

  stopFnRef.current = stopRecordingAndTranscribe;

  const cancelRecording = useCallback(() => {
    invalidateSession();
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }
    cleanup();
    setIsRecording(false);
    setIsTranscribing(false);
  }, [cleanup, invalidateSession]);
  cancelRecordingRef.current = cancelRecording;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      invalidateSession();
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      }
      cleanup();
    };
  }, [cleanup, invalidateSession]);

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecordingAndTranscribe,
    cancelRecording,
    isVoiceEnabled,
    currentMode,
    localAvailable,
    currentUtteranceId: utteranceIdRef.current,
  };
}
