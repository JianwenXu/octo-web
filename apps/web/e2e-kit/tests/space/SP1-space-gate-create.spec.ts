/* eslint-disable no-undef */
// spec: apps/web/e2e-kit/case-specs/space/SP1-space-gate-create.md

import { test, expect, E2E_SID, AUTH_KEYS_SUFFIXED, MOCK_LOCALE } from "../../fixtures-authed";
import { registerSP1SpaceGateCreate } from "../../msw-handlers/sp1-space-gate-create";

test("@SP1 @p0 @space @space-gate 无 Space 后创建组织进入主界面", async ({ pagePlain }) => {
  let created = false;
  const space = { space_id: "sp1-created-space", name: "SP1 新组织", description: "", logo: "", create_at: "2026-08-25T00:00:00Z", update_at: "2026-08-25T00:00:00Z", space_no: "sp1-created-space", owner: "e2e-user-1", status: 1, role: 1 };
  // Cold-start guards only; the per-case MSW handler owns business endpoints.
  await pagePlain.route("**/api/v1/space/my**", (route) => route.fulfill({ json: created ? [space] : [] }));
  await pagePlain.route("**/api/v1/users/e2e-user-1/avatar**", (route) => route.fulfill({ status: 200, contentType: "image/png", body: Buffer.from([]) }));
  await pagePlain.route("**/api/v1/sidebar/sync", (route) => route.fulfill({ json: { conversations: [], groups: [], users: [] } }));
  await pagePlain.addInitScript(({ sid, suffixed, locale }: { sid: string; suffixed: Record<string, string>; locale: string }) => {
    const ls = localStorage;
    const ss = sessionStorage;
    ss.setItem("octo.session.sid", sid);
    if (!ss.getItem("__e2e_scenario")) ss.setItem("__e2e_scenario", "sp1-space-gate");
    document.cookie = "e2e_scenario=sp1-space-gate; path=/";
    ls.removeItem("currentSpaceId");
    ls.setItem("octo:locale", locale);
    ls.setItem("octo:onboarding:seen", "seen");
    for (const [key, value] of Object.entries(suffixed)) ls.setItem(`${key}${sid}`, value);
  }, { sid: E2E_SID, suffixed: AUTH_KEYS_SUFFIXED, locale: MOCK_LOCALE });
  await pagePlain.goto(`/?sid=${E2E_SID}&e2e_scenario=sp1-space-gate`);
  await pagePlain.waitForFunction(() => (globalThis as unknown as { __MSW_READY__?: boolean }).__MSW_READY__ === true);
  await registerSP1SpaceGateCreate(pagePlain);

  await expect(pagePlain.getByRole("heading", { name: "欢迎使用 Octo！" })).toBeVisible();
  await expect(pagePlain.getByRole("button", { name: /创建新组织/ })).toBeVisible();
  await expect(pagePlain.getByText("Chat", { exact: true })).toHaveCount(0);

  await pagePlain.getByRole("button", { name: /创建新组织/ }).click();
  const dialog = pagePlain.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByPlaceholder("输入组织名称").fill("SP1 新组织");
  await pagePlain.evaluate(() => {
    sessionStorage.setItem("__e2e_scenario", "sp1-space-gate-created");
    document.cookie = "e2e_scenario=sp1-space-gate-created; path=/";
  });
  const createRequest = pagePlain.waitForRequest("**/api/v1/space/create");
  await dialog.getByRole("button", { name: "创建", exact: true }).click();
  await createRequest;
  created = true;
  await expect(pagePlain.getByRole("button", { name: "切换组织" })).toContainText("SP1 新组织", { timeout: 15_000 });
  await expect(pagePlain.getByRole("heading", { name: "欢迎使用 Octo！" })).toHaveCount(0);
});
