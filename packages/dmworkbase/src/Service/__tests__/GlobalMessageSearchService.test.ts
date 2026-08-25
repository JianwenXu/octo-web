import { beforeEach, describe, expect, it, vi } from "vitest";

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));

vi.mock("../APIClient", () => ({
  default: {
    shared: {
      post: postMock,
    },
  },
}));

import GlobalMessageSearchService from "../GlobalMessageSearchService";

describe("GlobalMessageSearchService", () => {
  beforeEach(() => {
    postMock.mockReset();
  });

  it("posts the aggregation request with its cancellation signal", async () => {
    const request = {
      keyword: "octo",
      sequence: 7,
      filters: { sender_ids: ["u1"] },
    };
    const controller = new AbortController();
    postMock.mockResolvedValue({ data: { sequence: 7, groups: [] } });

    await GlobalMessageSearchService.searchGroups(request, controller.signal);

    expect(postMock).toHaveBeenCalledWith(
      "messages/_search_global_groups",
      request,
      { signal: controller.signal }
    );
  });

  it("returns the wire response unchanged when no signal is supplied", async () => {
    const request = { keyword: "", sequence: 0, filters: {} };
    const response = { data: { sequence: 0, groups: [] }, pagination: { has_more: false } };
    postMock.mockResolvedValue(response);

    await expect(GlobalMessageSearchService.searchGroups(request)).resolves.toBe(response);
    expect(postMock).toHaveBeenCalledWith(
      "messages/_search_global_groups",
      request,
      { signal: undefined },
    );
  });

  it("forwards empty and complex filters without reshaping them", async () => {
    const filters = {
      channel_types: [1, 2],
      sender_ids: [],
      date_range: { from: "2026-01-01", to: "2026-01-31" },
    };
    const request = { keyword: "error", sequence: 3, filters };
    postMock.mockResolvedValue({ data: { groups: [] } });

    await GlobalMessageSearchService.searchGroups(request);

    expect(postMock.mock.calls[0][1]).toBe(request);
    expect(postMock.mock.calls[0][1].filters).toBe(filters);
  });

  it("propagates API and abort errors to the caller", async () => {
    const request = { keyword: "octo", sequence: 1, filters: {} };
    const error = new Error("request failed");
    postMock.mockRejectedValue(error);

    await expect(GlobalMessageSearchService.searchGroups(request)).rejects.toBe(error);
  });
});
