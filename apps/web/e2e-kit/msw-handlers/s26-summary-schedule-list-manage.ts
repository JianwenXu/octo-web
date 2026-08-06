/* eslint-disable no-undef -- e2e code runs in Node */
/* eslint-disable @typescript-eslint/no-explicit-any -- msw resolver types */
import type { Page } from "@playwright/test";

/** S26: 定时总结管理页列表、启停、删除. */
export async function registerS26SummaryScheduleListManage(page: Page): Promise<void> {
  await page.evaluate(() => {
    type MSW = {
      worker: { use: (...h: unknown[]) => void };
      http: {
        get: (path: string, resolver: (info: any) => unknown) => unknown;
        put: (path: string, resolver: (info: any) => unknown) => unknown;
        delete: (path: string, resolver: (info: any) => unknown) => unknown;
      };
      HttpResponse: { json: (body: unknown, init?: unknown) => unknown };
    };
    const msw = (window as unknown as { __msw?: MSW }).__msw;
    if (!msw) throw new Error("[S26] MSW worker 未就绪 (等 __MSW_READY__).");
    const { worker, http, HttpResponse } = msw;
    const env = (data: unknown) => HttpResponse.json({ code: 0, message: "ok", data });
    const scheduleId = 26026;
    const makeItem = (active: boolean) => ({
      schedule_id: scheduleId,
      title: "S26 每周项目定时总结",
      generation_instruction: "S26 定时生成要求",
      summary_mode: 1,
      cron_expr: "",
      interval_days: 7,
      interval_months: 0,
      day_of_week: 1,
      day_of_month: 0,
      run_time: "09:30",
      time_range_type: 2,
      sources: [{ source_type: 1, source_id: "s26-project-group", source_name: "S26 项目群" }],
      participants: [{ user_id: "e2e-user-1" }],
      is_active: active,
      next_run_at: active ? "2026-08-10T09:30:00Z" : null,
      participant_config: { participants: [{ user_id: "e2e-user-1", confirmed: true }], confirm_gate_passed: true },
    });
    (window as unknown as { __s26State__: { active: boolean; deleted: boolean } }).__s26State__ = {
      active: true,
      deleted: false,
    };

    worker.use(
      http.get("*/summary/api/v1/summary-schedules", () => {
        const state = (window as unknown as { __s26State__: { active: boolean; deleted: boolean } }).__s26State__;
        return env(state.deleted ? [] : [makeItem(state.active)]);
      }),
      http.put("*/summary/api/v1/summary-schedules/26026/toggle", async ({ request }: any) => {
        const state = (window as unknown as { __s26State__: { active: boolean; deleted: boolean } }).__s26State__;
        const body = await request.json();
        state.active = Boolean(body.is_active);
        return env(makeItem(state.active));
      }),
      http.delete("*/summary/api/v1/summary-schedules/26026", () => {
        const state = (window as unknown as { __s26State__: { active: boolean; deleted: boolean } }).__s26State__;
        state.deleted = true;
        return env({});
      })
    );
  });
}
