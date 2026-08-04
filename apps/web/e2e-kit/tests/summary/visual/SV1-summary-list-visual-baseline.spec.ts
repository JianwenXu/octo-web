/* eslint-disable no-undef -- e2e code runs in Node */
/**
 * spec: e2e-kit/case-specs/summary/visual/SV1-summary-list-visual-baseline.md
 *
 * SV1: Summary 列表已完成卡片 UI baseline.
 */
import { test, expect } from "../../../fixtures-authed";
import { registerSV1SummaryListBaseline } from "../../../msw-handlers/sv1-summary-list-baseline";
import { startRequestMonitor, sanityCheck } from "../../../_lib/sanity";

const sanityConfig = {
  realHosts: ["mock.e2e.local"],
  apiPrefixRe: /^\/(api|summary\/api)(\/|$)/,
  loginPathRe: /\/login(\?|$)/,
};

test.describe("@SV1 @p1 @summary @summary-list @visual SV1 — Summary 列表视觉基线", () => {
  test("已完成总结卡片列表 UI baseline", async ({ authedPage }) => {
    await registerSV1SummaryListBaseline(authedPage);
    const ctx = startRequestMonitor(authedPage, sanityConfig);

    await authedPage.getByRole("button", { name: "智能总结" }).click();

    const listPage = authedPage.locator(".summary-list-page");
    await expect(listPage.getByRole("heading", { name: "智能总结" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(listPage.getByPlaceholder("搜索总结...")).toBeVisible();
    await expect(listPage.getByText("SV1 视觉基线总结")).toBeVisible();
    await expect(listPage.getByText("SV1 视觉群")).toBeVisible();
    await expect(listPage.getByText("暂无总结记录")).toHaveCount(0);

    await expect(listPage).toHaveScreenshot("summary-list-completed.png", {
      animations: "disabled",
    });

    await sanityCheck(authedPage, ctx);
  });
});
