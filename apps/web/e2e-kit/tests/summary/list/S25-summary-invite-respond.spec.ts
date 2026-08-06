/* eslint-disable no-undef -- e2e code runs in Node */
/**
 * spec: e2e-kit/case-specs/summary/list/S25-summary-invite-respond.md
 *
 * S25: Summary 列表待确认邀请同意 / 拒绝.
 */
import { test, expect } from "../../../fixtures-authed";
import { registerS25SummaryInviteRespond } from "../../../msw-handlers/s25-summary-invite-respond";
import { startRequestMonitor, sanityCheck } from "../../../_lib/sanity";
import { T } from "../_testids";

const sanityConfig = {
  realHosts: ["127.0.0.1:9", "mock.e2e.local"],
  apiPrefixRe: /^\/(api|summary\/api)(\/|$)/,
  loginPathRe: /\/login(\?|$)/,
};

test.describe("@S25 @p2 @summary @list @summary-list @summary-invite S25 — Summary 邀请响应", () => {
  test("列表卡片同意和拒绝待确认邀请", async ({ authedPage }) => {
    await registerS25SummaryInviteRespond(authedPage);
    const ctx = startRequestMonitor(authedPage, sanityConfig);

    await authedPage.getByRole("button", { name: "智能总结" }).click();
    const acceptCard = authedPage.getByTestId(T.card(250251));
    const rejectCard = authedPage.getByTestId(T.card(250252));

    await expect(acceptCard).toBeVisible({ timeout: 15_000 });
    await expect(rejectCard).toBeVisible();
    await expect(acceptCard).toContainText("S25 同意邀请总结");
    await expect(rejectCard).toContainText("S25 拒绝邀请总结");
    await expect(acceptCard.getByTestId(T.cardAcceptBtn(250251))).toBeVisible();
    await expect(rejectCard.getByTestId(T.cardRejectBtn(250252))).toBeVisible();

    await acceptCard.getByTestId(T.cardAcceptBtn(250251)).click();
    await expect(authedPage.getByText("已同意")).toBeVisible({ timeout: 15_000 });
    await expect(acceptCard.getByTestId(T.cardAcceptBtn(250251))).toHaveCount(0);
    await expect(acceptCard.getByTestId(T.cardRejectBtn(250251))).toHaveCount(0);

    await rejectCard.getByTestId(T.cardRejectBtn(250252)).click();
    await expect(authedPage.getByText("已拒绝")).toBeVisible({ timeout: 15_000 });
    await expect(rejectCard.getByTestId(T.cardAcceptBtn(250252))).toHaveCount(0);
    await expect(rejectCard.getByTestId(T.cardRejectBtn(250252))).toHaveCount(0);
    await expect(authedPage.getByText("加载失败")).toHaveCount(0);

    await sanityCheck(authedPage, ctx);
  });
});
