/* eslint-disable no-undef -- e2e code runs in Node */
// @caseId example
// @spec e2e/case-specs/example-first-case.md
// (修改历史查: e2e/_lib/spec-history.sh example)
//
// kit-provided example spec. 起手复制改名:
//   cp e2e/tests/example.spec.ts e2e/tests/C7-my-feature.spec.ts
//   cp e2e/case-specs/TEMPLATE.md e2e/case-specs/C7-my-feature.md
//
// 稳定性 gate (kit 硬约束): 新 case 或改过的 case 必须 3x 全绿:
//   pnpm exec playwright test --grep "@C7" --repeat-each=3 --workers=1

import { test, expect } from "../fixtures-authed";
import { startRequestMonitor, sanityCheck, type SanityConfig } from "../_lib/sanity";

// TODO(接入方): 按项目改 sanity 配置
const sanityConfig: SanityConfig = {
  realHosts: ["<PROJECT_REAL_HOST>"],           // 例 ["api.example.com"], case 期间任何 request URL 命中 → 漏 mock
  apiPrefixRe: /^\/(api|v1)(\/|$)/,             // 例 /^\/(v1|api)\//, 匹配相对路径 API 请求
  loginPathRe: /\/login(\?|$)/,                 // 例 /\/login(\?|$)/, 项目登录页 URL
};

test("@example 起手案例 — 基本断言 + sanity", async ({ authedPage }) => {
  // Step 1: 起 sanity monitor (在任何 UI 操作前挂 request listener)
  const ctx = startRequestMonitor(authedPage, sanityConfig);

  // Step 2: 走用户操作 (用 authedPage, 已过 auth 门)
  await expect(authedPage.locator("body")).toBeVisible();
  // ... 你的实际操作: 打开 xx 页面 → 点 yy → 输入 zz → 断言...

  // Step 3: 断言 UI 观察 (v1.22 铁律: 只断 UI, 禁 API 双重校验)
  // 例:
  // await expect(authedPage.getByRole("heading", { name: "标题", level: 1 })).toBeVisible();
  // await expect(authedPage.getByText("已提交")).toBeVisible();

  // Step 4: sanityCheck (必调, 尾部). 任一项失败即 case 失败:
  //   1. URL 不在登录页
  //   2. 无跨域请求走真后端
  //   3. 无 API 401 响应
  await sanityCheck(authedPage, ctx);
});
