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
  // CI leak target plus legacy mock host marker; workflow proxy-error grep remains the fail-closed guard.
  realHosts: ["127.0.0.1:9", "mock.e2e.local"],
  apiPrefixRe: /^\/(api|summary\/api)(\/|$)/,
  loginPathRe: /\/login(\?|$)/,
};

test.describe("@SV1 @p1 @summary @summary-list @visual SV1 — Summary 列表视觉基线", () => {
  test("已完成总结卡片列表 UI baseline", async ({ authedPage }) => {
    await registerSV1SummaryListBaseline(authedPage);
    const ctx = startRequestMonitor(authedPage, sanityConfig);
    await authedPage.clock.setFixedTime(new Date("2026-08-04T08:35:00Z"));

    await authedPage.getByRole("button", { name: "智能总结" }).click();

    await expect(authedPage.getByRole("heading", { name: "智能总结" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(authedPage.getByPlaceholder("搜索总结...")).toBeVisible();
    await expect(authedPage.getByText("SV1 视觉基线总结")).toBeVisible();
    await expect(authedPage.getByText("SV1 视觉群")).toBeVisible();
    await expect(authedPage.getByText("暂无总结记录")).toHaveCount(0);

    await expect(authedPage).toHaveScreenshot("summary-list-completed.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
    });

    await sanityCheck(authedPage, ctx);
  });
});
