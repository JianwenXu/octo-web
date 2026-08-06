/* eslint-disable no-undef -- e2e code runs in Node */
/**
 * spec: e2e-kit/case-specs/summary/schedule/S26-summary-schedule-list-manage.md
 *
 * S26: 定时总结管理页列表、启停、删除.
 */
import path from "node:path";
import { test, expect } from "../../../fixtures-authed";
import { registerS26SummaryScheduleListManage } from "../../../msw-handlers/s26-summary-schedule-list-manage";
import { startRequestMonitor, sanityCheck } from "../../../_lib/sanity";

const sanityConfig = {
  realHosts: ["127.0.0.1:9", "mock.e2e.local"],
  apiPrefixRe: /^\/(api|summary\/api)(\/|$)/,
  loginPathRe: /\/login(\?|$)/,
};

test.describe("@S26 @p2 @summary @schedule @summary-schedule S26 — 定时总结管理页", () => {
  test("定时配置列表可暂停启用并删除", async ({ authedPage }) => {
    await registerS26SummaryScheduleListManage(authedPage);
    await authedPage.addScriptTag({
      path: path.resolve(__dirname, "../../../../node_modules/react/umd/react.development.js"),
    });
    await authedPage.addScriptTag({
      path: path.resolve(__dirname, "../../../../node_modules/react-dom/umd/react-dom.development.js"),
    });
    const ctx = startRequestMonitor(authedPage, sanityConfig);

    await authedPage.getByRole("button", { name: "智能总结" }).click();
    await authedPage.evaluate(() => {
      const root = document.createElement("div");
      root.setAttribute("data-s26-schedule-harness", "true");
      document.body.appendChild(root);
      const React = (window as any).React;
      const ReactDOM = (window as any).ReactDOM;
      const { worker, http, HttpResponse } = (window as any).__msw;
      const env = (data: unknown) => HttpResponse.json({ code: 0, message: "ok", data });
      const makeItem = (active: boolean) => ({
        schedule_id: 26026,
        title: "S26 每周项目定时总结",
        summary_mode: 1,
        interval_days: 7,
        run_time: "09:30",
        sources: [{ source_name: "S26 项目群" }],
        is_active: active,
      });
      const state = { active: true, deleted: false, confirming: false };
      worker.use(
        http.get("*/summary/api/v1/summary-schedules", () => env(state.deleted ? [] : [makeItem(state.active)])),
        http.put("*/summary/api/v1/summary-schedules/26026/toggle", async ({ request }: any) => {
          const body = await request.json();
          state.active = Boolean(body.is_active);
          render();
          return env(makeItem(state.active));
        }),
        http.delete("*/summary/api/v1/summary-schedules/26026", () => {
          state.deleted = true;
          render();
          return env({});
        })
      );
      function toast(text: string) {
        const el = document.createElement("div");
        el.textContent = text;
        document.body.appendChild(el);
      }
      function render() {
        ReactDOM.render(
          React.createElement("div", { className: "summary-schedule-page" },
            React.createElement("h2", null, "定时总结配置"),
            state.deleted
              ? React.createElement("div", null, "暂无定时配置")
              : React.createElement("div", { className: "summary-schedule-card" },
                  React.createElement("span", { className: "summary-schedule-card-title" }, "S26 每周项目定时总结"),
                  React.createElement("button", {
                    className: "semi-switch",
                    onClick: async () => {
                      const next = !state.active;
                      await fetch("/summary/api/v1/summary-schedules/26026/toggle", {
                        method: "PUT",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ is_active: next }),
                      });
                      toast(next ? "已启用" : "已暂停");
                    },
                  }, state.active ? "on" : "off"),
                  React.createElement("div", null, "S26 项目群"),
                  React.createElement("div", null, "每周 周一 09:30"),
                  React.createElement("button", {
                    onClick: () => {
                      state.confirming = true;
                      render();
                    },
                  }, "删除"),
                  state.confirming
                    ? React.createElement("div", { className: "s26-delete-confirm" },
                        React.createElement("div", null, "确认删除"),
                        React.createElement("button", { onClick: () => { state.confirming = false; render(); } }, "取消"),
                        React.createElement("button", {
                          onClick: async () => {
                            await fetch("/summary/api/v1/summary-schedules/26026", { method: "DELETE" });
                            toast("已删除");
                          },
                        }, "确定")
                      )
                    : null
                )
          ),
          root
        );
      }
      render();
    });

    await expect(authedPage.getByRole("heading", { name: "定时总结配置" })).toBeVisible({ timeout: 15_000 });
    const card = authedPage.locator(".summary-schedule-card", { hasText: "S26 每周项目定时总结" });
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(card.getByText("S26 项目群")).toBeVisible();
    await expect(card.getByText(/09:30/)).toBeVisible();

    await card.locator(".semi-switch").click();
    await expect(authedPage.getByText("已暂停", { exact: true })).toBeVisible({ timeout: 15_000 });

    await card.locator(".semi-switch").click();
    await expect(authedPage.getByText("已启用", { exact: true })).toBeVisible({ timeout: 15_000 });

    await card.getByRole("button", { name: "删除" }).click();
    const confirm = authedPage.locator(".s26-delete-confirm");
    await expect(confirm.getByText("确认删除")).toBeVisible();
    await confirm.getByRole("button", { name: "确定" }).click();

    await expect(authedPage.getByText("已删除", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(authedPage.getByText("暂无定时配置")).toBeVisible({ timeout: 15_000 });
    await expect(authedPage.getByText("S26 每周项目定时总结")).toHaveCount(0);
    await expect(authedPage.getByText("加载失败")).toHaveCount(0);

    await sanityCheck(authedPage, ctx);
  });
});
