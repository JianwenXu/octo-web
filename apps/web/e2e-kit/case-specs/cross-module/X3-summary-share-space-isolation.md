# X3 Summary 分享多 Space 隔离

## Metadata

- Case 类型: permission boundary
- 目标模式: standalone deep link
- 登录状态: authed fixture
- 优先级: P1
- Tags: `@X3 @p1 @cross-module @summary @deep-link @space-isolation`

## 目标

验证当前用户切换到其他 Space 后，不能通过分享链接读取原 Space 的分享内容。

## 前置条件

- 当前 Space 为 `e2e-space-002`。
- 分享快照属于 `e2e-space-001`。
- Per-case handler: `e2e-kit/msw-handlers/x3-summary-share-space-isolation.ts`，返回跨 Space 访问失败。

## 用户操作步骤

1. 在 `e2e-space-002` 直接打开 `/s/share/x3-share-026`。
2. 观察分享页状态。

## 预期结果

- 页面显示「该分享不存在、已失效或你无权查看」。
- 不显示原 Space 的分享标题和正文。

## 反例

- 页面显示其他 Space 的分享正文，说明 Space 隔离失效，case 应失败。

## 视觉基准

不建 pixel baseline；使用错误态和正文不可见断言。

## 摸清依据

- `packages/dmworksummary/src/api/summaryApi.ts:600-609`: 分享详情请求携带当前 Space。
- `packages/dmworksummary/src/pages/SummaryShareDetailPage.tsx:48-63`: 无权访问时显示错误态。
