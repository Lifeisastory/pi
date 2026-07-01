# Architecture Index

## Artifact Metadata
- Artifact: architecture-index
- Language: English
- Source: generated-from-project-scan

## Project Type
- Inference: monorepo
- Evidence: root package.json with workspaces, packages/ directory containing 4 npm packages with inter-package dependencies
- Confidence: high

## Entrypoints
- [packages/coding-agent/src/main.ts](../packages/coding-agent/src/main.ts) | CLI entrypoint (bin: pi) | explicit (package.json bin field, source file top-level imports and mode dispatch) | high
- [packages/coding-agent/src/cli.ts](../packages/coding-agent/src/cli.ts) | Shim entry loading jiti-registered TypeScript | explicit (bin field points here after build, sets up jiti) | high
- [packages/coding-agent/src/index.ts](../packages/coding-agent/src/index.ts) | SDK public API (programmatic use) | explicit (package.json main/types/exports) | high
- [packages/coding-agent/src/core/index.ts](../packages/coding-agent/src/core/index.ts) | Core module re-export hub | explicit (imported by main.ts) | high
- [packages/ai/src/index.ts](../packages/ai/src/index.ts) | AI package public API | explicit (package.json main/types/exports) | high
- [packages/agent/src/index.ts](../packages/agent/src/index.ts) | Agent package public API | explicit (package.json main/types/exports) | high
- [packages/tui/src/index.ts](../packages/tui/src/index.ts) | TUI package public API | explicit (package.json main) | high

## Modules
- [packages/ai/](../packages/ai/) | Unified multi-provider LLM API with model registry, provider implementations, image generation, and streaming | explicit (package.json name @earendil-works/pi-ai) | high
- [packages/agent/](../packages/agent/) | Agent runtime with tool-calling loop, state management, session persistence, compaction, skills, and prompt templates | explicit (package.json name @earendil-works/pi-agent-core) | high
- [packages/tui/](../packages/tui/) | Terminal UI library with differential rendering, editor component, autocomplete, keybindings, and terminal image support | explicit (package.json name @earendil-works/pi-tui) | high
- [packages/coding-agent/](../packages/coding-agent/) | Coding agent CLI application with interactive TUI mode, print mode, RPC mode, extensions system, and agent session management | explicit (package.json name @earendil-works/pi-coding-agent) | high
- [packages/coding-agent/src/core/](../packages/coding-agent/src/core/) | Shared core layer: AgentSession, services, extensions, tools, compaction, auth, model registry/resolver | explicit (directory structure, imports in main.ts) | high
- [packages/coding-agent/src/modes/](../packages/coding-agent/src/modes/) | Run mode implementations: interactive (TUI), print (one-shot), RPC (programmatic JSONL) | explicit (index.ts exports, main.ts dispatches) | high
- [packages/coding-agent/src/utils/](../packages/coding-agent/src/utils/) | Cross-cutting utilities: clipboard, image processing, git, ANSI, filesystem, shell | explicit (directory naming) | high
- [packages/coding-agent/src/cli/](../packages/coding-agent/src/cli/) | CLI argument parsing and pre-processing (args, file processor, initial message, session picker) | explicit (directory naming, imports in main.ts) | high
- [packages/ai/src/providers/](../packages/ai/src/providers/) | LLM provider implementations (anthropic, openai variants, google, bedrock, mistral, etc.) | explicit (directory naming, re-exported via index.ts) | high
- [.github/workflows/](../.github/workflows/) | CI/CD pipelines: ci, issue-gate, pr-gate, approve-contributor, build-binaries, npm-audit, openclaw-gate | explicit (GitHub Actions convention) | high
- [scripts/](../scripts/) | Build, release, CI check, and profiling automation scripts | explicit (package.json scripts reference them) | high

## Files (key structural files)
- [packages/coding-agent/src/main.ts](../packages/coding-agent/src/main.ts) | CLI entry: parses args, initializes services, dispatches to interactive/print/rpc mode | explicit (top-level mode dispatch) | high
- [packages/coding-agent/src/config.ts](../packages/coding-agent/src/config.ts) | Central configuration: directories (agent dir, config dir, session dir), version, env vars | explicit (imported by main.ts and many others) | high
- [packages/coding-agent/src/core/agent-session.ts](../packages/coding-agent/src/core/agent-session.ts) | AgentSession: core agent lifecycle, state, events, compaction, session switching | explicit (imported by core/index.ts, all modes) | high
- [packages/coding-agent/src/core/agent-session-services.ts](../packages/coding-agent/src/core/agent-session-services.ts) | Wiring layer: creates and connects AgentSession, TUI, agent runtime, auth, settings | explicit (imported by main.ts) | high
- [packages/coding-agent/src/core/agent-session-runtime.ts](../packages/coding-agent/src/core/agent-session-runtime.ts) | Runtime factory for AgentSession creation | explicit (imported by main.ts) | high
- [packages/coding-agent/src/modes/interactive/interactive-mode.ts](../packages/coding-agent/src/modes/interactive/interactive-mode.ts) | Interactive TUI mode: main loop, rendering, input handling | explicit (mode dispatch in main.ts) | high
- [packages/coding-agent/src/modes/print-mode.ts](../packages/coding-agent/src/modes/print-mode.ts) | Print/one-shot mode: run a single prompt and exit | explicit (mode dispatch in main.ts) | high
- [packages/coding-agent/src/modes/rpc/rpc-mode.ts](../packages/coding-agent/src/modes/rpc/rpc-mode.ts) | RPC mode: programmatic JSONL stdin/stdout interface | explicit (mode dispatch in main.ts) | high
- [packages/coding-agent/src/core/extensions/index.ts](../packages/coding-agent/src/core/extensions/index.ts) | Extensions system: types, loader, runner | explicit (core/index.ts re-export) | high
- [packages/ai/src/models.ts](../packages/ai/src/models.ts) | Model registry: getModel, getProviders, getModels, calculateCost | explicit (top-level import path) | high
- [packages/ai/src/api-registry.ts](../packages/ai/src/api-registry.ts) | API provider registration and streamSimple dispatch | explicit (index.ts re-export) | high
- [packages/ai/src/types.ts](../packages/ai/src/types.ts) | Core AI types: KnownProvider, KnownApi, Model, Transport, Message, Usage | explicit (index.ts re-export) | high
- [packages/agent/src/agent.ts](../packages/agent/src/agent.ts) | Agent class: tool-calling loop orchestration | explicit (index.ts re-export) | high
- [packages/agent/src/agent-loop.ts](../packages/agent/src/agent-loop.ts) | Agent loop functions: runAgentLoop, runAgentLoopContinue | explicit (index.ts re-export) | high
- [packages/agent/src/types.ts](../packages/agent/src/types.ts) | Agent types: AgentContext, AgentState, AgentTool, AgentMessage | explicit (index.ts re-export) | high
- [packages/tui/src/tui.ts](../packages/tui/src/tui.ts) | TUI core: Component, Container, differential rendering | explicit (index.ts re-export) | high
- [package.json](../package.json) | Monorepo root: workspace definitions, scripts, devDependencies | explicit (npm workspace root) | high

## Relationships
- [packages/coding-agent/src/main.ts](../packages/coding-agent/src/main.ts) | depends_on | [packages/coding-agent/src/cli/args.ts](../packages/coding-agent/src/cli/args.ts) | explicit | import | high
- [packages/coding-agent/src/main.ts](../packages/coding-agent/src/main.ts) | depends_on | [packages/coding-agent/src/core/agent-session-runtime.ts](../packages/coding-agent/src/core/agent-session-runtime.ts) | explicit | import | high
- [packages/coding-agent/src/main.ts](../packages/coding-agent/src/main.ts) | depends_on | [packages/coding-agent/src/core/agent-session-services.ts](../packages/coding-agent/src/core/agent-session-services.ts) | explicit | import | high
- [packages/coding-agent/src/main.ts](../packages/coding-agent/src/main.ts) | depends_on | [packages/coding-agent/src/modes/index.ts](../packages/coding-agent/src/modes/index.ts) | explicit | import | high
- [packages/coding-agent/src/main.ts](../packages/coding-agent/src/main.ts) | depends_on | [packages/tui/src/tui.ts](../packages/tui/src/tui.ts) | explicit | import TUI, ProcessTerminal | high
- [packages/coding-agent/src/core/agent-session.ts](../packages/coding-agent/src/core/agent-session.ts) | depends_on | [packages/agent/src/agent.ts](../packages/agent/src/agent.ts) | explicit | import Agent types | high
- [packages/coding-agent/src/core/agent-session.ts](../packages/coding-agent/src/core/agent-session.ts) | depends_on | [packages/ai/src/models.ts](../packages/ai/src/models.ts) | explicit | import streamSimple, models | high
- [packages/agent/src/agent.ts](../packages/agent/src/agent.ts) | depends_on | [packages/ai/src/types.ts](../packages/ai/src/types.ts) | explicit | import Message, Transport | high
- coding-agent package | depends_on | agent package | explicit | package.json dependencies | high
- coding-agent package | depends_on | ai package | explicit | package.json dependencies | high
- coding-agent package | depends_on | tui package | explicit | package.json dependencies | high
- agent package | depends_on | ai package | explicit | package.json dependencies | high
- [packages/ai/src/models.generated.ts](../packages/ai/src/models.generated.ts) | influenced_by | [packages/ai/scripts/generate-models.ts](../packages/ai/scripts/generate-models.ts) | explicit | code generation script | high
- [packages/ai/src/api-registry.ts](../packages/ai/src/api-registry.ts) | depends_on | [packages/ai/src/providers/register-builtins.ts](../packages/ai/src/providers/register-builtins.ts) | inferred | lazy registration pattern | high
- [packages/coding-agent/src/core/tools/](../packages/coding-agent/src/core/tools/) | depended_on_by | [packages/coding-agent/src/core/agent-session.ts](../packages/coding-agent/src/core/agent-session.ts) | explicit | tool imports for agent setup | high

## Flows
- CLI startup | [main.ts](../packages/coding-agent/src/main.ts) → [args.ts](../packages/coding-agent/src/cli/args.ts) → [agent-session-services.ts](../packages/coding-agent/src/core/agent-session-services.ts) → [agent-session.ts](../packages/coding-agent/src/core/agent-session.ts) → [interactive-mode.ts](../packages/coding-agent/src/modes/interactive/interactive-mode.ts) | high
- Interactive prompt flow | [interactive-mode.ts](../packages/coding-agent/src/modes/interactive/interactive-mode.ts) → [agent-session.ts](../packages/coding-agent/src/core/agent-session.ts) → [agent.ts](../packages/agent/src/agent.ts) → [agent-loop.ts](../packages/agent/src/agent-loop.ts) → [api-registry.ts](../packages/ai/src/api-registry.ts) → [provider](../packages/ai/src/providers/) | high
- Print mode (one-shot) | [main.ts](../packages/coding-agent/src/main.ts) → [print-mode.ts](../packages/coding-agent/src/modes/print-mode.ts) → [agent-session.ts](../packages/coding-agent/src/core/agent-session.ts) → [agent-loop.ts](../packages/agent/src/agent-loop.ts) | high
- RPC mode (programmatic) | [main.ts](../packages/coding-agent/src/main.ts) → [rpc-mode.ts](../packages/coding-agent/src/modes/rpc/rpc-mode.ts) → [rpc-client.ts](../packages/coding-agent/src/modes/rpc/rpc-client.ts) → [agent-session.ts](../packages/coding-agent/src/core/agent-session.ts) | high
- Model resolution | [model-resolver.ts](../packages/coding-agent/src/core/model-resolver.ts) → [model-registry.ts](../packages/coding-agent/src/core/model-registry.ts) → [models.ts](../packages/ai/src/models.ts) → [models.generated.ts](../packages/ai/src/models.generated.ts) | high
- Compaction | [agent-session.ts](../packages/coding-agent/src/core/agent-session.ts) → [compaction/index.ts](../packages/coding-agent/src/core/compaction/index.ts) → [compaction.ts](../packages/coding-agent/src/core/compaction/compaction.ts) → [branch-summarization.ts](../packages/coding-agent/src/core/compaction/branch-summarization.ts) | high
- Extension loading | [agent-session-services.ts](../packages/coding-agent/src/core/agent-session-services.ts) → [extensions/loader.ts](../packages/coding-agent/src/core/extensions/loader.ts) → [extensions/runner.ts](../packages/coding-agent/src/core/extensions/runner.ts) | high

## Recommended Next Reads
- [packages/coding-agent/src/main.ts](../packages/coding-agent/src/main.ts) | Best starting point: CLI entry, mode dispatch, service wiring
- [packages/coding-agent/src/core/agent-session.ts](../packages/coding-agent/src/core/agent-session.ts) | Core session abstraction used by all modes
- [packages/coding-agent/src/modes/interactive/interactive-mode.ts](../packages/coding-agent/src/modes/interactive/interactive-mode.ts) | Primary user-facing mode: TUI rendering and event loop
- [packages/ai/src/api-registry.ts](../packages/ai/src/api-registry.ts) | How models dispatch to providers and stream responses
- [packages/ai/src/models.generated.ts](../packages/ai/src/models.generated.ts) | Complete model catalog: all providers, model IDs, costs, capabilities
- [packages/agent/src/agent.ts](../packages/agent/src/agent.ts) | Agent core: tool-calling loop, state management
- [packages/coding-agent/src/core/extensions/index.ts](../packages/coding-agent/src/core/extensions/index.ts) | Extensions system entry point for customization
- [packages/coding-agent/src/core/tools/index.ts](../packages/coding-agent/src/core/tools/index.ts) | All built-in tools (bash, read, write, edit, grep, find, ls)

## Feature Index
- CLI startup main flow from process entry through argument parsing, session/runtime creation, and mode dispatch, see [cli-main-flow.en.md](./_FEATURE/cli-main-flow.en.md)
- Conversation memory management: session-tree JSONL persistence, token-threshold compaction with LLM summarization, and branch summaries, see [conversation-memory.en.md](./_FEATURE/conversation-memory.en.md)
- Prompt assembly: 7-section system prompt construction, dynamic injection (tools/CLAUDE.md/skills/cwd/date), and final Context build for the LLM, see [prompt-assembly.en.md](./_FEATURE/prompt-assembly.en.md)

## Risks And Unknowns
- AI provider implementations | Each provider has unique message format, streaming behavior, error handling; not all tested end-to-end | test files in packages/ai/test/ | medium
- Extension system API stability | Extensions expose many lifecycle hooks; API surface may evolve | packages/coding-agent/src/core/extensions/types.ts | medium
- Windows support | Some features (clipboard, native shell, self-update) have platform-specific code paths | packages/coding-agent/src/utils/windows-self-update.ts, clipboard-native.ts | medium
- Compaction quality | Summarization truncation strategies impact session quality; depends on model used | packages/coding-agent/src/core/compaction/ | low
- TUI rendering on exotic terminals | Kitty protocol, iTerm2, sixel image support varies across terminals | packages/tui/src/terminal-image.ts | low
