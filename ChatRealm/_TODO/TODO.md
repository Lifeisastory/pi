# 项目计划

## 项目目标

- 为当前 `ChatRealm` TypeScript CLI 增加多协议模型调用能力，通过 [chatrealm.config.json](../chatrealm.config.json) 中的 `api` 字段选择 `openai-completions`、`openai-responses` 或 `anthropic-messages`。
- 引入一个轻量统一适配层，让 agent loop 继续只依赖现有 `ChatTransport` 内部协议，不在业务流程里分散协议判断。

## 范围概览

- 本计划只规划，不实现生产代码。
- 范围包含配置解析、统一 transport factory、现有 Chat Completions 适配器规范化、OpenAI Responses 适配器、Anthropic Messages 适配器、测试和文档。
- 参考根项目 `pi` 的多供应商实现方式：按 API 名称注册/分派 provider，但 ChatRealm 只保留足够支撑这三个协议的小型实现。

## 计划结构

- [chatrealm.config.json](../chatrealm.config.json): 增加 `api` 字段，取值为 `openai-completions`、`openai-responses` 或 `anthropic-messages`。
- [src/config/config.ts](../src/config/config.ts): 解析并校验 `api`，暴露类型化协议选择值。
- [src/ai/types.ts](../src/ai/types.ts): 保持当前内部 `ChatTransport`、消息、工具和 usage 合同，必要时增加 API 协议联合类型。
- `src/ai/transport-factory.ts`: 新增统一适配层，根据 `api` 创建具体 `ChatTransport`。
- `src/ai/openai-completions.ts`: 将现有 OpenAI-compatible Chat Completions 实现规范化为 `openai-completions`。
- `src/ai/openai-responses.ts`: 新增 OpenAI Responses 协议适配。
- `src/ai/anthropic-messages.ts`: 新增 Anthropic Messages 协议适配。
- [src/main.ts](../src/main.ts): 从硬编码 provider 创建改为通过统一适配层创建 transport。
- [test/](../test/): 增加配置、适配器选择、三个协议转换和流式行为测试。
- [README.md](../README.md) / [README.zh.md](../README.zh.md): 更新配置说明、协议示例和限制。

## 执行顺序

1. 先实现 `api` 配置解析和校验，确定协议选择入口。
2. 再引入统一 transport factory，把选择逻辑从 [src/main.ts](../src/main.ts) 移出。
3. 将现有 Chat Completions 适配器规范化为 `openai-completions`。
4. 分别实现 OpenAI Responses 和 Anthropic Messages 适配器。
5. 增加端到端的适配器选择测试，最后更新 README 并运行校验。

## TODO List

- [X] TODO-001: 增加 API 协议配置解析

  - 范围: 已在配置中解析并校验 `api`，更新默认配置示例，并覆盖配置/环境变量、非法值和缺失值测试。
  - 涉及: [chatrealm.config.json](../chatrealm.config.json)、[src/config/config.ts](../src/config/config.ts)、[test/config.test.ts](../test/config.test.ts)、[test/interactive-streaming.test.ts](../test/interactive-streaming.test.ts)。
  - 依赖: 无。
- [X] TODO-002: 引入统一 AI transport factory

  - 范围: 已新增统一 factory，通过配置中的 `api` 创建 transport；当前注册 `openai-completions`，后续两个协议会明确报未实现，等待后续 TODO 接入。
  - 涉及: [src/ai/types.ts](../src/ai/types.ts)、[src/ai/transport-factory.ts](../src/ai/transport-factory.ts)、[src/main.ts](../src/main.ts)、[test/transport-factory.test.ts](../test/transport-factory.test.ts)。
  - 依赖: TODO-001。
- [X] TODO-003: 将现有 Chat Completions 适配器规范化为 `openai-completions`

  - 范围: 已将现有 adapter 规范化为 `openai-completions`，并保留原有 Chat Completions 请求、响应、工具调用、流式和 usage 行为。
  - 涉及: [src/ai/openai-completions.ts](../src/ai/openai-completions.ts)、[src/ai/transport-factory.ts](../src/ai/transport-factory.ts)、[test/openai-completions.test.ts](../test/openai-completions.test.ts)。
  - 依赖: TODO-002。
- [X] TODO-004: 实现 OpenAI Responses 适配器

  - 范围: 已将 ChatRealm 消息和工具转换为 OpenAI Responses input/tools，并把 output text、function/tool calls、SSE events、stop reason 和 usage 转回内部类型。
  - 涉及: [src/ai/openai-responses.ts](../src/ai/openai-responses.ts)、[src/ai/transport-factory.ts](../src/ai/transport-factory.ts)、[test/openai-responses.test.ts](../test/openai-responses.test.ts)、[test/transport-factory.test.ts](../test/transport-factory.test.ts)。
  - 依赖: TODO-002。
- [X] TODO-005: 实现 Anthropic Messages 适配器

  - 范围: 已将 system prompt、user/assistant 消息、tool calls、tool results 转换为 Anthropic Messages 格式，并把 text blocks、`tool_use`、SSE events、stop reason 和 usage 转回内部类型。
  - 涉及: [src/ai/anthropic-messages.ts](../src/ai/anthropic-messages.ts)、[src/ai/transport-factory.ts](../src/ai/transport-factory.ts)、[test/anthropic-messages.test.ts](../test/anthropic-messages.test.ts)、[test/transport-factory.test.ts](../test/transport-factory.test.ts)。
  - 依赖: TODO-002。
- [X] TODO-006: 增加适配器选择集成覆盖

  - 范围: 已新增 [test/api-selection.test.ts](../test/api-selection.test.ts)，通过 mocked HTTP server 运行 `bin/chatrealm.mjs -p`，覆盖三种 `api` 从配置到具体 endpoint 的非流式选择；并在 [test/interactive-streaming.test.ts](../test/interactive-streaming.test.ts) 中补充 `openai-responses` 交互流式选择覆盖。
  - 涉及: [test/api-selection.test.ts](../test/api-selection.test.ts)、[test/interactive-streaming.test.ts](../test/interactive-streaming.test.ts)。
  - 依赖: TODO-003、TODO-004、TODO-005。
- [X] TODO-007: 跳过用户文档和限制说明

  - 范围: 按用户要求不再执行 README 更新；[README.md](../README.md) 和 [README.zh.md](../README.zh.md) 本轮保持不变，改为刷新 [_ARCHITECTURE/ARCHITECTURE.en.md](../_ARCHITECTURE/ARCHITECTURE.en.md) 与 [_ARCHITECTURE/ARCHITECTURE.md](../_ARCHITECTURE/ARCHITECTURE.md) 作为结构记录。
  - 涉及: 未修改 README；已更新架构文档。
  - 依赖: TODO-006。
- [X] TODO-008: 执行最终校验

  - 范围: 已在 [ChatRealm](..) 目录运行 `npm run check` 和 `npm run test:unit`；测试结果为 31 项通过、0 项失败。本轮只修改文档/TODO/架构记录，未修改源码，因此未运行根级 `npm run check`。
  - 涉及: 校验命令，不涉及生产代码。
  - 依赖: TODO-006 和已刷新的架构文档。

## 假设与风险

- `api` 现在必须通过 [chatrealm.config.json](../chatrealm.config.json) 或 `CHATREALM_API` 提供，合法值为 `openai-completions`、`openai-responses`、`anthropic-messages`；除非用户要求兼容，否则不把旧的 `openai-compatible` 当作合法 API 值保留。
- 现有 `--provider` flag 目前只支持一个 provider 名；本计划优先实现 config 中的 `api`，是否改名或移除 CLI flag 需要在实现时单独确认。
- 新协议适配器应保持当前 agent loop 行为：工具调用先收完整 assistant message，再执行工具，不做流式中途工具执行。
- [chatrealm.config.json](../chatrealm.config.json) 当前含有非空 API key；实施时不要复制或输出具体值，是否替换为占位符应单独确认。
- 根项目 `pi` 的 `packages/ai` 实现比 ChatRealm 需要的更完整；这里只借鉴按 API 分派和协议转换边界，避免引入过重抽象。
- 协议测试应使用 mock，不需要真实供应商 key 或付费请求。
- TODO-007 README 工作已按用户要求跳过；本轮以架构文档作为最新结构记录。

## 当前进展

- 已完成 TODO-001：配置加载现在暴露类型化 `api`，默认配置包含 `"api": "openai-completions"`，并新增配置单测。
- 已完成 TODO-002：入口现在通过统一 factory 创建 transport，选择逻辑由 `api` 驱动。
- 已完成 TODO-003：现有 Chat Completions adapter 已改为 `openai-completions` 模块和测试命名。
- 已完成 TODO-004：已新增 `openai-responses` adapter 并注册到统一 factory。
- 已完成 TODO-005：已新增 `anthropic-messages` adapter 并注册到统一 factory。
- 已完成 TODO-006：已补充配置驱动的 adapter 选择集成测试，覆盖非流式 prompt 和交互流式路径。
- 已跳过 TODO-007：按用户要求不更新 README，改为刷新架构文档。
- 已完成 TODO-008：`npm run check` 与 `npm run test:unit` 均通过。
- 下一项：无；当前请求范围内的协议扩展校验已完成。
