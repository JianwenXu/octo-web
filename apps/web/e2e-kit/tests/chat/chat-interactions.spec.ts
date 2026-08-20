/* eslint-disable no-undef -- e2e code runs in Node */
import { test, expect } from "../../fixtures-authed";
import { installMockImRuntime, type MockSeed } from "../../_kit/mock-im-runtime";

const GROUP_ID = "e2e-chat-interactions-group";
const GROUP_NAME = "E2E Chat 消息群";

function seed(): MockSeed {
  return {
    currentUid: "e2e-user-1",
    spaceId: "e2e-space-001",
    users: [
      { uid: "e2e-user-1", name: "E2E Tester", robot: 0 },
      { uid: "e2e-user-2", name: "E2E Mention User", robot: 0 },
    ],
    groups: [{ group_no: GROUP_ID, name: GROUP_NAME }],
    conversations: [{ channelId: GROUP_ID, channelType: 2, unread: 0, timestamp: Math.floor(Date.now() / 1000) }],
    messages: [],
    subscribers: [],
  };
}

async function openConversation(page: Parameters<typeof installMockImRuntime>[0], mockSeed: MockSeed) {
  await installMockImRuntime(page, mockSeed);
  await page.getByRole("button", { name: "会话" }).click();
  await page.getByRole("button", { name: /^最近/ }).click();
  await page.getByText(GROUP_NAME, { exact: true }).click();
  await expect(page.locator('[contenteditable="true"]')).toBeVisible({ timeout: 15_000 });
}

test("@CH10 @p1 @chat @composer Shift+Enter 插入换行而不发送", async ({ authedPage }) => {
  await openConversation(authedPage, seed());
  const editor = authedPage.locator('[contenteditable="true"]');
  await editor.click();
  await editor.pressSequentially("第一行");
  await editor.press("Shift+Enter");
  await editor.pressSequentially("第二行");

  await expect(editor).toContainText("第一行");
  await expect(editor).toContainText("第二行");
  await expect(authedPage.getByText("第一行", { exact: true })).toHaveCount(0);
});
