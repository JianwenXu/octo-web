# S27 Summary Share Detail

## Metadata

- Case 类型: feature flow
- 目标模式: harness route
- 登录状态: authed fixture
- 优先级: P2
- Tags: `@S27 @p2 @summary @share @summary-share`

## 目标

验证用户打开 Summary 分享详情链接时，可以看到分享快照标题、元信息和正文；分享不可用时显示不可用提示和重试入口。

## 前置条件

- fixture: `fixtures-authed`，本地 mock 模式已预置登录态、Space `e2e-space-001` 和中文 locale。
- Per-case MSW handler: `e2e-kit/msw-handlers/s27-summary-share-detail.ts`
  - `GET */summary/api/v1/summary-shares/s27-share-ok` — 返回分享快照 `S27 分享总结`。
  - `GET */summary/api/v1/summary-shares/s27-share-missing` — 返回 404，触发不可用态。

## 用户操作步骤

1. 打开 `/s/share/s27-share-ok`。
2. 查看分享详情内容。
3. 打开 `/s/share/s27-share-missing`。
4. 查看不可用态。

## 预期结果

- 可用分享页显示标题 `S27 分享总结`。
- 可用分享页显示正文 `S27 分享详情正文`。
- 可用分享页显示来源 `S27 分享来源群`。
- 不可用分享页显示「该分享不可用或已过期」。
- 不可用分享页显示「重试」。

## 反例

- 如果分享接口漏 mock，可用页会进入不可用态，case 应失败。
- 如果错误态没有渲染重试入口，用户无法恢复，case 应失败。
- 全程不应出现登录页。

## 视觉基准

不建 pixel baseline；用标题、正文、来源和不可用态文案断言结构。

## 摸清依据

- `apps/web/src/Layout/index.tsx:515`: standalone `/s/share/:shareId` deep-link 渲染 `SummaryShareDetailPage`。
- `packages/dmworksummary/src/pages/SummaryShareDetailPage.tsx:48`: 分享详情通过 `getSummaryShare()` 加载快照。
- `packages/dmworksummary/src/pages/SummaryShareDetailPage.tsx:57`: 加载失败时渲染不可用态和重试按钮。
- `packages/dmworksummary/src/ui/SummaryShareContent/index.tsx:43`: 分享正文由 `SummaryShareContent` 渲染。
- `packages/dmworksummary/src/api/summaryApi.ts:548`: `getSummaryShare()` 请求 `/summary-shares/:shareId`。
