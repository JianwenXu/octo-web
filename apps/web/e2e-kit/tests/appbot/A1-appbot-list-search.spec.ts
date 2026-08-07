/* eslint-disable no-undef -- e2e code runs in Node */
/* eslint-disable @typescript-eslint/no-explicit-any -- msw resolver types */
import { test, expect } from "../../fixtures-authed";

// A1: 应用模块加载应用列表，并支持关键词筛选。
test("@A1 @p1 @appbot 应用列表搜索", async ({ authedPage }) => {
  await authedPage.addInitScript(() => {
    const install = () => {
      const w = window as unknown as {
        __a1Installed__?: boolean;
        __msw?: {
          worker: { use: (...handlers: unknown[]) => void };
          http: { get: (path: string, resolver: (info: any) => unknown) => unknown };
          HttpResponse: { json: (body: unknown, init?: unknown) => unknown };
        };
      };
      if (w.__a1Installed__ || !w.__msw) return;
      const { worker, http, HttpResponse } = w.__msw;
      worker.use(
        http.get("*/api/v1/app_bot/available", () =>
          HttpResponse.json([
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
          ])
        )
      );
      w.__a1Installed__ = true;
    };
    const timer = window.setInterval(install, 10);
    window.setTimeout(() => window.clearInterval(timer), 30_000);
  });

  await authedPage.goto("/appbot");
  await expect(authedPage.getByText("应用", { exact: true }).first()).toBeVisible();
  await expect(authedPage.getByText("文档助手", { exact: true })).toBeVisible();
  await expect(authedPage.getByText("周报助手", { exact: true })).toBeVisible();

  await authedPage.getByPlaceholder("搜索").fill("文档");
  await expect(authedPage.getByText("文档助手", { exact: true })).toBeVisible();
  await expect(authedPage.getByText("周报助手", { exact: true })).toBeHidden();
});
