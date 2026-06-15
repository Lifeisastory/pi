# ChatRealm 架构索引

## 项目类型
- 推断：ChatRealm 是一个私有 TypeScript/Node.js CLI coding-agent MVP，现在支持通过配置选择模型 API 协议。
- 证据：[package.json](../package.json) 声明 `type: module`、`bin.chatrealm`、`tsx`、`typescript`；[src/main.ts](../src/main.ts) 是 CLI 组合根；[src/ai/transport-factory.ts](../src/ai/transport-factory.ts) 根据类型化 `api` 配置选择具体 transport。
- 置信度：high。

## 架构树
- [bin/chatrealm.mjs](../bin/chatrealm.mjs)：命令行可执行入口，使用 `tsx` loader 启动 TypeScript 源码。关系：`depends_on` [src/main.ts](../src/main.ts)；证据：spawn 参数；置信度 high。
- [src/main.ts](../src/main.ts)：CLI 组合根，解析参数、加载配置、加载历史会话、创建工具注册表，通过 [src/ai/transport-factory.ts](../src/ai/transport-factory.ts) 选择 AI transport，并分派到交互模式或单次 prompt 模式。关系：`depends_on` cli/config/session/agent/ai/tools；证据：直接 import；置信度 high。
- [src/cli/](../src/cli/)：命令行参数和交互模式边界。关系：`depended_on_by` [src/main.ts](../src/main.ts)；证据：[src/cli/args.ts](../src/cli/args.ts)、[src/cli/interactive.ts](../src/cli/interactive.ts)；置信度 high。
- [src/config/](../src/config/)：环境变量和 JSON 配置文件加载边界，包含必填 `api` 协议选择。关系：`impacts` api、provider、model、cwd；证据：[src/config/config.ts](../src/config/config.ts)；置信度 high。
- [src/ai/](../src/ai/)：内部 provider-neutral chat 协议、transport factory 和三类具体协议适配器。关系：`depends_on` `fetch` 与内部 `ChatTransport`；证据：[src/ai/types.ts](../src/ai/types.ts)、[src/ai/transport-factory.ts](../src/ai/transport-factory.ts)、[src/ai/openai-completions.ts](../src/ai/openai-completions.ts)、[src/ai/openai-responses.ts](../src/ai/openai-responses.ts)、[src/ai/anthropic-messages.ts](../src/ai/anthropic-messages.ts)；置信度 high。
- [src/agent/](../src/agent/)：agent 状态、系统提示、循环执行和 prompt 包装层。关系：`depends_on` transport、tool registry、session store；证据：[src/agent/agent-loop.ts](../src/agent/agent-loop.ts)、[src/agent/run-prompt.ts](../src/agent/run-prompt.ts)；置信度 high。
- [src/tools/](../src/tools/)：本地工具定义和注册表，提供 `read_file`、`search`、`write_file`、`shell_command`。关系：`depended_on_by` agent loop；证据：[src/tools/registry.ts](../src/tools/registry.ts)；置信度 high。
- [src/session/](../src/session/)：会话 JSON 持久化层，读写 `<cwd>/.chatrealm/sessions/default.json`。关系：`impacts` 跨运行上下文；证据：[src/session/store.ts](../src/session/store.ts)；置信度 high。
- [src/utils/](../src/utils/)：JSON 解析和 CLI 错误格式化工具。关系：`depended_on_by` config、adapter、session、main；证据：[src/utils/json.ts](../src/utils/json.ts)、[src/utils/errors.ts](../src/utils/errors.ts)；置信度 high。
- [test/](../test/)：Node 内置 test runner 测试，覆盖 CLI args、config、agent loop、transport factory、三类协议 adapter、session store、tool registry 和交互流式行为。关系：`impacts` 变更验证；证据：测试文件扫描；置信度 high。
- [.chatrealm/](../.chatrealm/)：本地运行时会话状态，不是源码架构层。关系：`influenced_by` session store；证据：目录扫描；置信度 high。
- [node_modules/](../node_modules/)：依赖安装目录，应在架构分析中忽略。关系：`influenced_by` npm install；证据：目录扫描；置信度 high。

## 核心入口
- [bin/chatrealm.mjs](../bin/chatrealm.mjs)：npm bin 入口；负责在普通 Node 进程中通过 `--import tsx` 运行 [src/main.ts](../src/main.ts)。关系：`depends_on` runtime loader；置信度 high。
- [src/main.ts](../src/main.ts)：主流程入口；处理 `--help`、配置、session、interactive/print 两种模式和 transport 创建。关系：`impacts` 全部运行模式；置信度 high。
- [src/cli/interactive.ts](../src/cli/interactive.ts)：无 prompt 时进入交互模式；循环读取 stdin，处理 `/help`、`/exit`、`/quit`，并在 provider 支持时流式输出文本 delta。关系：`depends_on` [src/agent/run-prompt.ts](../src/agent/run-prompt.ts)；置信度 high。
- [src/agent/run-prompt.ts](../src/agent/run-prompt.ts)：单次 prompt 的应用服务；构造 agent state、追加用户消息、运行 loop、保存 session、渲染文本。关系：`depends_on` [src/agent/agent-loop.ts](../src/agent/agent-loop.ts) 与 [src/session/store.ts](../src/session/store.ts)；置信度 high。
- [src/agent/agent-loop.ts](../src/agent/agent-loop.ts)：核心 agent loop；只依赖内部 `ChatTransport` 合同，每轮请求模型、追加 assistant 消息、执行 tool calls，直到最终文本或 max turns。关系：`depends_on` transport 和 tools；置信度 high。

## 模块边界
- CLI 层：[src/cli/args.ts](../src/cli/args.ts) 只解析命令行；[src/cli/interactive.ts](../src/cli/interactive.ts) 只负责交互循环和 slash commands。
- 组合根：[src/main.ts](../src/main.ts) 负责把配置、transport、tools、session 和 agent 组合起来；`--provider` 仍只接受 `openai-compatible`，真实协议选择由配置中的 `api` 控制。
- 配置层：[src/config/config.ts](../src/config/config.ts) 读取 `CHATREALM_CONFIG`、`CHATREALM_API`、`CHATREALM_API_KEY`、`CHATREALM_BASE_URL`、`CHATREALM_MODEL`、`CHATREALM_CWD`，并回退到 [chatrealm.config.json](../chatrealm.config.json)。
- AI 协议层：[src/ai/types.ts](../src/ai/types.ts) 定义 `SUPPORTED_CHAT_APIS`、`ChatApi`、`ChatTransport`、消息、工具、usage 和 stream event 合同；agent loop 不直接关心具体供应商协议。
- Transport factory：[src/ai/transport-factory.ts](../src/ai/transport-factory.ts) 把 `openai-completions`、`openai-responses`、`anthropic-messages` 映射到具体 adapter。
- OpenAI Completions adapter：[src/ai/openai-completions.ts](../src/ai/openai-completions.ts) 把内部请求转成 `/chat/completions` 请求，并把普通响应和 SSE stream 转回内部 `AssistantMessage` 和 stream event。
- OpenAI Responses adapter：[src/ai/openai-responses.ts](../src/ai/openai-responses.ts) 把内部请求转成 `/responses` 请求，设置 `store: false`，并转换 output text、function call、SSE event、stop reason 和 usage。
- Anthropic Messages adapter：[src/ai/anthropic-messages.ts](../src/ai/anthropic-messages.ts) 把内部请求转成 `/messages` 请求，发送 `anthropic-version: 2023-06-01`，并转换 text block、`tool_use`、tool result、SSE event、stop reason 和 usage。
- Agent 层：[src/agent/](../src/agent/) 维护系统提示、状态、turn 计数、tool result 消息和最终结果。
- Tool 层：[src/tools/](../src/tools/) 定义工具协议、cwd 内路径约束、文件读写、文本搜索和 shell 命令执行。
- Session 层：[src/session/store.ts](../src/session/store.ts) 负责严格解析和保存版本化 session JSON。
- 测试层：[test/](../test/) 使用 `node:test` 和 `tsx` 跑聚焦单元/集成测试。

## 关键配置
- [package.json](../package.json)：npm scripts、bin、ESM、`tsx` 运行依赖和 TypeScript 版本。关系：`impacts` 启动和测试命令；证据：manifest；置信度 high。
- [tsconfig.json](../tsconfig.json)：严格 TypeScript 检查，`noEmit: true`，Bundler module resolution。关系：`impacts` `npm run check`；证据：配置内容；置信度 high。
- [chatrealm.config.json](../chatrealm.config.json)：默认 JSON 配置，当前包含 `api`、base URL、model、cwd 和非空 apiKey。关系：`influenced_by` [src/config/config.ts](../src/config/config.ts)；证据：文件内容；置信度 high。
- [README.md](../README.md) 和 [README.zh.md](../README.zh.md)：用户操作、配置优先级、工具列表、session 行为和限制说明；本轮按用户要求跳过 README 更新，因此协议结构以本架构索引和源码为准。关系：`impacts` 使用方式；证据：文档内容；置信度 medium。
- [.chatrealm/sessions/default.json](../.chatrealm/sessions/default.json)：默认 cwd 下的会话历史运行时文件。关系：`depended_on_by` session load；证据：[src/session/store.ts](../src/session/store.ts)；置信度 high。

## 高耦合枢纽
- [src/main.ts](../src/main.ts)：组合 CLI、配置、transport、session、工具和 agent；修改会影响所有运行路径。关系：`impacts` startup/interactive/print flows；证据：直接 import；置信度 high。
- [src/ai/transport-factory.ts](../src/ai/transport-factory.ts)：所有协议选择的集中入口；新增或移除协议都应从这里注册。关系：`depends_on` 三个 adapter；证据：`TRANSPORT_CREATORS`；置信度 high。
- [src/ai/types.ts](../src/ai/types.ts)：内部协议合同中心；修改会影响 config、adapter、agent loop 和 session 相关类型。关系：`depended_on_by` config/ai/agent；证据：类型 import；置信度 high。
- [src/agent/agent-loop.ts](../src/agent/agent-loop.ts)：模型请求和工具执行循环中心；修改会影响所有 agent 行为。关系：`depends_on` [src/ai/types.ts](../src/ai/types.ts) 与 [src/tools/registry.ts](../src/tools/registry.ts)；证据：源码调用；置信度 high。
- [src/ai/openai-completions.ts](../src/ai/openai-completions.ts)、[src/ai/openai-responses.ts](../src/ai/openai-responses.ts)、[src/ai/anthropic-messages.ts](../src/ai/anthropic-messages.ts)：协议转换边界；修改会影响请求格式、streaming、tool call 解析、usage 解析。关系：`impacts` provider flow；证据：adapter 测试；置信度 high。
- [src/tools/registry.ts](../src/tools/registry.ts)：默认工具集合注册中心；修改会影响模型可见工具。关系：`depends_on` 四个工具模块；证据：`createDefaultToolRegistry`；置信度 high。
- [src/session/store.ts](../src/session/store.ts)：会话格式和路径中心；修改会影响历史加载、保存和兼容性。关系：`impacts` session flow；证据：严格 parse/save；置信度 high。
- [src/tools/path.ts](../src/tools/path.ts)：文件工具 cwd 边界控制；修改会影响读写/search 路径安全。关系：`depended_on_by` read/write/search tools；证据：直接 import；置信度 high。

## 主要流程骨架
- CLI 启动：[bin/chatrealm.mjs](../bin/chatrealm.mjs) -> `tsx` loader -> [src/main.ts](../src/main.ts)。
- 协议选择：[src/config/config.ts](../src/config/config.ts) -> [src/ai/types.ts](../src/ai/types.ts) 中的 `ChatApi` -> [src/main.ts](../src/main.ts) runtime -> [src/ai/transport-factory.ts](../src/ai/transport-factory.ts) -> 具体 adapter。
- 单次 prompt：[src/main.ts](../src/main.ts) -> [src/cli/args.ts](../src/cli/args.ts) -> [src/config/config.ts](../src/config/config.ts) -> [src/session/store.ts](../src/session/store.ts) -> [src/ai/transport-factory.ts](../src/ai/transport-factory.ts) -> [src/agent/run-prompt.ts](../src/agent/run-prompt.ts) -> [src/agent/agent-loop.ts](../src/agent/agent-loop.ts) -> selected `ChatTransport` -> session save -> stdout。
- 交互模式：[src/main.ts](../src/main.ts) -> [src/cli/interactive.ts](../src/cli/interactive.ts) -> readline loop -> [src/agent/run-prompt.ts](../src/agent/run-prompt.ts) -> streaming text delta 或最终文本。
- 工具调用：provider response tool call -> [src/agent/agent-loop.ts](../src/agent/agent-loop.ts) -> [src/tools/registry.ts](../src/tools/registry.ts) -> concrete tool -> tool result message -> 下一轮 provider request。
- OpenAI Completions：[src/ai/openai-completions.ts](../src/ai/openai-completions.ts) -> POST `/chat/completions` -> 解析 JSON 或 SSE -> 内部 `AssistantMessage` 和 stream event。
- OpenAI Responses：[src/ai/openai-responses.ts](../src/ai/openai-responses.ts) -> POST `/responses` 且 `store: false` -> 解析 output item 或 SSE -> 内部 text/tool call/usage。
- Anthropic Messages：[src/ai/anthropic-messages.ts](../src/ai/anthropic-messages.ts) -> POST `/messages` 且 `anthropic-version: 2023-06-01` -> 解析 content block 或 SSE -> 内部 text/tool call/usage。
- 会话持久化：[src/session/store.ts](../src/session/store.ts) -> `<cwd>/.chatrealm/sessions/default.json` -> 下次运行时先加载历史消息。
- 测试运行：[package.json](../package.json) `test:unit` -> `node --import tsx --test "test/**/*.test.ts"`。

## 推荐阅读顺序
- [src/main.ts](../src/main.ts)：先看组合根，确认运行模式、依赖汇合点和 transport 创建。
- [src/config/config.ts](../src/config/config.ts)：确认配置/环境变量优先级和必填 `api` 校验。
- [src/ai/types.ts](../src/ai/types.ts)：理解支持的 API 值和内部消息、tool call、usage、transport 合同。
- [src/ai/transport-factory.ts](../src/ai/transport-factory.ts)：理解配置驱动的 adapter 选择。
- [src/ai/openai-completions.ts](../src/ai/openai-completions.ts)、[src/ai/openai-responses.ts](../src/ai/openai-responses.ts)、[src/ai/anthropic-messages.ts](../src/ai/anthropic-messages.ts)：理解各协议请求/响应和 streaming 转换。
- [src/agent/run-prompt.ts](../src/agent/run-prompt.ts)：理解 prompt 到 session 保存的应用流程。
- [src/agent/agent-loop.ts](../src/agent/agent-loop.ts)：理解模型调用、工具调用和 max-turn 结束条件。
- [src/session/store.ts](../src/session/store.ts)：理解 session 文件格式和错误边界。
- [test/api-selection.test.ts](../test/api-selection.test.ts)、[test/transport-factory.test.ts](../test/transport-factory.test.ts)、[test/interactive-streaming.test.ts](../test/interactive-streaming.test.ts)：理解已验证的协议选择核心行为。

## 风险与未知
- [chatrealm.config.json](../chatrealm.config.json)：当前默认配置文件包含非空 API key，属于敏感信息落盘风险；不要在文档、日志或提交中扩散具体值。确认文件：[src/config/config.ts](../src/config/config.ts)；置信度 high。
- [README.md](../README.md) 和 [README.zh.md](../README.zh.md)：按用户要求，本轮不更新用户 README；因此用户可能无法只通过 README 发现新的 `api` 协议能力。确认文件：本架构索引和 [src/config/config.ts](../src/config/config.ts)；置信度 medium。
- [src/main.ts](../src/main.ts)：`--provider` 仍只接受 `openai-compatible`，协议选择独立放在配置 `api` 中。确认文件：[src/main.ts](../src/main.ts)；置信度 medium。
- [src/tools/write-file.ts](../src/tools/write-file.ts) 与 [src/tools/shell.ts](../src/tools/shell.ts)：写文件和 shell 工具没有审批/策略层，这是 README 已知限制，运行时风险较高。确认文件：[README.md](../README.md)；置信度 high。
- [package.json](../package.json)：`main` 指向 `index.js`，但源码清单未发现该文件；当前 bin 路径可用，作为包导入时可能不成立。确认文件：未来打包策略；置信度 medium。
- [tsconfig.json](../tsconfig.json)：`include` 包含 `tool-smoke.ts`，但当前文件清单只发现 [session-store-smoke.ts](../session-store-smoke.ts)；可能是旧名称残留。确认文件：实际 smoke 脚本规划；置信度 medium。
- [test/](../test/)：测试覆盖 config、adapter selection、三类 adapter、agent loop、session、registry 和 interactive streaming，但还没有直接覆盖 read/write/search/shell 具体工具实现。确认文件：新增工具测试；置信度 medium。
- [.chatrealm/](../.chatrealm/)：运行时 session 文件可能包含用户提示、工具输出和模型回复；应作为本地状态而不是源代码审查对象处理。确认文件：[src/session/store.ts](../src/session/store.ts)；置信度 high。
