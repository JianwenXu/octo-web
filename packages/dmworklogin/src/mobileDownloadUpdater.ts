import { apiFetchJson, WKApp } from "@octo/base";
import {
  fetchMobileDownloadUrl as fetchSharedMobileDownloadUrl,
  resolveMobileUpdaterUrl as resolveSharedMobileUpdaterUrl,
  useMobileDownloadUrl as useSharedMobileDownloadUrl,
} from "@octo/base/src/Service/mobileDownloadUpdater";

export function resolveMobileUpdaterUrl(
  updaterPath: string,
  apiUrl = WKApp.apiClient.config.apiURL,
) {
  return resolveSharedMobileUpdaterUrl(updaterPath, apiUrl);
}

const fetchWithApi = (url: string, init?: RequestInit) => apiFetchJson(url, init);

export function fetchMobileDownloadUrl(updaterPath: string) {
  return fetchSharedMobileDownloadUrl(
    updaterPath,
    fetchWithApi,
    WKApp.apiClient.config.apiURL,
  );
}

export function useMobileDownloadUrl(updaterPath: string) {
  return useSharedMobileDownloadUrl(
    updaterPath,
    fetchWithApi,
    WKApp.apiClient.config.apiURL,
  );
}
