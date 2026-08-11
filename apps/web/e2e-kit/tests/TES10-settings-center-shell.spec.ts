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
  await expect(authedPage.getByRole("switch", { name: "Dark mode" })).toBeVisible();
  await authedPage.screenshot({ path: frame("03-settings-center-general"), fullPage: true });
  await authedPage.getByTestId("settings-center-nav-notifications").click();
  await expect(authedPage.getByTestId("settings-center-content")).toContainText("Notifications and sound");
  await authedPage.screenshot({ path: frame("04-settings-center-notifications"), fullPage: true });

  await authedPage.getByTestId("settings-center-nav-shortcuts").click();
  await expect(authedPage.getByTestId("settings-center-content")).toContainText("New chat");
  await expect(authedPage.getByTestId("settings-center-content")).toContainText("Chat");
  await expect(authedPage.getByTestId("settings-center-content")).toContainText("Voice input");
  await expect(authedPage.locator(".wk-settings-center__shortcut-row")).toHaveCount(8);
  await expect(authedPage.locator("kbd")).toHaveCount(18);
  await authedPage.screenshot({ path: frame("05-settings-center-shortcuts"), fullPage: true });

  await authedPage.getByTestId("settings-center-nav-devices").click();
  await expect(authedPage.getByTestId("settings-center-content")).toContainText("Use Octo on other devices");
  await expect(authedPage.getByTestId("settings-center-content")).toContainText("Android");
  await expect(authedPage.getByTestId("settings-center-content")).toContainText("OctoASR");
  await expect(authedPage.getByTestId("settings-center-content")).toContainText("Mobile");
  await expect(authedPage.getByTestId("settings-center-content")).toContainText("Open-source projects");
  await expect(authedPage.getByTestId("settings-center-content")).toContainText("Download link not confirmed");
  await expect(authedPage.locator(".wk-settings-center__resource-card")).toHaveCount(4);
  await expect(authedPage.getByRole("link", { name: "Download from GitHub" })).toHaveAttribute("href", "https://github.com/Mininglamp-OSS/octo-android/releases/latest");
  await expect(authedPage.getByRole("link", { name: "View project" })).toHaveAttribute("href", "https://github.com/Mininglamp-AI/OctoASR");
  await authedPage.screenshot({ path: frame("06-settings-center-resources"), fullPage: true });

  await authedPage.getByTestId("settings-center-nav-about").click();
  await expect(authedPage.getByTestId("settings-center-content")).toContainText("Help and about");
  await expect(authedPage.getByTestId("settings-center-content")).toContainText("Current version");
  await authedPage.screenshot({ path: frame("07-settings-center-about"), fullPage: true });

  await expect(authedPage.getByTestId("settings-center-logout")).toBeVisible();
  await authedPage.getByTestId("settings-center-logout").click();
  await expect(center).toBeHidden();
  await authedPage.screenshot({ path: frame("08-settings-center-closed"), fullPage: true });
});
