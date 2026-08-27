import type { Page } from "@playwright/test";

export async function registerC39McpProbeFailure(page: Page): Promise<void> {
  function install() {
    type Msw = {
      worker: { use: (...handlers: unknown[]) => void };
      http: { post: (path: string, resolver: () => unknown) => unknown };
      HttpResponse: { json: (body: unknown, init?: unknown) => unknown };
    };
    const win = globalThis as unknown as {
      __msw?: Msw;
      __c39Installed?: boolean;
      __c39Timer?: number;
    };
    if (!win.__msw) {
      if (!win.__c39Timer) {
        win.__c39Timer = window.setInterval(() => {
          if (install()) window.clearInterval(win.__c39Timer);
        }, 10);
      }
      return false;
    }
    if (win.__c39Installed) return true;
    const probeFailure = () =>
      win.__msw!.HttpResponse.json({
        data: {
          is_ok: false,
          tools: [],
          error: {
            code: "init_failed",
            message: "remote server rejected initialization",
          },
        },
      });
    win.__msw.worker.use(
      win.__msw.http.post("*/market/api/v1/mcps/_probe", probeFailure),
      win.__msw.http.post("*/market/api/v1/mcps/probe", probeFailure),
      win.__msw.http.post("*/api/v1/mcps/_probe", probeFailure),
      win.__msw.http.post("*/api/v1/mcps/probe", probeFailure),
    );
    win.__c39Installed = true;
    return true;
  }

  await page.addInitScript(install);
  await page.evaluate(install);
}
