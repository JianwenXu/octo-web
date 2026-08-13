import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../Service/APIClient", () => ({
  default: { shared: { get: vi.fn(), put: vi.fn(), delete: vi.fn() } },
}));

import APIClient from "../../../Service/APIClient";
import { QuickMuteApiService } from "../QuickMuteStore";

const api = APIClient.shared as unknown as {
  get: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

beforeEach(() => vi.clearAllMocks());

describe("QuickMuteApiService", () => {
  it("normalizes the server state and marks expired pauses inactive", async () => {
    api.get.mockResolvedValueOnce({
      paused: true,
      paused_until: new Date(Date.now() - 1_000).toISOString(),
      revision: 7,
      server_time: "2026-08-13T00:00:00Z",
    });

    await expect(new QuickMuteApiService().getState()).resolves.toMatchObject({
      active: false,
      revision: 7,
      scope: "sound-and-popup",
      serverTime: "2026-08-13T00:00:00Z",
    });
    expect(api.get).toHaveBeenCalledWith("/user/notification-pause");
  });

  it("sets a 30 minute pause through the account endpoint", async () => {
    api.put.mockResolvedValueOnce({
      paused: true,
      paused_until: new Date(Date.now() + 30 * 60_000).toISOString(),
      revision: 8,
    });

    await expect(new QuickMuteApiService().setMute({ duration: "30m" })).resolves.toMatchObject({
      active: true,
      revision: 8,
    });
    const [path, body] = api.put.mock.calls[0];
    expect(path).toBe("/user/notification-pause");
    expect(body.paused_until).toMatch(/Z$/);
  });

  it("rejects a custom pause that is not in the future", async () => {
    await expect(new QuickMuteApiService().setMute({ duration: "custom", endAt: Date.now() - 1 })).rejects.toThrow(
      "A future notification pause time is required",
    );
    expect(api.put).not.toHaveBeenCalled();
  });

  it("resumes through DELETE and normalizes the response", async () => {
    api.delete.mockResolvedValueOnce({ paused: false, revision: 9 });

    await expect(new QuickMuteApiService().resume()).resolves.toMatchObject({
      active: false,
      revision: 9,
    });
    expect(api.delete).toHaveBeenCalledWith("/user/notification-pause");
  });
});
