import type { Page } from "@playwright/test";

export async function registerGS1GlobalSearchResults(page: Page): Promise<void> {
  await page.evaluate(() => {
    type Msw = { worker: { use: (...handlers: unknown[]) => void }; http: { post: (path: string, resolver: () => unknown) => unknown }; HttpResponse: { json: (body: unknown) => unknown } };
    const msw = (window as unknown as { __msw?: Msw }).__msw;
    if (!msw) throw new Error("[GS1] MSW worker 未就绪");
    msw.worker.use(msw.http.post("*/search/global", () => msw.HttpResponse.json({
      friends: [{ channel_id: "gs1-contact", channel_type: 1, channel_name: "GS1 联系人" }],
      groups: [],
      messages: [{
        message_id: "gs1-message", message_seq: 1, from_uid: "e2e-user-1",
        channel: { channel_id: "gs1-group", channel_type: 2, channel_name: "GS1 群聊" },
        payload: { type: 1, content: "E2E 全局搜索消息" },
      }],
    })), msw.http.post("*/_search_global_messages", () => msw.HttpResponse.json({
      data: [{ result_type: "message", sorted_at: "2026-08-25T08:00:00Z", message: {
        message_id: "gs1-message", message_seq: 1, message_kind: "text", snippet: "E2E 全局搜索消息", sender_id: "e2e-user-1", sender_name: "E2E Tester", sender_avatar_url: "", sent_at: "2026-08-25T08:00:00Z", channel_id: "gs1-group", channel_type: 2,
    } }], pagination: { has_more: false }
    })), msw.http.post("*/_search_global_groups", () => msw.HttpResponse.json({ data: { sequence: 1, total_groups: 1, groups: [{ channel_id: "gs1-group", channel_type: 2, group_name: "GS1 群聊", match_count: 1, latest_at: "2026-08-25T08:00:00Z" }] }, pagination: { has_more: false } })), msw.http.post("*/_search_global_files", () => msw.HttpResponse.json({ data: [], pagination: { has_more: false } })));
  });
}
