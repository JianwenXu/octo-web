# CH35 — 关注 Tab 会话展示

## Metadata

- Case 类型: feature flow
- 目标模式: real-page seed
- 登录状态: authed fixture
- 优先级: P1
- Tags: `@CH35 @p1 @chat @sidebar @follow`

## 目标

验证关注 Tab 展示后端返回的真实关注会话，并与最近 Tab 隔离。

## 前置条件

- `fixtures-authed` 已登录。
- `/sidebar/sync` 返回一个关注群，categories 返回该群所属分组。

## 用户操作步骤

1. 打开会话页。
2. 点击「关注」Tab。

## 预期结果

- 页面显示关注群名称。

## 反例

- 关注 Tab 不应错误显示整理空态或最近 Tab 中未关注的会话。

## 视觉基准

不建 pixel baseline；用 `getByText` 断言结构。

## 摸清依据

- `packages/dmworkbase/src/Hooks/useFollowSidebar.ts`
- `packages/dmworkbase/src/Components/ChatConversationList/index.tsx`
- `packages/dmworkbase/src/Pages/Chat/index.tsx`
