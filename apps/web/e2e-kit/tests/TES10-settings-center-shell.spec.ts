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
  const languageSelect = authedPage.getByRole("combobox", { name: "selected" });
  await expect(languageSelect).toBeVisible();
  await languageSelect.click();
  await authedPage.getByText("English", { exact: true }).last().click();
  await expect(authedPage.locator("html")).toHaveAttribute("lang", "en-US");
  await expect(authedPage.getByText("深色主题即将上线", { exact: true })).toBeHidden();
  await expect(authedPage.getByRole("switch", { name: "深色模式" })).toBeVisible();
  await authedPage.screenshot({ path: frame("03-settings-center-general"), fullPage: true });
  await authedPage.getByTestId("settings-center-nav-notifications").click();
  await expect(authedPage.getByTestId("settings-center-content")).toContainText("通知与声音");
  await authedPage.screenshot({ path: frame("04-settings-center-notifications"), fullPage: true });

  await authedPage.getByTestId("settings-center-nav-shortcuts").click();
  await expect(authedPage.getByTestId("settings-center-content")).toContainText("新聊天");
  await expect(authedPage.getByTestId("settings-center-content")).toContainText("聊天");
  await expect(authedPage.getByTestId("settings-center-content")).toContainText("语音输入");
  await expect(authedPage.locator("kbd")).toHaveCount(8);
  await authedPage.screenshot({ path: frame("05-settings-center-shortcuts"), fullPage: true });

  await authedPage.getByTestId("settings-center-nav-devices").click();
  await expect(authedPage.getByTestId("settings-center-content")).toContainText("Octo Android");
  await expect(authedPage.getByTestId("settings-center-content")).toContainText("OctoASR");
  await expect(authedPage.getByRole("link", { name: "从 GitHub 下载" })).toHaveAttribute("href", "https://github.com/Mininglamp-OSS/octo-android/releases/latest");
  await expect(authedPage.getByRole("link", { name: "查看项目" })).toHaveAttribute("href", "https://github.com/Mininglamp-AI/OctoASR");
  await authedPage.screenshot({ path: frame("06-settings-center-resources"), fullPage: true });

  await authedPage.getByTestId("settings-center-nav-about").click();
  await expect(authedPage.getByTestId("settings-center-content")).toContainText("更新日志");
  await expect(authedPage.getByTestId("settings-center-content")).toContainText("当前版本");
  await authedPage.screenshot({ path: frame("07-settings-center-about"), fullPage: true });

  await expect(authedPage.getByTestId("settings-center-logout")).toBeVisible();
  await authedPage.getByTestId("settings-center-logout").click();
  await expect(center).toBeHidden();
  await authedPage.screenshot({ path: frame("08-settings-center-closed"), fullPage: true });
});
