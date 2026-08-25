import type { Page } from "@playwright/test";

export async function registerV1ChatVoiceInput(page: Page): Promise<void> {
  const install = () => page.evaluate(() => {
    type Msw = { worker: { use: (...handlers: unknown[]) => void }; http: { get: (path: string, resolver: () => unknown) => unknown }; HttpResponse: { json: (body: unknown) => unknown } };
    const msw = (window as unknown as { __msw?: Msw }).__msw;
    if (!msw) return;
    msw.worker.use(msw.http.get("*/voice/config", () => msw.HttpResponse.json({ enabled: true, max_file_size: 5_000_000, max_duration: 60 })));
  });
  await page.addInitScript(() => {
    const timer = window.setInterval(() => {
      const msw = (window as unknown as { __msw?: { worker: { use: (...handlers: unknown[]) => void }; http: { get: (path: string, resolver: () => unknown) => unknown }; HttpResponse: { json: (body: unknown) => unknown } } }).__msw;
      if (!msw) return;
      msw.worker.use(msw.http.get("*/voice/config", () => msw.HttpResponse.json({ enabled: true, max_file_size: 5_000_000, max_duration: 60 })));
      window.clearInterval(timer);
    }, 0);
  });
  await install();
}
