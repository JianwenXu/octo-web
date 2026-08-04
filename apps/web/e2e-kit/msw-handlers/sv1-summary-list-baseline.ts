/* eslint-disable no-undef -- e2e code runs in Node */
/* eslint-disable @typescript-eslint/no-explicit-any -- msw resolver types */
import type { Page } from "@playwright/test";

/** SV1: Summary 列表已完成卡片视觉基线. */
export async function registerSV1SummaryListBaseline(page: Page): Promise<void> {
  await page.evaluate(() => {
    type MSW = {
      worker: { use: (...h: unknown[]) => void };
      http: { get: (path: string, resolver: (info: any) => unknown) => unknown };
      HttpResponse: { json: (body: unknown, init?: unknown) => unknown };
    };
    const msw = (window as unknown as { __msw?: MSW }).__msw;
    if (!msw) throw new Error("[SV1] MSW worker 未就绪 (等 __MSW_READY__).");
    const { worker, http, HttpResponse } = msw;
    const env = (data: unknown) => HttpResponse.json({ code: 0, message: "ok", data });
    const item = {
      task_id: 9801,
      task_no: "SV1-TASK-9801",
      title: "SV1 视觉基线总结",
      topic: "SV1 视觉基线总结",
      summary_mode: 1,
      status: 3,
      trigger_type: 1,
      schedule_id: null,
      creator_id: "e2e-user-1",
      time_range_start: "2026-08-03T00:00:00Z",
      time_range_end: "2026-08-04T00:00:00Z",
      sources: [{ source_type: 1, source_id: "sv1-g-1", source_name: "SV1 视觉群" }],
      participants: [{ user_id: "e2e-user-1", user_name: "E2E Tester", status: 1 }],
      total_msg_count: 32,
      creator_name: "E2E Tester",
      origin_channel_id: "sv1-g-1",
      origin_channel_type: 2,
      created_at: "2026-08-04T08:30:00Z",
      completed_at: "2026-08-04T08:35:00Z",
      is_unread: false,
      has_pending_invitation: false,
      has_pending_submission: false,
      needs_attention: false,
      current_result_id: 10801,
      current_personal_version_id: null,
      activity_at: "2026-08-04T08:35:00Z",
    };
    (window as unknown as { __sv1State__: { listCalls: number } }).__sv1State__ = {
      listCalls: 0,
    };

    worker.use(
      http.get("*/summary/api/v1/summaries", () => {
        const state = (window as unknown as { __sv1State__: { listCalls: number } }).__sv1State__;
        state.listCalls += 1;
        return env({ items: [item], total: 1 });
      })
    );
  });
}
