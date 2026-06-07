# Feature Implementation Record: cli-main-flow

## Metadata
- feature: cli-main-flow
- project_root: G:\DocumentsAndProjects\SoftwareDevelop_Projects\NodeJS\pi
- architecture_index: _ARCHITECTURE/ARCHITECTURE.en.md
- analysis_scope: Analyze the `pi` CLI startup path from process entry through argument parsing, session/runtime creation, and dispatch into interactive, print, or RPC mode.
- output_date: 2026-06-07
- confidence: high

## Entry Points
- symbol: process entry
  file: [packages/coding-agent/src/cli.ts](../../packages/coding-agent/src/cli.ts)
  lines: 12-20
  role: Sets process-level flags and calls `main(process.argv.slice(2))`.
- symbol: main
  file: [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts)
  lines: 424-715
  role: CLI startup coordinator, session/runtime creator, and mode dispatcher.
- symbol: parseArgs
  file: [packages/coding-agent/src/cli/args.ts](../../packages/coding-agent/src/cli/args.ts)
  lines: 59-185
  role: Converts raw CLI arguments into an `Args` object.
- symbol: createAgentSessionRuntime
  file: [packages/coding-agent/src/core/agent-session-runtime.ts](../../packages/coding-agent/src/core/agent-session-runtime.ts)
  lines: 393-410
  role: Runs the runtime factory and wraps the resulting session/services in `AgentSessionRuntime`.

## Core Flow
1. step: Process-level startup
   file: [packages/coding-agent/src/cli.ts](../../packages/coding-agent/src/cli.ts)
   lines: 12-20
   symbols: `APP_NAME`, `configureHttpDispatcher`, `main`
   summary: The CLI shim sets process title and environment, configures the HTTP dispatcher once, and forwards CLI args to `main`.
   evidence: `main(process.argv.slice(2))` is called at line 20.
2. step: Offline and platform setup
   file: [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts)
   lines: 424-434
   symbols: `main`, `PI_OFFLINE`, `PI_SKIP_VERSION_CHECK`, `cleanupWindowsSelfUpdateQuarantine`
   summary: Startup sets offline environment flags and performs Windows self-update cleanup.
   evidence: `offlineMode` is derived from args/env at lines 426-430; Windows cleanup runs at lines 432-434.
3. step: Package/config command pre-dispatch
   file: [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts)
   lines: 436-442
   symbols: `handlePackageCommand`, `handleConfigCommand`
   summary: Package manager and config commands can consume the invocation before normal agent startup.
   evidence: Each handler returns directly when it handles the command.
4. step: Argument parsing and diagnostics
   file: [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts)
   lines: 444-453
   symbols: `parseArgs`, `parsed.diagnostics`
   summary: Raw args become `Args`; parse errors cause process exit before session creation.
   evidence: `process.exit(1)` is triggered when any diagnostic is type `error`.
5. step: App mode resolution
   file: [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts)
   lines: 99-110, 455-459
   symbols: `resolveAppMode`, `takeOverStdout`
   summary: Explicit `rpc` wins, then `json`, then `--print` or non-TTY stdin, otherwise interactive mode.
   evidence: `resolveAppMode` branch order is defined at lines 99-110.
6. step: Early validation and migrations
   file: [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts)
   lines: 461-489
   symbols: `VERSION`, `exportFromFile`, `validateForkFlags`, `runMigrations`
   summary: Version/export paths can exit early; RPC rejects `@file`; fork flag conflicts are validated; migrations run before service creation.
   evidence: RPC file-arg guard is at lines 480-483; migrations run at line 488.
7. step: Session manager selection
   file: [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts)
   lines: 215-285, 491-520
   symbols: `createSessionManager`, `SessionManager`, `getMissingSessionCwdIssue`
   summary: The invocation selects in-memory, forked, explicit, resumed, continued, or new session state before runtime services are created.
   evidence: The default branch returns `SessionManager.create(cwd, sessionDir)` at line 285.
8. step: Runtime factory captures CLI state
   file: [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts)
   lines: 522-552
   symbols: `createRuntime`, `createAgentSessionServices`
   summary: CLI resource paths and options are captured once, while services are rebuilt for each effective session cwd.
   evidence: `createRuntime` accepts `cwd`, `agentDir`, `sessionManager`, and `sessionStartEvent`, then calls `createAgentSessionServices`.
9. step: Cwd-bound services are created
   file: [packages/coding-agent/src/core/agent-session-services.ts](../../packages/coding-agent/src/core/agent-session-services.ts)
   lines: 130-170
   symbols: `createAgentSessionServices`, `DefaultResourceLoader`, `ModelRegistry`, `SettingsManager`
   summary: The service layer normalizes cwd/agentDir, creates auth/settings/model/resource services, reloads resources, registers extension providers, and applies extension flags.
   evidence: `resourceLoader.reload()` occurs at line 144; pending provider registrations are processed at lines 147-159.
10. step: Session options are resolved
    file: [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts)
    lines: 563-588
    symbols: `resolveModelScope`, `buildSessionOptions`, `authStorage.setRuntimeApiKey`
    summary: Scoped models and session options are resolved against the cwd-bound model registry and settings.
    evidence: `--api-key` produces an error diagnostic without a resolved model at lines 579-588.
11. step: AgentSession is created
    file: [packages/coding-agent/src/core/agent-session-services.ts](../../packages/coding-agent/src/core/agent-session-services.ts)
    lines: 180-194
    symbols: `createAgentSessionFromServices`, `createAgentSession`
    summary: Pre-created services and resolved session options are passed into `createAgentSession`.
    evidence: The wrapper forwards cwd, agentDir, authStorage, settingsManager, modelRegistry, resourceLoader, sessionManager, model, thinking, scopedModels, and tools.
12. step: Runtime host is constructed
    file: [packages/coding-agent/src/core/agent-session-runtime.ts](../../packages/coding-agent/src/core/agent-session-runtime.ts)
    lines: 393-410
    symbols: `createAgentSessionRuntime`, `AgentSessionRuntime`
    summary: The runtime factory result is wrapped so modes can access the current session and services and later rebind on session changes.
    evidence: `new AgentSessionRuntime(...)` receives session, services, factory, diagnostics, and modelFallbackMessage.
13. step: Post-runtime commands and initial message preparation
    file: [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts)
    lines: 622-653
    symbols: `printHelp`, `listModels`, `readPipedStdin`, `prepareInitialMessage`, `initTheme`
    summary: Help/list-models execute after runtime creation; stdin and `@file` inputs are transformed into the initial prompt payload.
    evidence: `printHelp` receives extension flags from `resourceLoader` at lines 622-627.
14. step: Mode dispatch
    file: [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts)
    lines: 678-715
    symbols: `runRpcMode`, `InteractiveMode`, `runPrintMode`
    summary: Startup branches into RPC, interactive TUI, or print mode.
    evidence: The final `if/else` dispatch is concentrated at lines 678-715.

## Key Symbols
- symbol: `main`
  kind: function
  file: [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts)
  lines: 424-715
  role: Owns CLI startup sequencing.
  used_by: [packages/coding-agent/src/cli.ts](../../packages/coding-agent/src/cli.ts):20
  calls_into: `parseArgs`, `createSessionManager`, `createAgentSessionRuntime`, `runRpcMode`, `InteractiveMode.run`, `runPrintMode`
- symbol: `parseArgs`
  kind: function
  file: [packages/coding-agent/src/cli/args.ts](../../packages/coding-agent/src/cli/args.ts)
  lines: 59-185
  role: Parses known CLI flags, messages, `@file` arguments, and extension-owned unknown flags.
  used_by: `main`
  calls_into: none observed in this analysis beyond local validation helpers.
- symbol: `resolveAppMode`
  kind: function
  file: [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts)
  lines: 99-110
  role: Maps parsed flags and stdin TTY state to `interactive`, `print`, `json`, or `rpc`.
  used_by: `main`
  calls_into: none.
- symbol: `createSessionManager`
  kind: function
  file: [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts)
  lines: 215-285
  role: Selects or creates the session backing store for this run.
  used_by: `main`
  calls_into: `SessionManager.inMemory`, `SessionManager.open`, `SessionManager.create`, `SessionManager.continueRecent`, `selectSession`
- symbol: `createAgentSessionServices`
  kind: function
  file: [packages/coding-agent/src/core/agent-session-services.ts](../../packages/coding-agent/src/core/agent-session-services.ts)
  lines: 130-170
  role: Creates cwd-bound auth, settings, model registry, and resource loader services.
  used_by: `createRuntime` closure in `main`
  calls_into: `DefaultResourceLoader.reload`, `ModelRegistry.registerProvider`, `applyExtensionFlagValues`
- symbol: `AgentSessionRuntime`
  kind: class
  file: [packages/coding-agent/src/core/agent-session-runtime.ts](../../packages/coding-agent/src/core/agent-session-runtime.ts)
  lines: 68-113, 161-180
  role: Holds the current `AgentSession` and services and supports mode-layer rebinding when sessions switch.
  used_by: mode implementations.
  calls_into: `emitSessionShutdownEvent`, `session.dispose`, stored runtime factory.
- symbol: `runPrintMode`
  kind: function
  file: [packages/coding-agent/src/modes/print-mode.ts](../../packages/coding-agent/src/modes/print-mode.ts)
  lines: 32-158
  role: Runs one-shot text/json output mode against an existing runtime.
  used_by: `main`
  calls_into: `session.bindExtensions`, `session.prompt`, `runtimeHost.dispose`
- symbol: `runRpcMode`
  kind: function
  file: [packages/coding-agent/src/modes/rpc/rpc-mode.ts](../../packages/coding-agent/src/modes/rpc/rpc-mode.ts)
  lines: 53-770
  role: Runs JSONL command/event protocol against an existing runtime.
  used_by: `main`
  calls_into: `session.bindExtensions`, `session.prompt`, `attachJsonlLineReader`, `runtimeHost.dispose`
- symbol: `InteractiveMode`
  kind: class
  file: [packages/coding-agent/src/modes/interactive/interactive-mode.ts](../../packages/coding-agent/src/modes/interactive/interactive-mode.ts)
  lines: 359-390, 716-789
  role: Runs the interactive TUI loop against an existing runtime.
  used_by: `main`
  calls_into: `init`, `session.prompt`, `runtimeHost.dispose`

## State and Data Changes
- location: [packages/coding-agent/src/cli.ts](../../packages/coding-agent/src/cli.ts):12-14
  mutation: Sets `process.title`, `process.env.PI_CODING_AGENT`, and overrides `process.emitWarning`.
  purpose: Establish process identity and suppress runtime warnings.
  triggered_by: CLI process startup.
- location: [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):426-430
  mutation: Sets `PI_OFFLINE` and `PI_SKIP_VERSION_CHECK`.
  purpose: Disable startup network operations when offline mode is active.
  triggered_by: `--offline` or `PI_OFFLINE`.
- location: [packages/coding-agent/src/cli/args.ts](../../packages/coding-agent/src/cli/args.ts):59-185
  mutation: Accumulates `Args.messages`, `Args.fileArgs`, `Args.unknownFlags`, and diagnostics.
  purpose: Convert raw CLI tokens into structured startup inputs.
  triggered_by: `parseArgs(args)`.
- location: [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):506-519
  mutation: May replace `sessionManager` when a missing session cwd is resolved interactively.
  purpose: Ensure runtime services are created for the effective session cwd.
  triggered_by: session cwd mismatch.
- location: [packages/coding-agent/src/core/agent-session-services.ts](../../packages/coding-agent/src/core/agent-session-services.ts):147-160
  mutation: Registers extension providers into `ModelRegistry`, clears pending provider registrations, and applies extension flag values.
  purpose: Make extension-provided model providers and flags available before session creation.
  triggered_by: `createAgentSessionServices`.
- location: [packages/coding-agent/src/core/agent-session-runtime.ts](../../packages/coding-agent/src/core/agent-session-runtime.ts):171-175
  mutation: Replaces current session, services, diagnostics, and model fallback message.
  purpose: Support runtime replacement during session switch/new/fork/import flows.
  triggered_by: runtime replacement methods.

## Decision Points
- condition: `parsed.mode === "rpc"`
  location: [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):99-102
  effect_if_true: Selects RPC mode.
  effect_if_false: Evaluates JSON/print/interactive conditions.
- condition: `parsed.print || !stdinIsTTY`
  location: [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):106-109
  effect_if_true: Selects print mode.
  effect_if_false: Selects interactive mode.
- condition: `parsed.noSession`, `parsed.fork`, `parsed.session`, `parsed.resume`, `parsed.continue`
  location: [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):221-285
  effect_if_true: Selects the corresponding session manager path.
  effect_if_false: Creates a new persisted session.
- condition: `parsed.mode === "rpc" && parsed.fileArgs.length > 0`
  location: [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):480-483
  effect_if_true: Prints an error and exits.
  effect_if_false: Continues startup.
- condition: `parsed.help`
  location: [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):622-628
  effect_if_true: Prints help with extension flags and exits.
  effect_if_false: Continues startup.
- condition: `appMode !== "interactive" && !session.model`
  location: [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):667-670
  effect_if_true: Prints no-model guidance and exits.
  effect_if_false: Proceeds to mode dispatch.

## Side Effects
- effect: Global stdout capture for non-interactive modes.
  location: [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):455-459
  when: App mode is not interactive.
- effect: Resource loading and extension provider registration.
  location: [packages/coding-agent/src/core/agent-session-services.ts](../../packages/coding-agent/src/core/agent-session-services.ts):138-160
  when: Runtime services are created.
- effect: HTTP dispatcher reconfiguration with user settings.
  location: [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):618-620
  when: Runtime services and settings are available.
- effect: Print mode signal handlers and runtime disposal.
  location: [packages/coding-agent/src/modes/print-mode.ts](../../packages/coding-agent/src/modes/print-mode.ts):47-65, 151-156
  when: Print mode starts and exits.
- effect: RPC mode JSONL stdin reader and persistent process lifetime.
  location: [packages/coding-agent/src/modes/rpc/rpc-mode.ts](../../packages/coding-agent/src/modes/rpc/rpc-mode.ts):759-770
  when: RPC mode starts.
- effect: Interactive mode version/package/tmux checks are started asynchronously.
  location: [packages/coding-agent/src/modes/interactive/interactive-mode.ts](../../packages/coding-agent/src/modes/interactive/interactive-mode.ts):716-738
  when: Interactive mode enters `run()`.

## Related Files
- file: [packages/coding-agent/src/cli.ts](../../packages/coding-agent/src/cli.ts)
  relevance: primary
  reason: Thin process entrypoint.
- file: [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts)
  relevance: primary
  reason: Startup coordinator and mode dispatcher.
- file: [packages/coding-agent/src/cli/args.ts](../../packages/coding-agent/src/cli/args.ts)
  relevance: primary
  reason: Defines the CLI grammar consumed by `main`.
- file: [packages/coding-agent/src/core/agent-session-services.ts](../../packages/coding-agent/src/core/agent-session-services.ts)
  relevance: primary
  reason: Creates services that must be bound to the effective session cwd.
- file: [packages/coding-agent/src/core/agent-session-runtime.ts](../../packages/coding-agent/src/core/agent-session-runtime.ts)
  relevance: primary
  reason: Provides the runtime host abstraction shared by all modes.
- file: [packages/coding-agent/src/modes/interactive/interactive-mode.ts](../../packages/coding-agent/src/modes/interactive/interactive-mode.ts)
  relevance: secondary
  reason: Interactive mode endpoint for the startup flow; internal TUI behavior is outside this scope.
- file: [packages/coding-agent/src/modes/print-mode.ts](../../packages/coding-agent/src/modes/print-mode.ts)
  relevance: primary
  reason: Print/json endpoint for the startup flow.
- file: [packages/coding-agent/src/modes/rpc/rpc-mode.ts](../../packages/coding-agent/src/modes/rpc/rpc-mode.ts)
  relevance: primary
  reason: RPC endpoint for the startup flow.
- file: [packages/coding-agent/src/modes/index.ts](../../packages/coding-agent/src/modes/index.ts)
  relevance: context-only
  reason: Re-export hub imported by `main`.

## Open Questions
- question: What exact work happens inside `createAgentSession` after services are passed in?
  status: partially-answered
  note: This analysis stops at startup/runtime creation. A separate feature analysis should inspect [packages/coding-agent/src/core/sdk.ts](../../packages/coding-agent/src/core/sdk.ts) and [packages/coding-agent/src/core/agent-session.ts](../../packages/coding-agent/src/core/agent-session.ts).
- question: How does the agent tool-calling loop process a prompt after `session.prompt`?
  status: unresolved
  note: Out of scope. Start from [packages/agent/src/agent.ts](../../packages/agent/src/agent.ts) and [packages/agent/src/agent-loop.ts](../../packages/agent/src/agent-loop.ts).
- question: How does `ensureTool("fd")` / `ensureTool("rg")` download or expose binaries?
  status: unresolved
  note: Interactive startup invokes it, but tool installation internals were not traced.

## Inferences
- statement: Help and list-models intentionally run after runtime creation so extension flags and extension providers are available.
  basis: `printHelp` reads extension flags from `resourceLoader` after runtime creation; `listModels` uses the runtime-created `modelRegistry` at [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):622-633.
- statement: The runtime factory is designed to support session cwd changes without forcing modes to recreate themselves.
  basis: `createRuntime` accepts cwd/session inputs; `AgentSessionRuntime` stores the factory and exposes `setRebindSession`, plus replacement logic in the same class.

## Retrieval Hints
- If asked "Where does the CLI start?", start from [packages/coding-agent/src/cli.ts](../../packages/coding-agent/src/cli.ts):12-20.
- If asked "Why did a command enter print instead of interactive?", start from `resolveAppMode` in [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):99-110.
- If asked "How are `--session`, `--resume`, and `--continue` handled?", start from `createSessionManager` in [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):215-285.
- If asked "Where are extensions loaded during startup?", start from `createAgentSessionServices` in [packages/coding-agent/src/core/agent-session-services.ts](../../packages/coding-agent/src/core/agent-session-services.ts):130-160.
- If asked "Where does startup branch into the three modes?", start from [packages/coding-agent/src/main.ts](../../packages/coding-agent/src/main.ts):678-715.
- If asked "How does print mode send prompts?", start from [packages/coding-agent/src/modes/print-mode.ts](../../packages/coding-agent/src/modes/print-mode.ts):118-145.
- If asked "How does RPC mode receive commands?", start from [packages/coding-agent/src/modes/rpc/rpc-mode.ts](../../packages/coding-agent/src/modes/rpc/rpc-mode.ts):702-770.
