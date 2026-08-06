/* eslint-disable no-undef -- e2e code runs in Node */
/* eslint-disable @typescript-eslint/no-explicit-any -- msw resolver types */
import type { Page } from "@playwright/test";

/** S27: Summary 分享详情可读 / 不可用态. */
export async function registerS27SummaryShareDetail(page: Page): Promise<void> {
  await page.evaluate(() => {
    type MSW = {
      worker: { use: (...h: unknown[]) => void };
      http: { get: (path: string, resolver: (info: any) => unknown) => unknown };
      HttpResponse: { json: (body: unknown, init?: unknown) => unknown };
    };
    const msw = (window as unknown as { __msw?: MSW }).__msw;
    if (!msw) throw new Error("[S27] MSW worker 未就绪 (等 __MSW_READY__).");
    const { worker, http, HttpResponse } = msw;
    const env = (data: unknown) => HttpResponse.json({ code: 0, message: "ok", data });
    const snapshot = {
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
    };

    worker.use(
      http.get("*/summary/api/v1/summary-shares/s27-share-ok", () =>
        env({ share_id: "s27-share-ok", source_accessible: true, snapshot })
      ),
      http.get("*/summary/api/v1/summary-shares/s27-share-missing", () =>
        HttpResponse.json({ code: 404, message: "not found", data: null }, { status: 404 })
      )
    );
  });
}
