import { test, expect } from "../../fixtures-authed";
import { registerSP5SpaceInviteApproval } from "../../msw-handlers/sp5-space-invite-approval";

test("@SP5 @p1 @space @invite @approval 邀请加入需审批", async ({ authedPage }) => {
  await registerSP5SpaceInviteApproval(authedPage);
  await authedPage.goto("/?sid=e2etest&invite=SP5-APPROVAL");

  await expect(authedPage.getByText("SP5 审批组织", { exact: true })).toBeVisible();
  await authedPage.getByRole("button", { name: "加入组织", exact: true }).click();

  await expect(authedPage.getByText("申请已提交", { exact: true })).toBeVisible();
  await expect(
    authedPage.getByText(/你的加入申请已提交，请等待管理员审批通过后即可加入/)
  ).toBeVisible();
  await expect(authedPage.getByText("选择对话，激活连接", { exact: true })).toHaveCount(0);
});
