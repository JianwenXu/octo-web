/* eslint-disable no-undef */
import type { Page } from "@playwright/test";

/** SP1: no-space gate followed by a successful Space creation. */
export async function registerSP1SpaceGateCreate(page: Page): Promise<void> {
  const install = () => page.evaluate(() => {
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
    let created = sessionStorage.getItem("__sp1_created") === "1";
    worker.use(
      http.get("*/space/my", () => HttpResponse.json(created ? [space] : [])),
      http.post("*/space/create", async ({ request }) => {
        const body = await request.json().catch(() => null) as { name?: string } | null;
        if (body?.name !== space.name) return HttpResponse.json({ msg: "invalid space name" }, { status: 400 });
        created = true;
        sessionStorage.setItem("__sp1_created", "1");
        return HttpResponse.json({ space_id: space.space_id, name: space.name });
      }),
      http.post("*/space/sp1-created-space/invite", () =>
        HttpResponse.json({ invite_code: "sp1-invite", invite_url: "https://example.test/invite/sp1-invite" })
      ),
    );
  });
  await page.addInitScript(() => {
    const timer = window.setInterval(() => {
      const msw = (window as unknown as { __msw?: { worker: { use: (...handlers: unknown[]) => void }; http: { get: (path: string, resolver: () => unknown) => unknown; post: (path: string, resolver: (info: unknown) => unknown) => unknown }; HttpResponse: { json: (body: unknown, init?: unknown) => unknown } } }).__msw;
      if (!msw) return;
      const space = { space_id: "sp1-created-space", name: "SP1 新组织", description: "", logo: "", create_at: "2026-08-25T00:00:00Z", update_at: "2026-08-25T00:00:00Z", space_no: "sp1-created-space", owner: "e2e-user-1", status: 1, role: 1 };
      let created = sessionStorage.getItem("__sp1_created") === "1";
      msw.worker.use(
        msw.http.get("*/space/my", () => msw.HttpResponse.json(created ? [space] : [])),
        msw.http.post("*/space/create", async ({ request }: { request: Request }) => {
          const body = await request.json().catch(() => null) as { name?: string } | null;
          if (body?.name !== space.name) return msw.HttpResponse.json({ msg: "invalid space name" }, { status: 400 });
          created = true; sessionStorage.setItem("__sp1_created", "1");
          return msw.HttpResponse.json({ space_id: space.space_id, name: space.name });
        }),
      );
      window.clearInterval(timer);
    }, 10);
  });
  await install();
}
