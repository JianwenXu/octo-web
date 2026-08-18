import React from "react";

export type MobileDownloadFetcher = (url: string) => Promise<unknown>;

export type MobileDownloadUrlState =
  | { status: "idle" | "loading" | "error"; downloadUrl?: undefined }
  | { status: "ready"; downloadUrl: string };

export function resolveMobileUpdaterUrl(
  updaterPath: string,
  apiUrl: string,
) {
  return `${apiUrl.replace(/\/?$/, "/")}${updaterPath}`;
}

export function resolveSafeDownloadUrl(
  value: unknown,
  baseUrl = typeof window === "undefined" ? "http://localhost" : window.location.origin,
) {
  if (typeof value !== "string") return undefined;
  const normalizedValue = value.trim();
  if (!normalizedValue) return undefined;
  try {
    const url = new URL(normalizedValue, baseUrl);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

export async function fetchMobileDownloadUrl(
  updaterPath: string,
  fetcher: MobileDownloadFetcher,
  apiUrl: string,
) {
  const result = await fetcher(resolveMobileUpdaterUrl(updaterPath, apiUrl));
  const downloadUrl = resolveSafeDownloadUrl(
    result && typeof result === "object" && "url" in result
      ? (result as { url?: unknown }).url
      : undefined,
  );
  if (!downloadUrl) throw new Error("Updater returned an invalid download URL");
  return downloadUrl;
}

export function useMobileDownloadUrl(
  updaterPath: string | undefined,
  fetcher: MobileDownloadFetcher,
  apiUrl: string,
) {
  const [state, setState] = React.useState<MobileDownloadUrlState>({
    status: updaterPath ? "loading" : "idle",
  });
  const requestIdRef = React.useRef(0);

  const load = React.useCallback(() => {
    const requestId = ++requestIdRef.current;
    if (!updaterPath) {
      setState({ status: "idle" });
      return;
    }
    setState({ status: "loading" });
    void fetchMobileDownloadUrl(updaterPath, fetcher, apiUrl).then(
      (downloadUrl) => {
        if (requestId === requestIdRef.current) setState({ status: "ready", downloadUrl });
      },
      () => {
        if (requestId === requestIdRef.current) setState({ status: "error" });
      },
    );
  }, [apiUrl, fetcher, updaterPath]);

  React.useEffect(() => {
    load();
    return () => { requestIdRef.current += 1; };
  }, [load]);

  return { ...state, retry: load };
}
