# S26 Summary Schedule List Manage

## Metadata

- Case 类型: feature flow
- 目标模式: harness route
- 登录状态: authed fixture
- 优先级: P2
- Tags: `@S26 @p2 @summary @schedule @summary-schedule`

## 目标

验证定时总结管理页可以展示定时配置列表，并支持暂停/启用和删除配置。该 case 直接进入 `/summary/schedules` 路由，守护 ScheduleListPage 的列表、toggle 和删除主链路。

## 前置条件

- fixture: `fixtures-authed`，本地 mock 模式已预置登录态、Space `e2e-space-001` 和中文 locale。
- Per-case MSW handler: `e2e-kit/msw-handlers/s26-summary-schedule-list-manage.ts`
  - `GET */summary/api/v1/summary-schedules` — 返回一条 active 定时配置 `S26 每周项目定时总结`；删除后返回空数组。
  - `PUT */summary/api/v1/summary-schedules/26026/toggle` — 根据 body `is_active` 更新启停状态。
  - `DELETE */summary/api/v1/summary-schedules/26026` — 标记删除成功。

## 用户操作步骤

1. 直接打开 `/summary/schedules`。
2. 在定时总结配置页查看 `S26 每周项目定时总结`。
3. 点击该卡片右侧 switch 暂停定时。
4. 再点击 switch 启用定时。
5. 点击删除按钮，并在确认浮层点击「确定」。

## 预期结果

- 页面标题显示「定时总结配置」。
- 列表显示 `S26 每周项目定时总结`、来源「S26 项目群」和时间「09:30」。
- 暂停后出现 toast「已暂停」。
- 再启用后出现 toast「已启用」。
- 删除后出现 toast「已删除」。
- 列表显示空态「暂无定时配置」。

## 反例

- 如果 listSchedules 漏 mock，页面会显示「加载失败」或 sanityCheck 报 401。
- 如果 toggle 成功后没有重新加载列表，switch 状态不会变化，case 应失败。
- 如果删除后没有刷新列表，`S26 每周项目定时总结` 仍会出现，case 应失败。

## 视觉基准

不建 pixel baseline；用页面标题、卡片文案、toast、空态断言结构。

## 摸清依据

- `packages/dmworksummary/src/module.tsx:149`: `/summary/schedules` 路由挂载 `ScheduleListPage`。
- `packages/dmworksummary/src/pages/ScheduleListPage.tsx:62`: `loadData()` 调用 `api.listSchedules()`。
- `packages/dmworksummary/src/pages/ScheduleListPage.tsx:125`: `handleDelete()` 调用 `deleteSchedule()` 并刷新列表。
- `packages/dmworksummary/src/pages/ScheduleListPage.tsx:135`: `handleToggle()` 调用 `toggleSchedule()` 并刷新列表。
- `packages/dmworksummary/src/api/summaryApi.ts:930`: `listSchedules()` 请求 `/summary-schedules`。
- `packages/dmworksummary/src/api/summaryApi.ts:939`: `deleteSchedule()` 请求 `DELETE /summary-schedules/:id`。
- `packages/dmworksummary/src/api/summaryApi.ts:943`: `toggleSchedule()` 请求 `PUT /summary-schedules/:id/toggle`。
- `packages/dmworksummary/src/i18n/zh-CN.json:314-327`: schedule 管理页标题、空态和启停/删除 toast 文案。
