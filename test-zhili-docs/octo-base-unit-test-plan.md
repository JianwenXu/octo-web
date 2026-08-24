# `@octo/base` 单元测试补充计划

## 1. 目标

持续补充 `@octo/base` 的高价值单元测试，优先覆盖业务逻辑、状态转换、数据映射、错误处理和安全边界；通过分模块 PR 逐步提高覆盖率，避免为了覆盖率数字堆积低价值 UI 测试。

## 2. 当前基线

| 项目 | 当前值 |
| --- | ---: |
| 测试文件 | 384 |
| 测试用例 | 3424 |
| Statements | 51.07% |
| Branches | 44.18% |
| Functions | 47.66% |
| Lines | 51.81% |

当前 CI 门槛：

```text
Statements >= 49%
Branches   >= 42%
Functions  >= 46%
Lines      >= 50%
```

覆盖率使用 Vitest V8，并显式统计 `src/**/*.{ts,tsx}`，排除测试文件和 Story 文件。

## 3. 已完成

- PR #1531：建立 `@octo/base` 覆盖率门槛并接入现有 Unit tests job
- PR #1537：补充 Utils 与 GlobalSearch 第一批用例
  - `rateLimit`
  - `filehelper`
  - `download`
  - GlobalSearch `sanitize`
  - GlobalSearch DataSource 文件类型缓存和 sender candidates

## 4. 后续补测顺序

### 阶段一：Utils 收尾

优先补充仍有明显逻辑分支的工具模块：

- `src/Utils/clipboard.ts`
- `src/Utils/filehelper.ts` 剩余 icon 和边界分支
- `src/Utils/download.ts` Electron IPC 成功、失败、取消和超时路径
- `src/Utils/time.ts` 老时间格式化和相对时间边界
- `src/Utils/t2s.ts`

重点场景：空值、非法输入、边界值、异步失败、浏览器 API 不存在和资源清理。

### 阶段二：GlobalSearch 核心逻辑

不直接从完整页面渲染开始，按以下顺序补：

1. `src/bridge/globalSearch/GlobalSearchVM.ts`
   - 初始搜索和关键字变更
   - debounce 输入
   - 过期请求响应丢弃
   - load more 合并
   - 搜索失败和状态复位
   - self 注入、备注覆盖和消息内容解析
2. GlobalSearch DataSource
   - channel candidates 去重、过滤和关键词匹配
   - sender candidates 的远端/本地 fallback
   - 文件类型缓存命中、并发请求和失败重试
3. `sanitize`、filter、tab 状态的边界分支
4. 最后补必要的 panel 交互，不做大面积快照测试

### 阶段三：Service / bridge 核心业务

优先覆盖对数据一致性和权限有影响的模块：

- `Service/DataSource`
- `Service/SpacePrefix`
- `Service/UploadCredentials`
- `Service/VoiceService`
- `Service/GlobalMessageSearchService`
- `bridge/thread`
- `bridge/message`

每个模块至少覆盖成功、空数据、服务端错误、权限失败和状态回滚路径。

### 阶段四：GroupManagement / Conversation

优先测试 VM、actions 和状态转换，不直接挂载完整页面：

- 成员增删改
- 权限判断
- 解散/归档
- 失败回滚
- 竞态和重复提交
- Conversation 列表排序、未读和历史加载

### 阶段五：消息渲染和文件预览

重点关注容错与安全：

- 未知消息类型
- malformed payload
- HTML 清洗和 XSS 边界
- 超大文件和不支持格式
- renderer fallback
- 图片、视频、PDF、Office 等预览错误路径

## 5. 覆盖率门槛提升节奏

门槛不在每个 PR 中调整，建议每完成 2～3 个模块后再提高一次：

| 阶段 | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| 当前门槛 | 49 | 42 | 46 | 50 |
| 第一轮模块补测后 | 52 | 45 | 49 | 53 |
| 核心逻辑补齐后 | 58 | 50 | 55 | 60 |
| 中期目标 | 70 | 60 | 70 | 72 |
| 长期目标 | 80 | 70 | 80 | 80 |

提高门槛前必须重新跑全量覆盖率，目标值以实际结果向下取整，并保留约 1～2 个百分点的余量。

## 6. 单个 PR 的工作约束

每个 PR 尽量只覆盖一个模块或一个紧密相关的小模块组：

- 先补聚焦测试，再跑 `pnpm --filter @octo/base test:coverage`
- 全量测试必须通过
- 不降低已有全包门槛
- 不使用无断言测试、纯快照或只为执行代码而写的测试
- 复杂依赖优先 mock 边界，核心逻辑使用真实实现
- 测试名称描述行为，不描述实现细节
- 合并前检查 `git diff --check`、工作区状态和 coverage 产物

## 7. 每批完成标准

一批 case 只有同时满足以下条件才算完成：

1. 目标模块的关键成功、失败和边界路径有明确断言。
2. 聚焦测试通过。
3. `@octo/base` 全量测试通过。
4. 覆盖率门禁通过，且覆盖率没有因新增源码而非预期下降。
5. PR 描述记录测试范围、用例数和覆盖率变化。

## 8. 下一批执行项

下一批从 `GlobalSearchVM.ts` 开始，先覆盖搜索请求生命周期和竞态保护，再补 DataSource 的 channel candidates；完成后重新评估是否可以把全包门槛提升到 `52 / 45 / 49 / 53`。
