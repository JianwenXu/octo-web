/* eslint-disable no-undef -- e2e code runs in Node */
/** spec: e2e-kit/case-specs/cross-module/X2-summary-share-cold-link-boundary.md */
import { test, expect, AUTH_KEYS_SUFFIXED, E2E_SID, MOCK_LOCALE, LOCALE_STORAGE_KEY, ONBOARDING_STORAGE_KEY, SPACE_STORAGE_KEY } from "../../fixtures-authed";
import { registerX2SummaryShareColdLinkBoundary } from "../../msw-handlers/x2-summary-share-cold-link-boundary";

test("@X2 @p1 @cross-module @summary @deep-link @cold-start Summary 分享冷启动不显示返回聊天", async ({ pagePlain }) => {
  await pagePlain.addInitScript(({ sid, auth, spaceKey, spaceId, localeKey, locale, onboardingKey }) => {
    const ls = localStorage;
    sessionStorage.setItem("octo.session.sid", sid);
    for (const [key, value] of Object.entries(auth)) ls.setItem(`${key}${sid}`, value);
    ls.setItem(spaceKey, spaceId);
    ls.setItem(localeKey, locale);
    ls.setItem(onboardingKey, "seen");
  }, { sid: E2E_SID, auth: AUTH_KEYS_SUFFIXED, spaceKey: SPACE_STORAGE_KEY, spaceId: "e2e-space-001", localeKey: LOCALE_STORAGE_KEY, locale: MOCK_LOCALE, onboardingKey: ONBOARDING_STORAGE_KEY });

  await pagePlain.goto(`/?sid=${E2E_SID}`);
  await pagePlain.waitForFunction(() => (globalThis as { __MSW_READY__?: boolean }).__MSW_READY__ === true);
  await registerX2SummaryShareColdLinkBoundary(pagePlain);
  await pagePlain.goto(`/s/share/e2e-share-026?sid=${E2E_SID}`);

  await expect(pagePlain.getByRole("heading", { name: "S26 分享总结" })).toBeVisible({ timeout: 15_000 });
  await expect(pagePlain.getByText("这是从分享链接直接打开的总结正文。", { exact: true })).toBeVisible();
  await expect(pagePlain.getByRole("button", { name: "返回聊天" })).toHaveCount(0);
});
