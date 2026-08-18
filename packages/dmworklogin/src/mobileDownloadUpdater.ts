import { apiFetchJson, WKApp } from "@octo/base";
import {
  fetchMobileDownloadUrl as fetchSharedMobileDownloadUrl,
  resolveMobileUpdaterUrl,
  useMobileDownloadUrl as useSharedMobileDownloadUrl,
} from "@octo/base/src/Service/mobileDownloadUpdater";

export { resolveMobileUpdaterUrl };

const fetchWithApi = (url: string) => apiFetchJson(url);

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
