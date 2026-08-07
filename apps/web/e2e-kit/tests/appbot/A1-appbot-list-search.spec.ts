/* eslint-disable no-undef -- e2e code runs in Node */
/* eslint-disable @typescript-eslint/no-explicit-any -- msw resolver types */
import { test, expect } from "../../fixtures-authed";
import { startRequestMonitor, sanityCheck, type SanityConfig } from "../../_lib/sanity";

const sanityConfig: SanityConfig = {
  realHosts: ["127.0.0.1:9", "mock.e2e.local"],
  apiPrefixRe: /^\/(api|summary\/api)(\/|$)/,
  loginPathRe: /\/login(\?|$)/,
};

// A1: 应用模块加载应用列表，并支持关键词筛选。
test.describe("@A1 @p1 @appbot", () => {
  test("应用列表搜索", async ({ authedPage }) => {
    const ctx = startRequestMonitor(authedPage, sanityConfig);
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
    await expect(authedPage.getByText("平台应用", { exact: true })).toBeVisible();
    await expect(authedPage.getByText(/空间应用/)).toBeVisible();
  await expect(authedPage.getByText("文档助手", { exact: true })).toBeVisible();
  await expect(authedPage.getByText("周报助手", { exact: true })).toBeVisible();

    await authedPage.getByPlaceholder("搜索").fill("文档");
    await expect(authedPage.getByText("文档助手", { exact: true })).toBeVisible();
    await expect(authedPage.getByText("周报助手", { exact: true })).toBeHidden();

    await authedPage.getByPlaceholder("搜索").fill("不存在的应用");
    await expect(authedPage.getByText("未找到匹配的应用", { exact: true })).toBeVisible();
    await sanityCheck(authedPage, ctx);
  });
});
