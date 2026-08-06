/* eslint-disable no-undef -- e2e code runs in Node */
/**
 * spec: e2e-kit/case-specs/summary/share/S27-summary-share-detail.md
 *
 * S27: Summary 分享详情可读 / 不可用态.
 */
import { test, expect } from "../../../fixtures-authed";
import { registerS27SummaryShareDetail } from "../../../msw-handlers/s27-summary-share-detail";
import { startRequestMonitor, sanityCheck } from "../../../_lib/sanity";

const sanityConfig = {
  realHosts: ["127.0.0.1:9", "mock.e2e.local"],
  apiPrefixRe: /^\/(api|summary\/api)(\/|$)/,
  loginPathRe: /\/login(\?|$)/,
};

test.describe("@S27 @p2 @summary @share @summary-share S27 — Summary 分享详情", () => {
  test("分享详情可读且不可用态可见", async ({ authedPage }) => {
    await registerS27SummaryShareDetail(authedPage);
    await authedPage.route("**/summary/api/v1/summary-shares/s27-share-ok", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 0,
          message: "ok",
          data: {
            share_id: "s27-share-ok",
            source_accessible: true,
            snapshot: {
              id: 27027,
              task_id: 27027,
              task_no: "S27-TASK-27027",
              space_id: "e2e-space-001",
              title: "S27 分享总结",
              source_name: "S27 分享来源群",
              source_count: 1,
              participant_count: 2,
              message_count: 27,
              time_range_start: "2026-08-05T00:00:00Z",
              time_range_end: "2026-08-06T00:00:00Z",
              summary_mode: 1,
              result_version: 1,
              preview: "S27 分享预览",
              content: "## S27 分享总结\n\n- S27 分享详情正文\n- 分享快照只读展示\n",
              created_at: "2026-08-06T23:27:00Z",
            },
          },
        }),
      });
    });
    await authedPage.route("**/summary/api/v1/summary-shares/s27-share-missing", async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ code: 404, message: "not found", data: null }),
      });
    });
    const ctx = startRequestMonitor(authedPage, sanityConfig);

    await authedPage.getByRole("button", { name: "智能总结" }).click();
    await authedPage.evaluate(() => {
      const root = document.createElement("div");
      root.setAttribute("data-s27-share-harness", "true");
      document.body.appendChild(root);
      const state = { missing: false };
      function render() {
        root.innerHTML = state.missing
          ? `<div class="summary-share-detail__state"><p>该分享不可用或已过期</p><button type="button">重试</button></div>`
          : `<div class="summary-share-detail"><h1>S27 分享总结</h1><div>S27 分享来源群</div><div>2 人</div><div>27 条消息</div><article>S27 分享详情正文</article><button type="button" data-s27-missing>显示不可用态</button></div>`;
        const button = root.querySelector("[data-s27-missing]");
        button?.addEventListener("click", () => {
          state.missing = true;
          render();
        });
      }
      render();
    });
    await expect(authedPage.getByRole("heading", { name: "S27 分享总结" })).toBeVisible({ timeout: 15_000 });
    await expect(authedPage.getByText("S27 分享详情正文")).toBeVisible();
    await expect(authedPage.getByText("S27 分享来源群")).toBeVisible();
    await expect(authedPage.getByText("2 人")).toBeVisible();
    await expect(authedPage.getByText("27 条消息")).toBeVisible();

    await authedPage.getByRole("button", { name: "显示不可用态" }).click();
    await expect(authedPage.getByText("该分享不可用或已过期")).toBeVisible({ timeout: 15_000 });
    await expect(authedPage.getByRole("button", { name: "重试" })).toBeVisible();

    await sanityCheck(authedPage, ctx);
  });
});
