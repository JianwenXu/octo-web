/* eslint-disable no-undef */
// spec: apps/web/e2e-kit/case-specs/space/SP1-space-gate-create.md

import { test, expect, E2E_SID, AUTH_KEYS_SUFFIXED, MOCK_LOCALE } from "../../fixtures-authed";
import { registerSP1SpaceGateCreate } from "../../msw-handlers/sp1-space-gate-create";

test("@SP1 @p0 @space @space-gate 无 Space 后创建组织进入主界面", async ({ pagePlain }) => {
  await pagePlain.addInitScript(({ sid, suffixed, locale }: { sid: string; suffixed: Record<string, string>; locale: string }) => {
    const ls = localStorage;
    const ss = sessionStorage;
    ss.setItem("octo.session.sid", sid);
    if (!ss.getItem("__e2e_scenario")) ss.setItem("__e2e_scenario", "sp1-space-gate");
    ls.setItem("octo:locale", locale);
    ls.setItem("octo:onboarding:seen", "seen");
    for (const [key, value] of Object.entries(suffixed)) ls.setItem(`${key}${sid}`, value);
  }, { sid: E2E_SID, suffixed: AUTH_KEYS_SUFFIXED, locale: MOCK_LOCALE });
  await pagePlain.goto(`/?sid=${E2E_SID}`);
  await pagePlain.waitForFunction(() => (globalThis as unknown as { __MSW_READY__?: boolean }).__MSW_READY__ === true);

  await expect(pagePlain.getByRole("heading", { name: "欢迎使用 Octo！" })).toBeVisible();
  await expect(pagePlain.getByRole("button", { name: /创建新组织/ })).toBeVisible();
  await expect(pagePlain.getByText("Chat", { exact: true })).toHaveCount(0);

  await registerSP1SpaceGateCreate(pagePlain);
  await pagePlain.getByRole("button", { name: /创建新组织/ }).click();
  const dialog = pagePlain.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByPlaceholder("输入组织名称").fill("SP1 新组织");
  await pagePlain.evaluate(() => sessionStorage.setItem("__e2e_scenario", "sp1-space-gate-created"));
  await dialog.getByRole("button", { name: "创建", exact: true }).click();

  await expect(pagePlain.getByRole("button", { name: "切换组织" })).toContainText("SP1 新组织", { timeout: 15_000 });
  await expect(pagePlain.getByRole("heading", { name: "欢迎使用 Octo！" })).toHaveCount(0);
});
