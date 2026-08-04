# SV1 Summary List Visual Baseline

## Metadata

- Case 类型: visual baseline
- 目标模式: real-page seed
- 登录状态: authed fixture
- 优先级: P1
- Tags: `@SV1 @p1 @summary @summary-list @visual`

## 目标

为 Summary 列表「已完成总结卡片」建立 UI baseline，守护列表标题、搜索/筛选工具栏、卡片布局、状态和来源信息的整体视觉结构。该 case 只做视觉基线，不覆盖详情跳转等业务行为。

## 前置条件

- fixture: `fixtures-authed`，本地 mock 模式已预置登录态、Space 和中文 locale。
- Per-case MSW handler: `sv1-summary-list-baseline.ts`
  - `GET */summary/api/v1/summaries` — 返回 `{code,message,data:{items,total}}`，包含一条已完成总结 `SV1 视觉基线总结`。
- 不需要 mock-im-runtime seed；本 case 只验证 Summary 列表 UI。

## 用户操作步骤

1. 从默认 app shell 点击主导航「智能总结」。
2. 等待 Summary 列表稳定显示「SV1 视觉基线总结」。
3. 对 Summary 列表区域做 Playwright screenshot baseline 对比。

## 预期结果

- 列表页显示标题「智能总结」。
- 列表页显示搜索框「搜索总结...」和状态筛选「全部状态」。
- 列表页显示卡片「SV1 视觉基线总结」。
- 卡片显示状态「已完成」和来源「SV1 视觉群」。
- `summary-list-completed.png` 与已提交 baseline 一致。

## 反例

- 列表不应显示空态「暂无总结记录」。
- 视觉 diff 不应超过 Playwright 配置中的 `maxDiffPixelRatio` / `threshold`。

## 视觉基准

建立 pixel baseline：`apps/web/e2e-kit/screenshots/chromium/summary/visual/SV1-summary-list-visual-baseline.spec.ts/summary-list-completed.png`。

## 摸清依据

- `apps/web/e2e-kit/playwright.config.ts:49`: screenshot baseline path 模板为 `{testDir}/../screenshots/{projectName}/{testFilePath}/{arg}{ext}`。
- `apps/web/e2e-kit/playwright.config.ts:51`: `toHaveScreenshot` 阈值配置。
- `packages/dmworksummary/src/module.tsx:119`: `/summary` 路由真实挂载 `SummaryListPage`。
- `packages/dmworksummary/src/pages/SummaryListPage.tsx:467`: 列表工具栏包含搜索框和状态筛选。
- `packages/dmworksummary/src/pages/SummaryListPage.tsx:547`: `items.length > 0` 时渲染 SummaryCard 列表。
- `packages/dmworksummary/src/components/SummaryCard.tsx:139`: 非生成中卡片显示来源和状态。
- `packages/dmworksummary/src/i18n/zh-CN.json:149`: 菜单和列表标题实际文案「智能总结」。
- `packages/dmworksummary/src/i18n/zh-CN.json:157`: 搜索框实际文案「搜索总结...」。
