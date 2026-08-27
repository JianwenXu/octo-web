import { test, expect } from "../../fixtures-authed";
import { registerSP4SpaceInviteFull } from "../../msw-handlers/sp4-space-invite-full";

test("@SP4 @p1 @space @invite @full 满员 Space 禁止加入", async ({ authedPage }) => {
  await registerSP4SpaceInviteFull(authedPage);
  await authedPage.goto("/?sid=e2etest&invite=SP4-FULL");

  await expect(authedPage.getByText("SP4 满员组织", { exact: true })).toBeVisible();
  await expect(authedPage.getByText("100/100 人", { exact: true })).toBeVisible();

  const joinButton = authedPage.getByRole("button", { name: "组织已满", exact: true });
  await expect(joinButton).toBeVisible();
  await expect(joinButton).toBeDisabled();
});
