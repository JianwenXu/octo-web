/* eslint-disable no-undef */
// A1: 应用模块加载应用列表，并支持关键词筛选。
import { test, expect } from "../../fixtures-authed";

test("@A1 @p1 @appbot 应用列表搜索", async ({ authedPage }) => {
  await authedPage.route("**/app_bot/available", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "app-docs",
          uid: "app-docs-bot",
          display_name: "文档助手",
          description: "搜索和整理文档",
          scope: "platform",
        },
        {
          id: "app-weekly",
          uid: "app-weekly-bot",
          display_name: "周报助手",
          description: "生成团队周报",
          scope: "space",
        },
      ]),
    });
  });

  await authedPage.goto("/appbot");
  await expect(authedPage.getByText("应用", { exact: true }).first()).toBeVisible();
  await expect(authedPage.getByText("文档助手", { exact: true })).toBeVisible();
  await expect(authedPage.getByText("周报助手", { exact: true })).toBeVisible();

  await authedPage.getByPlaceholder("搜索").fill("文档");
  await expect(authedPage.getByText("文档助手", { exact: true })).toBeVisible();
  await expect(authedPage.getByText("周报助手", { exact: true })).toBeHidden();
});
