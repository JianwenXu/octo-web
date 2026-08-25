/* eslint-disable no-undef */
import type { Page } from "@playwright/test";

/** SP1: no-space gate followed by a successful Space creation. */
export async function registerSP1SpaceGateCreate(page: Page): Promise<void> {
  await page.evaluate(() => {
    type MSW = {
      worker: { use: (...handlers: unknown[]) => void };
      http: { get: (path: string, resolver: (info: unknown) => unknown) => unknown; post: (path: string, resolver: (info: unknown) => unknown) => unknown };
      HttpResponse: { json: (body: unknown) => unknown };
    };
    const msw = (window as unknown as { __msw?: MSW }).__msw;
    if (!msw) throw new Error("[SP1] MSW worker 未就绪");
    const { worker, http, HttpResponse } = msw;
    const space = {
      space_id: "sp1-created-space", name: "SP1 新组织", description: "", logo: "",
      create_at: "2026-08-25T00:00:00Z", update_at: "2026-08-25T00:00:00Z",
      space_no: "sp1-created-space", owner: "e2e-user-1", status: 1, role: 1,
    };
    worker.use(
      // The initial /space/my request happened before this per-case override and
      // already drove the gate. Subsequent checks should expose the created Space.
      http.get("*/space/my", () => HttpResponse.json([space])),
      http.post("*/space/create", () => {
        return HttpResponse.json({ space_id: space.space_id, name: space.name });
      }),
      http.post("*/space/sp1-created-space/invite", () =>
        HttpResponse.json({ invite_code: "sp1-invite", invite_url: "https://example.test/invite/sp1-invite" })
      ),
    );
  });
}
