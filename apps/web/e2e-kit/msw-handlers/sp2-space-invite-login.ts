import type { Page } from "@playwright/test";

export async function registerSP2SpaceInviteLogin(page: Page): Promise<void> {
  const install = () => page.evaluate(() => {
    type Msw = { worker: { use: (...handlers: unknown[]) => void }; http: { get: (path: string, resolver: (info: unknown) => unknown) => unknown; post: (path: string, resolver: (info: unknown) => unknown) => unknown }; HttpResponse: { json: (body: unknown, init?: unknown) => unknown } };
    const msw = (window as unknown as { __msw?: Msw }).__msw;
    if (!msw) return;
    const space = { space_id: "sp2-invite-space", name: "SP2 邀请空间", space_no: "sp2-invite-space", description: "", logo: "", owner: "e2e-user-1", status: 1, role: 1 };
    msw.worker.use(
      msw.http.post("*/user/login", () => msw.HttpResponse.json({ uid: "e2e-user-1", token: "e2e-mock-token", app_id: "e2e-app", short_no: "10000", name: "E2E Tester", sex: 1 })),
      msw.http.post("*/user/emaillogin", () => msw.HttpResponse.json({ uid: "e2e-user-1", token: "e2e-mock-token", app_id: "e2e-app", short_no: "10000", name: "E2E Tester", sex: 1 })),
      msw.http.get("*/space/invite/SP2-INVITE", () => msw.HttpResponse.json({ invite_code: "SP2-INVITE", space_id: space.space_id, space_name: space.name, member_count: 1, max_users: 100 })),
      msw.http.post("*/space/join", async ({ request }: { request: Request }) => {
        const body = await request.json().catch(() => null) as { invite_code?: string } | null;
        if (body?.invite_code !== "SP2-INVITE") return msw.HttpResponse.json({ msg: "invalid invite code" }, { status: 400 });
        sessionStorage.setItem("__sp2_joined", "1"); localStorage.setItem("currentSpaceId", "sp2-invite-space");
        return msw.HttpResponse.json({ space_id: space.space_id, status: "JOINED" });
      }),
    );
  });
  await page.addInitScript(() => {
    const timer = window.setInterval(() => {
      const msw = (window as unknown as { __msw?: { worker: { use: (...handlers: unknown[]) => void }; http: { get: (path: string, resolver: (info: unknown) => unknown) => unknown; post: (path: string, resolver: (info: unknown) => unknown) => unknown }; HttpResponse: { json: (body: unknown, init?: unknown) => unknown } } }).__msw;
      if (!msw) return;
      const space = { space_id: "sp2-invite-space", name: "SP2 邀请空间", space_no: "sp2-invite-space", description: "", logo: "", owner: "e2e-user-1", status: 1, role: 1 };
      msw.worker.use(
        msw.http.post("*/user/login", () => msw.HttpResponse.json({ uid: "e2e-user-1", token: "e2e-mock-token", app_id: "e2e-app", short_no: "10000", name: "E2E Tester", sex: 1 })),
        msw.http.post("*/user/emaillogin", () => msw.HttpResponse.json({ uid: "e2e-user-1", token: "e2e-mock-token", app_id: "e2e-app", short_no: "10000", name: "E2E Tester", sex: 1 })),
        msw.http.get("*/space/invite/SP2-INVITE", () => msw.HttpResponse.json({ invite_code: "SP2-INVITE", space_id: space.space_id, space_name: space.name, member_count: 1, max_users: 100 })),
        msw.http.post("*/space/join", async ({ request }: { request: Request }) => { const body = await request.json().catch(() => null) as { invite_code?: string } | null; if (body?.invite_code !== "SP2-INVITE") return msw.HttpResponse.json({ msg: "invalid invite code" }, { status: 400 }); sessionStorage.setItem("__sp2_joined", "1"); localStorage.setItem("currentSpaceId", "sp2-invite-space"); return msw.HttpResponse.json({ space_id: space.space_id, status: "JOINED" }); }),
      );
      window.clearInterval(timer);
    }, 0);
  });
  await install();
}
