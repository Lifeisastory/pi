# pi-mono 项目架构分析

## 项目类型

- 推断：**monorepo（多包仓库）**
- 证据：根目录 `package.json` 含 `workspaces` 配置，`packages/` 下有 4 个相互依赖的 npm 包
- 置信度：高

## 项目概要

pi-mono 是 [pi](https://pi.dev) 编码代理（coding agent）的 monorepo。pi 是一个自扩展的、交互式的 AI 编码代理 CLI 工具。项目包含四个核心 npm 包，外加数个示例扩展工作区。

## 顶层架构树

```
pi-mono/
├── packages/
│   ├── ai/                    # 统一多提供商 LLM API
│   │   ├── src/providers/     # 各 LLM 提供商实现（20+ 家）
│   │   ├── src/models.ts      # 模型注册与查询
│   │   ├── src/api-registry.ts # API 注册与流式分发
│   │   ├── src/types.ts       # 核心类型定义
│   │   ├── scripts/           # 模型/图片模型代码生成
│   │   └── test/              # 大量提供商专属测试
│   ├── agent/                 # 代理运行时核心
│   │   ├── src/agent.ts       # Agent 类：工具调用循环
│   │   ├── src/agent-loop.ts  # 循环函数
│   │   ├── src/types.ts       # 代理类型定义
│   │   └── src/harness/       # 助记子系统（compaction, skills, system-prompt 等）
│   ├── tui/                   # 终端 UI 库
│   │   ├── src/tui.ts         # 核心：组件树、差分渲染
│   │   ├── src/terminal.ts    # 终端抽象
│   │   ├── src/keybindings.ts # 按键绑定系统
│   │   ├── src/keys.ts        # 按键解析
│   │   └── src/terminal-image.ts # 终端图片渲染（Kitty/iTerm2/Sixel）
│   └── coding-agent/          # 编码代理 CLI 应用【核心包】
│       ├── src/main.ts        # CLI 入口：参数解析、模式分发
│       ├── src/index.ts       # SDK 公开 API（编程调用）
│       ├── src/config.ts      # 全局配置中心
│       ├── src/core/          # 共享核心层
│       │   ├── agent-session.ts       # AgentSession：代理生命周期管理
│       │   ├── agent-session-services.ts # 服务组装与连线
│       │   ├── agent-session-runtime.ts  # 运行时工厂
│       │   ├── tools/                 # 内置工具（bash, read, write, edit, grep, find, ls）
│       │   ├── compaction/            # 会话压缩/摘要
│       │   ├── extensions/            # 扩展系统（加载、运行、类型）
│       │   ├── model-registry.ts      # 模型注册表
│       │   ├── model-resolver.ts      # 模型解析
│       │   ├── auth-storage.ts        # OAuth 认证存储
│       │   └── keybindings.ts         # 按键绑定管理
│       ├── src/modes/         # 运行模式
│       │   ├── interactive/   # 交互 TUI 模式（30+ 组件）
│       │   ├── print-mode.ts  # 一次性打印模式
│       │   └── rpc/           # RPC 模式（JSONL 协议）
│       ├── src/cli/           # CLI 参数解析与预处理
│       ├── src/utils/         # 工具函数（剪贴板、图片、Git、ANSI 等）
│       └── src/bun/           # Bun 运行时入口（binary 构建用）
├── scripts/                   # 构建/发布/检查/分析脚本
├── .github/                   # CI/CD 工作流
├── .pi/                       # pi 自身配置（扩展、Git hooks、提示词模板、技能）
├── package.json               # monorepo 根配置
└── tsconfig.base.json         # TypeScript 基础配置
```

## 核心入口点

| 路径                                                                               | 角色                                    | 依据                                        |
| ---------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------- |
| [packages/coding-agent/src/main.ts](../packages/coding-agent/src/main.ts)             | CLI 主入口（`pi` 命令）               | `package.json` bin 字段，顶层模式分发逻辑 |
| [packages/coding-agent/src/cli.ts](../packages/coding-agent/src/cli.ts)               | 构建产物入口，加载 jiti 注册 TypeScript | `package.json` bin 指向 `dist/cli.js`   |
| [packages/coding-agent/src/index.ts](../packages/coding-agent/src/index.ts)           | SDK 公开 API，可编程调用                | `package.json` main/types/exports 字段    |
| [packages/coding-agent/src/core/index.ts](../packages/coding-agent/src/core/index.ts) | 核心模块重汇出中枢                      | `main.ts` 和其他模式文件导入              |
| [packages/ai/src/index.ts](../packages/ai/src/index.ts)                               | LLM API 公开入口                        | `package.json` main/types/exports 字段    |
| [packages/agent/src/index.ts](../packages/agent/src/index.ts)                         | 代理运行时公开 API                      | `package.json` main/types/exports 字段    |
| [packages/tui/src/index.ts](../packages/tui/src/index.ts)                             | TUI 组件库公开 API                      | `package.json` main 字段                  |

## 模块边界与依赖关系

```
coding-agent ──→ agent ──→ ai
    │                           │
    └──→ tui                    └──→ 20+ LLM 提供商
                                      (anthropic, openai, google, bedrock, mistral...)
```

### 包依赖（显式）

- `@earendil-works/pi-coding-agent` 依赖 `pi-agent-core`、`pi-ai`、`pi-tui`
- `@earendil-works/pi-agent-core` 依赖 `pi-ai`
- `pi-tui` 无内部依赖（仅依赖 `marked`、`get-east-asian-width`）

### 核心模块职责

- **[packages/ai/](../packages/ai/)** — 统一多提供商 LLM API 层。提供 `streamSimple()` 统一流式接口，按 `Api` 类型自动路由到正确的提供商实现。模型信息由代码生成（`models.generated.ts`）。支持 28 个已知提供商。
- **[packages/agent/](../packages/agent/)** — 代理运行时。提供 `Agent` 类和 `runAgentLoop` / `runAgentLoopContinue` 循环函数，管理工具调用、状态、消息转换。包含会话持久化、压缩、技能、系统提示词等副系统。
- **[packages/tui/](../packages/tui/)** — 终端 UI 库。提供 `TUI` 差分渲染引擎、`Container`/`Component` 组件模型、`Editor` 内联编辑器、`Markdown` 渲染、`SelectList` 选择器、按键绑定、终端图片渲染等。
- **[packages/coding-agent/](../packages/coding-agent/)** — 编码代理应用。分为三层：
  - **入口层** (`main.ts`, `cli/`)：参数解析、配置初始化、模式分发
  - **核心层** (`core/`)：`AgentSession`（跨模式共享的代理生命周期）、服务组装、工具、扩展、压缩、认证、模型解析
  - **模式层** (`modes/`)：交互 TUI 模式（30+ 组件）、打印模式、RPC JSONL 模式

## 主要流程骨架

### 1. CLI 启动流程

```
main.ts → parseArgs() → 配置初始化 → createAgentSessionServices() →
createAgentSession() → 模式分发:
  ├── 交互模式 → InteractiveMode(TUI)
  ├── 打印模式 → runPrintMode()
  └── RPC 模式 → runRpcMode()
```

### 2. 交互式对话流程

```
用户输入 → TUI 渲染 → AgentSession.prompt() →
Agent.runAgentLoop() → 工具调用循环 →
  ├── LLM API 调用 (streamSimple → 提供商实现)
  ├── 工具执行 (bash, read, write, edit, grep, find, ls)
  └── 循环直到完成 → 返回结果 → TUI 渲染响应
```

### 3. 扩展加载流程

```
agent-session-services.ts → extensions/loader.ts (discoverAndLoadExtensions) →
extensions/runner.ts (ExtensionRunner) → 注册生命周期钩子
  ├── SessionStartEvent
  ├── BeforeAgentStartEvent
  ├── TurnStartEvent / TurnEndEvent
  ├── ToolCallEvent / ToolResultEvent
  └── SessionShutdownEvent
```

### 4. 压缩流程

```
自动触发或手动触发 → shouldCompact() → prepareCompaction() →
generateSummary() / generateBranchSummary() → 替换会话历史
```

## 关键配置文件

| 文件                                     | 用途                                                                    |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| [package.json](../package.json)             | monorepo 根：工作区定义、脚本、开发依赖                                 |
| [tsconfig.base.json](../tsconfig.base.json) | TypeScript 基础编译配置（Node16 模块、ES2022 目标、erasableSyntaxOnly） |
| [biome.json](../biome.json)                 | Biome linter/formatter 配置                                             |
| [.npmrc](../.npmrc)                         | npm 配置（save-exact、min-release-age）                                 |
| [.gitattributes](../.gitattributes)         | Git 属性配置                                                            |
| [.husky/](../.husky/)                       | Git hooks（pre-commit）                                                 |
| [AGENTS.md](../AGENTS.md)                   | 开发规则（面向人和 AI 代理）                                            |
| [CONTRIBUTING.md](../CONTRIBUTING.md)       | 贡献者门槛与审核流程                                                    |

## 高耦合中枢文件

- **[main.ts](../packages/coding-agent/src/main.ts)** — 汇聚所有子系统：CLI 参数、配置、服务、模式、主题、迁移
- **[agent-session.ts](../packages/coding-agent/src/core/agent-session.ts)** — 3000+ 行核心类，所有模式依赖
- **[agent-session-services.ts](../packages/coding-agent/src/core/agent-session-services.ts)** — 服务接线层：Auth、ModelRegistry、Settings、Extensions、TUI
- **[index.ts](../packages/ai/src/index.ts)** — AI 包公开 API 的统一导出点
- **[models.generated.ts](../packages/ai/src/models.generated.ts)** — 自动生成的模型目录，被模型解析链路全程依赖

## 推荐阅读顺序

1. [packages/coding-agent/src/main.ts](../packages/coding-agent/src/main.ts) — 最佳入口：CLI 启动、模式分发、服务组装一览
2. [packages/coding-agent/src/core/agent-session.ts](../packages/coding-agent/src/core/agent-session.ts) — 所有模式共享的核心会话抽象
3. [packages/coding-agent/src/modes/interactive/interactive-mode.ts](../packages/coding-agent/src/modes/interactive/interactive-mode.ts) — 用户主要面对的交互模式
4. [packages/ai/src/api-registry.ts](../packages/ai/src/api-registry.ts) — 理解模型如何分发到不同提供商
5. [packages/ai/src/models.generated.ts](../packages/ai/src/models.generated.ts) — 完整的模型目录（提供商、ID、成本、能力）
6. [packages/agent/src/agent.ts](../packages/agent/src/agent.ts) — 代理核心：工具调用循环
7. [packages/coding-agent/src/core/extensions/index.ts](../packages/coding-agent/src/core/extensions/index.ts) — 扩展系统入口
8. [packages/coding-agent/src/core/tools/index.ts](../packages/coding-agent/src/core/tools/index.ts) — 所有内置工具一览

## 功能索引

- CLI 启动主流程：从进程入口经过参数解析、会话/runtime 创建到运行模式分发，详见 [cli-main-flow.md](./_FEATURE/cli-main-flow.md)

## 风险与未知

| 风险点              | 说明                                                   | 确认途径                                                                         |
| ------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------- |
| AI 提供商实现差异   | 每个提供商有独特消息格式和流式行为，不能保证全覆盖测试 | [packages/ai/test/](../packages/ai/test/) 中的各提供商测试                          |
| 扩展系统 API 稳定性 | 扩展暴露大量生命周期钩子，API 可能随版本演变           | [extensions/types.ts](../packages/coding-agent/src/core/extensions/types.ts)        |
| Windows 平台支持    | 剪贴板、原生 Shell、自更新等有平台特定代码路径         | [windows-self-update.ts](../packages/coding-agent/src/utils/windows-self-update.ts) |
| 压缩质量            | 摘要截断策略影响长会话质量，依赖所用模型               | [compaction/](../packages/coding-agent/src/core/compaction/)                        |
| TUI 终端兼容性      | Kitty/iTerm2/Sixel 图片协议在不同终端支持不一          | [terminal-image.ts](../packages/tui/src/terminal-image.ts)                          |
