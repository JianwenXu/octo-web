import { test, expect } from "../fixtures-authed";

test.use({ video: "on", trace: "on" });

test("@TES10 settings center shell interaction", async ({ authedPage }, testInfo) => {
  const frame = (name: string) => testInfo.outputPath(`${name}.png`);
  await authedPage.screenshot({ path: frame("01-main"), fullPage: true });
  const settingsButton = authedPage.getByRole("button", { name: "设置" });
  await expect(settingsButton).toBeVisible({ timeout: 15_000 });
  await settingsButton.click();
  await authedPage.screenshot({ path: frame("02-settings-menu"), fullPage: true });
  await authedPage.getByRole("menuitem", { name: "设置中心" }).click();
  const center = authedPage.getByTestId("settings-center");
  await expect(center).toBeVisible();
  await expect(authedPage.getByTestId("settings-center-nav-general")).toHaveAttribute("aria-current", "page");
  await expect(authedPage.getByText("桌面应用")).toBeHidden();
  await authedPage.screenshot({ path: frame("03-settings-center-general"), fullPage: true });
  await authedPage.getByTestId("settings-center-nav-notifications").click();
  await expect(authedPage.getByTestId("settings-center-content")).toContainText("通知与声音");
  await authedPage.screenshot({ path: frame("04-settings-center-notifications"), fullPage: true });
  await expect(authedPage.getByTestId("settings-center-logout")).toBeVisible();
  await authedPage.getByTestId("settings-center-logout").click();
  await expect(center).toBeHidden();
  await authedPage.screenshot({ path: frame("05-settings-center-closed"), fullPage: true });
});
