# Architecture Index

## Artifact Metadata
- Artifact: architecture-index
- Language: English
- Source: refreshed-from-current-path-project-scan
- Scope: ChatRealm TypeScript CLI project under `D:\My\Project\pi\ChatRealm`
- Output Directory: [_ARCHITECTURE](.)
- Canonical: true
- Last Updated: 2026-06-15

## Project Type
- Inference: private TypeScript/Node.js CLI coding-agent MVP with config-selected model API protocols.
- Evidence: [package.json](../package.json) declares ESM, `bin.chatrealm`, `tsx`, and TypeScript; [src/main.ts](../src/main.ts) is the CLI composition root; [src/ai/transport-factory.ts](../src/ai/transport-factory.ts) selects concrete transports from a typed `api` config value.
- Confidence: high

## Entrypoints
- [bin/chatrealm.mjs](../bin/chatrealm.mjs) | npm bin executable | spawns Node with `--import tsx` and runs [src/main.ts](../src/main.ts) | high
- [src/main.ts](../src/main.ts) | CLI composition root | parses args, loads config/session state, creates tools, selects an AI transport through [src/ai/transport-factory.ts](../src/ai/transport-factory.ts), and dispatches to interactive or prompt mode | high
- [src/cli/interactive.ts](../src/cli/interactive.ts) | interactive mode entrypoint | uses readline loop, handles slash commands, and streams provider text deltas when available | high
- [src/agent/run-prompt.ts](../src/agent/run-prompt.ts) | single-prompt application service | creates agent state, appends user prompt, runs the loop, saves session, and renders final assistant text | high
- [src/agent/agent-loop.ts](../src/agent/agent-loop.ts) | core agent loop | depends only on the internal `ChatTransport` contract, appends assistant messages, executes tool calls, and stops at final answer or max turns | high

## Modules
- [bin/](../bin/) | CLI shim layer | executable script bridges installed command to TypeScript source via `tsx` | high
- [src/cli/](../src/cli/) | command-line UI boundary | args parser and interactive readline shell | high
- [src/config/](../src/config/) | runtime configuration boundary | reads env variables plus optional JSON config file, including required `api` protocol selection | high
- [src/ai/](../src/ai/) | provider-neutral chat protocol plus concrete API adapters | defines `ChatTransport`, supported `ChatApi` values, transport factory, OpenAI Chat Completions, OpenAI Responses, and Anthropic Messages adapters | high
- [src/agent/](../src/agent/) | agent orchestration layer | system prompt, mutable run state, agent loop, and prompt wrapper | high
- [src/tools/](../src/tools/) | local tool layer | registry plus read/search/write/shell tools and cwd path guard | high
- [src/session/](../src/session/) | session persistence layer | versioned JSON session load/save under `<cwd>/.chatrealm/sessions` | high
- [src/utils/](../src/utils/) | shared utility layer | JSON object parsing and user-facing CLI errors | high
- [test/](../test/) | focused Node test suite | covers args, config, agent loop, adapter selection, three protocol adapters, session store, registry, and interactive streaming behavior | high
- [.chatrealm/](../.chatrealm/) | runtime state directory | local saved session data, not source architecture | high
- [node_modules/](../node_modules/) | dependency install output | ignored for source architecture | high

## Files
- [package.json](../package.json) | package manifest and script hub | defines `chatrealm` bin, `check`, `test:unit`, `dev`, `start`, private package, and exact direct dependencies | high
- [tsconfig.json](../tsconfig.json) | TypeScript static-check configuration | strict, `noEmit`, ESNext/Bundler module settings | high
- [chatrealm.config.json](../chatrealm.config.json) | default JSON runtime config | contains `api`, base URL, model, cwd, and a non-empty API key value | high
- [README.md](../README.md) and [README.zh.md](../README.zh.md) | user-facing behavior and limitation docs | current README update was intentionally skipped by user request; treat architecture docs as the fresher source for protocol structure | medium
- [src/main.ts](../src/main.ts) | runtime composition root | imports cli/config/session/agent/transport-factory/tools/errors and passes `config.api` into transport creation | high
- [src/config/config.ts](../src/config/config.ts) | config loader | validates required `api` from `CHATREALM_API` or JSON config, plus API key, base URL, model, and cwd overrides | high
- [src/ai/types.ts](../src/ai/types.ts) | internal chat protocol contract | defines `SUPPORTED_CHAT_APIS`, `ChatApi`, messages, tools, usage, `ChatTransport`, and stream event types | high
- [src/ai/transport-factory.ts](../src/ai/transport-factory.ts) | AI adapter selection layer | maps `openai-completions`, `openai-responses`, and `anthropic-messages` to concrete `ChatTransport` creators | high
- [src/ai/openai-completions.ts](../src/ai/openai-completions.ts) | OpenAI Chat Completions adapter | maps internal requests/messages/tools to `/chat/completions`, parses non-stream and SSE responses, tool calls, stop reasons, and usage | high
- [src/ai/openai-responses.ts](../src/ai/openai-responses.ts) | OpenAI Responses adapter | maps internal requests/messages/tools to `/responses`, uses `store: false`, handles function calls, SSE deltas, stop reasons, and usage | high
- [src/ai/anthropic-messages.ts](../src/ai/anthropic-messages.ts) | Anthropic Messages adapter | maps internal messages/tools to `/messages`, sends `anthropic-version: 2023-06-01`, handles `tool_use`, SSE deltas, stop reasons, and usage | high
- [src/agent/agent-loop.ts](../src/agent/agent-loop.ts) | agent execution hub | owns model turn loop and tool execution while remaining protocol-agnostic through `ChatTransport` | high
- [src/tools/registry.ts](../src/tools/registry.ts) | default tool registry | registers read, search, write, and shell tools | high
- [src/tools/path.ts](../src/tools/path.ts) | cwd path guard | rejects absolute paths and paths escaping cwd | high
- [src/session/store.ts](../src/session/store.ts) | session file format and persistence | strict parser for user/assistant/tool result messages and usage fields | high
- [test/transport-factory.test.ts](../test/transport-factory.test.ts) | factory coverage | verifies all three `api` values select the expected endpoint and transport | high
- [test/api-selection.test.ts](../test/api-selection.test.ts) | CLI integration coverage | runs `bin/chatrealm.mjs -p` against mocked HTTP servers and verifies config-driven endpoint/header selection for all three protocols | high
- [test/openai-completions.test.ts](../test/openai-completions.test.ts), [test/openai-responses.test.ts](../test/openai-responses.test.ts), and [test/anthropic-messages.test.ts](../test/anthropic-messages.test.ts) | adapter coverage | verify request conversion, response conversion, streaming, tool calls, stop reasons, and usage normalization | high
- [session-store-smoke.ts](../session-store-smoke.ts) | ad-hoc session smoke script | validates basic session load/save path behavior | medium

## Relationships
- [package.json](../package.json) | depends_on | [bin/chatrealm.mjs](../bin/chatrealm.mjs) | explicit | `bin.chatrealm` points to executable shim | high
- [bin/chatrealm.mjs](../bin/chatrealm.mjs) | depends_on | [src/main.ts](../src/main.ts) | explicit | `mainPath` spawn target | high
- [bin/chatrealm.mjs](../bin/chatrealm.mjs) | depends_on | `tsx` dependency | explicit | resolves `tsx` loader through `createRequire` | high
- [src/main.ts](../src/main.ts) | depends_on | [src/cli/args.ts](../src/cli/args.ts), [src/cli/interactive.ts](../src/cli/interactive.ts), [src/config/config.ts](../src/config/config.ts), [src/session/store.ts](../src/session/store.ts), [src/agent/run-prompt.ts](../src/agent/run-prompt.ts), [src/ai/transport-factory.ts](../src/ai/transport-factory.ts), [src/tools/registry.ts](../src/tools/registry.ts) | explicit | direct imports | high
- [src/main.ts](../src/main.ts) | impacts | CLI startup, print mode, interactive mode, and transport selection | explicit | mode dispatch and runtime creation live in `main()` | high
- [src/config/config.ts](../src/config/config.ts) | influenced_by | [chatrealm.config.json](../chatrealm.config.json), `CHATREALM_API`, and other `CHATREALM_*` environment variables | explicit | file and env reads | high
- [src/config/config.ts](../src/config/config.ts) | impacts | selected `ChatApi`, provider base URL, API key, model, and agent cwd | explicit | returned config consumed by [src/main.ts](../src/main.ts) | high
- [src/ai/types.ts](../src/ai/types.ts) | depended_on_by | [src/config/config.ts](../src/config/config.ts), [src/ai/transport-factory.ts](../src/ai/transport-factory.ts), adapter modules, and agent modules | explicit | shared type imports | high
- [src/ai/transport-factory.ts](../src/ai/transport-factory.ts) | depends_on | [src/ai/openai-completions.ts](../src/ai/openai-completions.ts), [src/ai/openai-responses.ts](../src/ai/openai-responses.ts), [src/ai/anthropic-messages.ts](../src/ai/anthropic-messages.ts) | explicit | imports concrete creators | high
- [src/ai/transport-factory.ts](../src/ai/transport-factory.ts) | impacts | runtime adapter selection for all model calls | explicit | called from [src/main.ts](../src/main.ts) | high
- [src/agent/run-prompt.ts](../src/agent/run-prompt.ts) | depends_on | [src/agent/agent-loop.ts](../src/agent/agent-loop.ts), [src/agent/prompt.ts](../src/agent/prompt.ts), [src/agent/state.ts](../src/agent/state.ts), [src/session/store.ts](../src/session/store.ts) | explicit | direct imports | high
- [src/agent/agent-loop.ts](../src/agent/agent-loop.ts) | depends_on | [src/ai/types.ts](../src/ai/types.ts) and [src/tools/registry.ts](../src/tools/registry.ts) | explicit | uses `ChatTransport`, `ChatRequest`, and `ToolRegistry` only | high
- [src/agent/agent-loop.ts](../src/agent/agent-loop.ts) | impacts | all model/tool execution behavior | explicit | loop executes before final answer | high
- [src/ai/openai-completions.ts](../src/ai/openai-completions.ts), [src/ai/openai-responses.ts](../src/ai/openai-responses.ts), [src/ai/anthropic-messages.ts](../src/ai/anthropic-messages.ts) | depends_on | [src/ai/types.ts](../src/ai/types.ts) and [src/utils/json.ts](../src/utils/json.ts) | explicit | type imports and JSON parser calls | high
- [src/tools/registry.ts](../src/tools/registry.ts) | depends_on | [src/tools/read-file.ts](../src/tools/read-file.ts), [src/tools/search.ts](../src/tools/search.ts), [src/tools/write-file.ts](../src/tools/write-file.ts), [src/tools/shell.ts](../src/tools/shell.ts) | explicit | default registry imports | high
- [src/tools/read-file.ts](../src/tools/read-file.ts), [src/tools/write-file.ts](../src/tools/write-file.ts), [src/tools/search.ts](../src/tools/search.ts) | depends_on | [src/tools/path.ts](../src/tools/path.ts) | explicit | `resolveInsideCwd` imports | high
- [src/session/store.ts](../src/session/store.ts) | impacts | persisted context across CLI runs | explicit | reads/writes `<cwd>/.chatrealm/sessions/default.json` | high
- [test/transport-factory.test.ts](../test/transport-factory.test.ts) | depends_on | [src/ai/transport-factory.ts](../src/ai/transport-factory.ts) | explicit | imports and verifies selection | high
- [test/api-selection.test.ts](../test/api-selection.test.ts) | depends_on | [bin/chatrealm.mjs](../bin/chatrealm.mjs) | explicit | spawns CLI bin script | high
- [test/interactive-streaming.test.ts](../test/interactive-streaming.test.ts) | depends_on | [bin/chatrealm.mjs](../bin/chatrealm.mjs) | explicit | spawns CLI bin script for interactive streaming | high

## Flows
- CLI executable startup | [package.json](../package.json) -> [bin/chatrealm.mjs](../bin/chatrealm.mjs) -> `tsx` loader -> [src/main.ts](../src/main.ts) | high
- adapter selection | [src/config/config.ts](../src/config/config.ts) -> `ChatApi` in [src/ai/types.ts](../src/ai/types.ts) -> [src/main.ts](../src/main.ts) runtime -> [src/ai/transport-factory.ts](../src/ai/transport-factory.ts) -> selected adapter | high
- print prompt flow | [src/main.ts](../src/main.ts) -> [src/cli/args.ts](../src/cli/args.ts) -> [src/config/config.ts](../src/config/config.ts) -> [src/session/store.ts](../src/session/store.ts) -> [src/ai/transport-factory.ts](../src/ai/transport-factory.ts) -> [src/agent/run-prompt.ts](../src/agent/run-prompt.ts) -> [src/agent/agent-loop.ts](../src/agent/agent-loop.ts) -> selected `ChatTransport` -> session save -> stdout | high
- interactive flow | [src/main.ts](../src/main.ts) -> [src/cli/interactive.ts](../src/cli/interactive.ts) -> readline loop -> [src/agent/run-prompt.ts](../src/agent/run-prompt.ts) -> provider streaming or final text output | high
- tool execution flow | provider tool call -> [src/agent/agent-loop.ts](../src/agent/agent-loop.ts) -> [src/tools/registry.ts](../src/tools/registry.ts) -> concrete tool -> tool result message -> next provider request | high
- OpenAI Completions non-stream/stream flow | [src/ai/openai-completions.ts](../src/ai/openai-completions.ts) -> POST `/chat/completions` -> parse JSON or SSE response -> internal `AssistantMessage` and stream events | high
- OpenAI Responses non-stream/stream flow | [src/ai/openai-responses.ts](../src/ai/openai-responses.ts) -> POST `/responses` with `store: false` -> parse output items or SSE events -> internal text/tool calls/usage | high
- Anthropic Messages non-stream/stream flow | [src/ai/anthropic-messages.ts](../src/ai/anthropic-messages.ts) -> POST `/messages` with `anthropic-version: 2023-06-01` -> parse content blocks or SSE events -> internal text/tool calls/usage | high
- session persistence flow | [src/session/store.ts](../src/session/store.ts) -> `<cwd>/.chatrealm/sessions/default.json` -> strict parse on next run | high
- test flow | [package.json](../package.json) `test:unit` -> `node --import tsx --test "test/**/*.test.ts"` -> focused tests under [test/](../test/) | high

## Recommended Next Reads
- [src/main.ts](../src/main.ts) | best first read for runtime composition, mode dispatch, and transport creation.
- [src/config/config.ts](../src/config/config.ts) | confirms config/env precedence and required `api` validation.
- [src/ai/types.ts](../src/ai/types.ts) | defines supported APIs and the provider-neutral message, tool, usage, and transport contract.
- [src/ai/transport-factory.ts](../src/ai/transport-factory.ts) | explains config-driven adapter selection.
- [src/ai/openai-completions.ts](../src/ai/openai-completions.ts), [src/ai/openai-responses.ts](../src/ai/openai-responses.ts), and [src/ai/anthropic-messages.ts](../src/ai/anthropic-messages.ts) | explain protocol-specific request/response and streaming adaptation.
- [src/agent/agent-loop.ts](../src/agent/agent-loop.ts) | explains model/tool turn loop and max-turn behavior.
- [src/session/store.ts](../src/session/store.ts) | explains persisted session schema and compatibility checks.
- [test/api-selection.test.ts](../test/api-selection.test.ts), [test/transport-factory.test.ts](../test/transport-factory.test.ts), and [test/interactive-streaming.test.ts](../test/interactive-streaming.test.ts) | show highest-value verified protocol-selection behavior.

## Risks And Unknowns
- [chatrealm.config.json](../chatrealm.config.json) | contains a non-empty API key value in the default config file; do not propagate the secret value in docs, logs, or commits | best confirming file: [src/config/config.ts](../src/config/config.ts) | high
- [README.md](../README.md) and [README.zh.md](../README.zh.md) | user-facing docs were intentionally not updated for the multi-protocol work; users may not discover `api` support from README alone | best confirming files: this architecture index and [src/config/config.ts](../src/config/config.ts) | medium
- [src/main.ts](../src/main.ts) | `--provider` still only accepts `openai-compatible`; protocol selection is controlled separately by config `api` | best confirming file: [src/main.ts](../src/main.ts) | medium
- [src/tools/write-file.ts](../src/tools/write-file.ts) and [src/tools/shell.ts](../src/tools/shell.ts) | write and shell tools have no approval or policy layer; README lists this as a current limitation | best confirming file: [README.md](../README.md) | high
- [package.json](../package.json) | `main` points to `index.js`, but the scanned source tree does not contain that file; installed bin works, package import may not | best confirming file: future packaging contract | medium
- [tsconfig.json](../tsconfig.json) | includes `tool-smoke.ts`, but current file scan found [session-store-smoke.ts](../session-store-smoke.ts) instead; this may be stale config | best confirming file: intended smoke script list | medium
- [test/](../test/) | tests cover config, adapter selection, adapters, agent loop, session, registry, and interactive streaming, but concrete read/write/search/shell tool implementations are still not directly covered | best confirming file: future tool tests | medium
- [.chatrealm/](../.chatrealm/) | runtime session data may contain prompts, tool output, and model responses; treat it as local state, not architecture source | best confirming file: [src/session/store.ts](../src/session/store.ts) | high
