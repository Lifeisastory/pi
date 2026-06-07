# CLI 主流程实现分析

## 1. 分析范围

- 本次只分析 `pi` CLI 从进程入口到运行模式分发的主流程。
- 覆盖参数解析、会话选择、cwd 绑定服务创建、runtime 创建、初始消息准备，以及 interactive / print / rpc 三种模式入口。
- 不覆盖 TUI 渲染细节、Agent tool-loop 内部算法、具体 provider streaming 实现。
- 项目总体索引入口：[ _ARCHITECTURE/ARCHITECTURE.en.md](../ARCHITECTURE.en.md)。

## 2. 功能概览

`pi` 的启动主流程由一个薄 CLI 启动器进入真正的 `main(args, options)`。`main` 先处理离线模式、包管理子命令、配置子命令和 CLI 参数，再根据参数与 stdin 状态决定运行模式。随后它选择或创建 `SessionManager`，构造可随 session cwd 重建的 runtime factory，创建 `AgentSessionRuntime`，最后分发到 RPC、交互 TUI 或一次性 print 模式。

核心思路是：启动层先决定“本次运行的上下文和模式”，runtime 层再负责“以目标 cwd 和 session 为中心创建可用 AgentSession”。

## 3. 关键源码入口

- [packages/coding-agent/src/cli.ts](../../packages/coding-agent/src/cli.ts):12-20：进程级入口，设置进程标题、环境标记、HTTP dispatcher，然后调用 `main(process.argv.slice(2))`。
- [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):424-715：CLI 主控流程。
- [packages/coding-agent/src/cli/args.ts](../../packages/coding-agent/src/cli/args.ts):59-185：把命令行参数解析成 `Args`。
- [packages/coding-agent/src/core/agent-session-services.ts](../../packages/coding-agent/src/core/agent-session-services.ts):130-194：创建 cwd 绑定服务并基于服务创建 `AgentSession`。
- [packages/coding-agent/src/core/agent-session-runtime.ts](../../packages/coding-agent/src/core/agent-session-runtime.ts):68-113, 393-410：保存当前 session/services，并支持后续 session 重绑定。
- [packages/coding-agent/src/modes/interactive/interactive-mode.ts](../../packages/coding-agent/src/modes/interactive/interactive-mode.ts):359-390, 716-789：交互模式接收 runtime，初始化 TUI 并进入用户输入循环。
- [packages/coding-agent/src/modes/print-mode.ts](../../packages/coding-agent/src/modes/print-mode.ts):32-158：一次性 print/json 模式。
- [packages/coding-agent/src/modes/rpc/rpc-mode.ts](../../packages/coding-agent/src/modes/rpc/rpc-mode.ts):53-770：JSONL RPC 模式。

## 4. 主流程详解

### 4.1 起点

`cli.ts` 是很薄的一层。它设置 `process.title`、`PI_CODING_AGENT` 环境标记，屏蔽 `process.emitWarning`，先调用一次 `configureHttpDispatcher()`，再把真实参数交给 `main`（[packages/coding-agent/src/cli.ts](../../packages/coding-agent/src/cli.ts):12-20）。

`main` 开始时会记录 timing，并处理 `--offline` 或 `PI_OFFLINE`。离线模式会同时设置 `PI_SKIP_VERSION_CHECK`，避免启动时做版本检查（[packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):424-430）。Windows 下会执行自更新隔离清理（[packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):432-434）。

### 4.2 参数解析与早退分支

在正式解析通用参数前，`main` 先让包管理和配置子命令抢占处理；如果 `handlePackageCommand` 或 `handleConfigCommand` 返回成功，主流程直接结束（[packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):436-442）。

随后 `parseArgs(args)` 产生 `Args` 对象。解析器维护 `messages`、`fileArgs`、`unknownFlags` 和 `diagnostics`，逐项扫描 CLI 参数（[packages/coding-agent/src/cli/args.ts](../../packages/coding-agent/src/cli/args.ts):59-68）。它把 `--mode` 限定为 `text/json/rpc`（[packages/coding-agent/src/cli/args.ts](../../packages/coding-agent/src/cli/args.ts):74-78），把 `--print/-p` 标记为 print 模式并可顺手吃掉下一个 prompt（[packages/coding-agent/src/cli/args.ts](../../packages/coding-agent/src/cli/args.ts):123-129），把 `@file` 收进 `fileArgs`（[packages/coding-agent/src/cli/args.ts](../../packages/coding-agent/src/cli/args.ts):165-166），把未知 `--flag` 保留给扩展系统（[packages/coding-agent/src/cli/args.ts](../../packages/coding-agent/src/cli/args.ts):167-180）。

`main` 根据解析诊断决定是否退出（[packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):444-453）。然后通过 `resolveAppMode` 选择应用模式：显式 `rpc` 优先，其次 `json`，再是 `--print` 或非 TTY stdin 触发 print，否则进入 interactive（[packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):99-110, 455-459）。

### 4.3 会话选择与 runtime 创建

`main` 会先处理 `--version`、`--export`、RPC 禁用 `@file` 等早退或校验路径（[packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):461-485）。接着运行迁移，创建 startup cwd 的 `SettingsManager`，并解析 session dir（[packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):487-505）。

`createSessionManager` 根据参数决定 session 来源：`--no-session` 使用内存 session；`--fork` 从已有 session 分叉；`--session` 打开指定 session；`--resume` 打开选择器；`--continue` 继续最近 session；默认创建新 session（[packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):215-285）。如果目标 session 的 cwd 缺失，interactive 模式会提示用户选择 fallback，非 interactive 模式直接报错退出（[packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):506-519）。

真正的 runtime 创建被封装成 `createRuntime` 闭包。这个闭包捕获 CLI 参数和路径解析结果，但每次执行时都基于传入的目标 `cwd`、`agentDir`、`sessionManager` 重新创建服务（[packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):522-552）。这解释了为什么恢复另一个项目的 session 时，要先确定 session cwd 再加载设置、资源、provider 和模型。

`createAgentSessionServices` 将 `cwd`、`agentDir` 规范化，创建或复用 `AuthStorage`、`SettingsManager`、`ModelRegistry` 和 `DefaultResourceLoader`，然后 `resourceLoader.reload()` 加载资源（[packages/coding-agent/src/core/agent-session-services.ts](../../packages/coding-agent/src/core/agent-session-services.ts):130-144）。扩展挂起的 provider 注册会写入 `ModelRegistry`，扩展 CLI flag 也在这里应用（[packages/coding-agent/src/core/agent-session-services.ts](../../packages/coding-agent/src/core/agent-session-services.ts):146-160）。

服务创建后，`main` 根据 settings 或 `--models` 解析 scoped models，再用 `buildSessionOptions` 决定本次 session 的模型、thinking level、工具开关等（[packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):563-577）。`--api-key` 只有在已经解析出 model 时才会写入 runtime auth storage，否则产生 error diagnostic（[packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):579-588）。

最后，`createAgentSessionFromServices` 把已建好的服务和 session options 交给 `createAgentSession`（[packages/coding-agent/src/core/agent-session-services.ts](../../packages/coding-agent/src/core/agent-session-services.ts):180-194）。`createAgentSessionRuntime` 先确认 session cwd 存在，再调用 factory，并把返回的 session/services/diagnostics 包装进 `AgentSessionRuntime`（[packages/coding-agent/src/core/agent-session-runtime.ts](../../packages/coding-agent/src/core/agent-session-runtime.ts):393-410）。`AgentSessionRuntime` 保存当前 session 与服务，同时暴露 `setRebindSession`，供模式层在 `/new`、resume、fork 等切换后重新绑定 UI 或事件订阅（[packages/coding-agent/src/core/agent-session-runtime.ts](../../packages/coding-agent/src/core/agent-session-runtime.ts):68-113）。

### 4.4 模式分发与收尾

runtime 创建完成后，`main` 会用 settings 里的 HTTP idle timeout 再配置一次 HTTP dispatcher（[packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):618-620）。然后处理 `--help` 和 `--list-models`。注意这两个命令发生在 runtime 创建之后，因此 help 可以展示扩展注册的 flags，list-models 可以使用已经加载扩展 provider 的 `modelRegistry`（[packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):622-633）。

非 RPC 模式会读取 piped stdin；如果原本是 interactive 但 stdin 有内容，会降级为 print（[packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):636-643）。初始消息由 `prepareInitialMessage` 生成：没有 `@file` 时走文本构造，有 `@file` 时先处理文件和图片（[packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):116-130, 646-650）。

最终分发很集中：RPC 走 `runRpcMode(runtime)`；interactive 构造 `InteractiveMode(runtime, options)` 并 `run()`；否则走 `runPrintMode(runtime, options)`（[packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):678-715）。

## 5. 关键实现细节

- `resolveAppMode` 把 stdin 是否为 TTY 作为模式判断的一部分。非 TTY 会自动进入 print，这让 `echo prompt | pi` 这类用法成立（[packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):99-110）。
- `createRuntime` 是延迟工厂，不是一次性对象。它允许 `AgentSessionRuntime` 在 session 切换时用新的 cwd 重建 services，同时保持模式层持有同一个 runtime host 抽象（[packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):527-611）。
- help 和 list-models 不是纯 parse 阶段命令，而是在 runtime 创建后执行。这是为了纳入扩展 flags 和扩展 provider（[packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):622-633）。
- `AgentSessionRuntime.teardownCurrent` 会先发 `session_shutdown` 扩展事件，再执行 UI 清理回调，最后 dispose 当前 session（[packages/coding-agent/src/core/agent-session-runtime.ts](../../packages/coding-agent/src/core/agent-session-runtime.ts):161-168）。
- print 模式绑定扩展时只提供命令上下文，没有 TUI UI context；它订阅 session 事件只在 json 输出模式下写 JSON 行（[packages/coding-agent/src/modes/print-mode.ts](../../packages/coding-agent/src/modes/print-mode.ts):71-107）。
- RPC 模式接管 stdout，所有输出都序列化为 JSONL；prompt 命令启动 `session.prompt`，但只有 preflight 成功后才发成功响应（[packages/coding-agent/src/modes/rpc/rpc-mode.ts](../../packages/coding-agent/src/modes/rpc/rpc-mode.ts):53-61, 389-410）。
- interactive 模式在 constructor 中创建 TUI、编辑器、footer 和 keybindings；`run()` 先 `init()`，再处理启动消息，最后进入无限输入循环并调用 `session.prompt(userInput)`（[packages/coding-agent/src/modes/interactive/interactive-mode.ts](../../packages/coding-agent/src/modes/interactive/interactive-mode.ts):359-390, 716-789）。

## 6. 相关文件关系

- 主路径：[packages/coding-agent/src/cli.ts](../../packages/coding-agent/src/cli.ts) -> [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts)。
- 参数层：[packages/coding-agent/src/cli/args.ts](../../packages/coding-agent/src/cli/args.ts) 只负责解析和 help 文本，不创建 session。
- runtime 层：[packages/coding-agent/src/core/agent-session-services.ts](../../packages/coding-agent/src/core/agent-session-services.ts) 负责服务接线；[packages/coding-agent/src/core/agent-session-runtime.ts](../../packages/coding-agent/src/core/agent-session-runtime.ts) 负责持有和替换当前 runtime。
- 模式层：[packages/coding-agent/src/modes/interactive/interactive-mode.ts](../../packages/coding-agent/src/modes/interactive/interactive-mode.ts)、[packages/coding-agent/src/modes/print-mode.ts](../../packages/coding-agent/src/modes/print-mode.ts)、[packages/coding-agent/src/modes/rpc/rpc-mode.ts](../../packages/coding-agent/src/modes/rpc/rpc-mode.ts) 接收已经创建好的 runtime，不重新解析 CLI。

## 7. 时序总结

1. `cli.ts` 设置进程环境并调用 `main(process.argv.slice(2))`。
2. `main` 设置离线/Windows 启动前置状态。
3. 包管理和配置子命令有机会提前处理并返回。
4. `parseArgs` 生成 `Args`，未知长参数保留给扩展 flags。
5. `resolveAppMode` 基于 `--mode`、`--print` 和 stdin TTY 状态选择模式。
6. `createSessionManager` 根据 `--session`、`--resume`、`--continue`、`--fork` 或默认路径确定 session。
7. `createRuntime` 创建 cwd 绑定 services，加载资源，注册扩展 provider，解析模型和 session options。
8. `createAgentSessionRuntime` 调用 runtime factory 并包装成 `AgentSessionRuntime`。
9. `main` 在 runtime 可用后处理 help/list-models、stdin 和初始消息。
10. `main` 分发到 `runRpcMode`、`InteractiveMode.run` 或 `runPrintMode`。
11. 模式层通过 `runtimeHost.setRebindSession` 支持后续 session 切换后的重新绑定。

## 8. 边界情况与注意点

- `--help` 不是最早退出，因为它需要扩展 flags；因此启动 help 也可能触发资源加载诊断。
- `--list-models` 同样在 runtime 创建后执行，因此它能看到扩展注册的 provider。
- RPC 模式禁止 `@file` 参数，代码在 session 创建前校验并退出（[packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):480-483）。
- 非 interactive 模式要求 session 有 model，否则输出无模型提示并退出（[packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):667-670）。
- 推断：interactive 模式把 `ensureTool("fd")` 和 `ensureTool("rg")` 放在 `init()`，是为了把 TUI autocomplete 和 grep/bash 辅助能力准备好，但本次未深入分析 `ensureTool` 的下载和 PATH 注入逻辑（[packages/coding-agent/src/modes/interactive/interactive-mode.ts](../../packages/coding-agent/src/modes/interactive/interactive-mode.ts):568-579）。

## 9. 关键证据

- CLI 薄入口：[packages/coding-agent/src/cli.ts](../../packages/coding-agent/src/cli.ts):12-20。
- 主控函数入口：[packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):424。
- 模式选择：[packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):99-110。
- session manager 选择：[packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):215-285。
- runtime factory 和服务创建：[packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):527-611。
- cwd 绑定服务：[packages/coding-agent/src/core/agent-session-services.ts](../../packages/coding-agent/src/core/agent-session-services.ts):130-194。
- runtime 包装：[packages/coding-agent/src/core/agent-session-runtime.ts](../../packages/coding-agent/src/core/agent-session-runtime.ts):393-410。
- 最终模式分发：[packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):678-715。
