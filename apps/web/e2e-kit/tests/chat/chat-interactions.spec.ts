/* eslint-disable no-undef -- e2e code runs in Node */
// @spec apps/web/e2e-kit/case-specs/chat/CH9-chat-message-context-menu.md
// @spec apps/web/e2e-kit/case-specs/chat/CH11-chat-mention-candidates.md
// @spec apps/web/e2e-kit/case-specs/chat/CH12-chat-reply-message.md
import { test, expect } from "../../fixtures-authed";
import {
  installMockImRuntime,
  type MockSeed,
} from "../../_kit/mock-im-runtime";
import { registerCh9ChatMessageHistory } from "../../msw-handlers/ch9-chat-message-history";

const GROUP_ID = "e2e-chat-context-menu-group";
const GROUP_NAME = "E2E Chat 消息群";
const HISTORY_MESSAGE = "E2E 历史文本消息";

function seed(): MockSeed {
  return {
    currentUid: "e2e-user-1",
    spaceId: "e2e-space-001",
    users: [
      { uid: "e2e-user-1", name: "E2E Tester", robot: 0 },
      { uid: "e2e-user-2", name: "E2E Sender", robot: 0 },
    ],
    groups: [{ group_no: GROUP_ID, name: GROUP_NAME }],
    conversations: [
      {
        channelId: GROUP_ID,
        channelType: 2,
        unread: 0,
        timestamp: Math.floor(Date.now() / 1000),
      },
    ],
    messages: [
      {
        channelId: GROUP_ID,
        channelType: 2,
        messageSeq: 1,
        fromUid: "e2e-user-2",
        content: { type: 1, text: HISTORY_MESSAGE },
      },
    ],
    subscribers: [
      {
        channelId: GROUP_ID,
        channelType: 2,
        uid: "e2e-user-1",
        name: "E2E Tester",
      },
      {
        channelId: GROUP_ID,
        channelType: 2,
        uid: "e2e-user-2",
        name: "E2E Sender",
      },
    ],
  };
}

async function openConversation(
  page: Parameters<typeof installMockImRuntime>[0],
  mockSeed: MockSeed,
  expectHistory = false
) {
  await installMockImRuntime(page, mockSeed);
  await page.getByRole("button", { name: "会话" }).click();
  const recentTab = page.getByRole("button", { name: "最近", exact: true });
  await expect(recentTab).toBeVisible();
  await recentTab.click();
  await expect(page.getByText(GROUP_NAME, { exact: true })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByText(GROUP_NAME, { exact: true }).click();
  if (expectHistory) {
    await expect(page.getByText(HISTORY_MESSAGE, { exact: true })).toBeVisible({
      timeout: 15_000,
    });
  } else {
    await expect(page.locator('[contenteditable="true"]')).toBeVisible({
      timeout: 15_000,
    });
  }
}

test("@CH10 @p1 @chat @composer Shift+Enter 插入换行而不发送", async ({
  authedPage,
}) => {
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

test("@CH9 @p1 @chat @message-context-menu 消息右键菜单提供消息操作", async ({
  authedPage,
}) => {
  await registerCh9ChatMessageHistory(authedPage);
  await openConversation(authedPage, seed(), true);
  const message = authedPage.getByText(HISTORY_MESSAGE, { exact: true });
  await message.click({ button: "right" });

  await expect(authedPage.getByTestId("ctx-message-copy")).toBeVisible();
  await expect(authedPage.getByText("回复", { exact: true })).toBeVisible();
  await expect(authedPage.getByTestId("ctx-message-forward")).toBeVisible();
  await expect(authedPage.getByTestId("ctx-message-multiselect")).toBeVisible();
});

test("@CH11 @p1 @chat @composer @mention 输入 @ 后显示群成员候选", async ({
  authedPage,
}) => {
  await registerCh9ChatMessageHistory(authedPage);
  await openConversation(authedPage, seed(), true);
  const editor = authedPage.locator('[contenteditable="true"]');
  await editor.click();
  await editor.pressSequentially("@");

  await expect(authedPage.getByRole("listbox")).toBeVisible({
    timeout: 15_000,
  });
  await expect(
    authedPage.getByRole("option", { name: "E2E Sender" })
  ).toBeVisible();
});

test("@CH12 @p1 @chat @message-context-menu 回复消息后显示回复态", async ({
  authedPage,
}) => {
  await registerCh9ChatMessageHistory(authedPage);
  await openConversation(authedPage, seed(), true);
  await authedPage
    .getByText(HISTORY_MESSAGE, { exact: true })
    .click({ button: "right" });
  await authedPage.getByText("回复", { exact: true }).click();

  const replyView = authedPage.locator(".wk-replyview-new");
  await expect(replyView).toBeVisible();
  await expect(replyView).toContainText("E2E Sender");
  await expect(replyView).toContainText(HISTORY_MESSAGE);
});
