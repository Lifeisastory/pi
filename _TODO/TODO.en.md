# MVP Agent Implementation Plan

## Artifact Metadata

- Artifact: project-todo
- Language: English
- Canonical: true
- Project type: greenfield TypeScript CLI application
- Reference project: pi monorepo architecture index

## Project Summary

Build a minimal but real coding agent inspired by `pi`. The MVP project is `ChatRealm`. It should run from a terminal, accept a user prompt, call an LLM provider, optionally use a small set of local tools, maintain a simple conversation state, and print useful results. The goal is learning by rebuilding the core architecture in small steps, not cloning every production feature.

## Scope

### In Scope

- TypeScript CLI application.
- Print mode first: `agent "your task"` or `agent -p "your task"`.
- Minimal LLM adapter abstraction.
- One OpenAI-compatible chat/completions provider.
- Agent loop with tool-call support.
- A small tool registry with filesystem read, filesystem write, grep/search, and shell command tools.
- JSON session persistence for basic conversation history.
- Basic config loading from environment variables and a local config file.
- Focused tests for parser, tool registry, and agent loop behavior.

### Out of Scope

- Full TUI.
- RPC mode.
- Plugin marketplace or skill system.
- Multi-provider production registry.
- Streaming renderer.
- Session compaction.
- Image generation.
- Binary packaging.

## Planned Structure

```text
ChatRealm/
  package.json
  tsconfig.json
  src/
    main.ts
    cli/
      args.ts
    config/
      config.ts
    ai/
      types.ts
      openai-compatible.ts
    agent/
      agent.ts
      agent-loop.ts
      state.ts
      prompt.ts
    tools/
      types.ts
      registry.ts
      read-file.ts
      write-file.ts
      search.ts
      shell.ts
    session/
      store.ts
    utils/
      errors.ts
      json.ts
  test/
    cli-args.test.ts
    tool-registry.test.ts
    agent-loop.test.ts
```

## Ordered TODO Items

### TODO-001: Scaffold TypeScript CLI Project

- Status: completed
- Goal: Create a minimal standalone TypeScript CLI project that can be installed, type-checked, and executed locally before any agent logic exists.
- Scope:
  - Created the `ChatRealm/` project directory.
  - Added npm package metadata and scripts.
  - Added a strict TypeScript configuration.
  - Added the first `src/main.ts` CLI entrypoint.
  - Made the CLI print a placeholder message and exit successfully.
  - Do not implement argument parsing, config loading, provider calls, tools, sessions, or tests yet.
- Likely files or areas: `ChatRealm/package.json`, `ChatRealm/tsconfig.json`, `ChatRealm/src/main.ts`, optional `ChatRealm/README.md`
- Dependencies: none
- Suggested package choices:
  - Runtime: Node.js with TypeScript.
  - Module system: ESM.
  - Direct dependencies: none for this TODO unless your local runner requires one.
  - Dev dependencies: `typescript` and one TypeScript runner such as `tsx`.
- Step-by-step implementation guide:
  1. Create the project folder.
     - From the repository root, create `mvp-agent/`.
     - All files for this learning project should live under `mvp-agent/`.
  2. Initialize npm metadata.
     - Run `npm init -y` inside `mvp-agent/`, or create `package.json` manually.
     - Set a clear package name such as `mvp-agent`.
     - Set `"type": "module"` so Node treats generated JavaScript as ESM.
     - Keep `"private": true` because this MVP is not ready to publish.
  3. Install development dependencies.
     - From `mvp-agent/`, install TypeScript tooling with `npm install --save-dev --ignore-scripts typescript tsx`.
     - Do not add runtime dependencies in TODO-001.
  4. Add npm scripts to `package.json`.
     - Add `"check": "tsc --noEmit"`.
     - Add `"dev": "tsx src/main.ts"`.
     - Add `"start": "tsx src/main.ts"`.
     - For now, `dev` and `start` can be the same because there is no build output yet.
  5. Create `tsconfig.json`.
     - Use strict TypeScript settings.
     - Set `target` to a modern Node-compatible value such as `ES2022`.
     - Set `module` and `moduleResolution` to Node ESM-compatible values.
     - Include only `src/**/*.ts` for now.
     - Do not configure test files yet.
     - Recommended starting content:
       ```json
       {
         "compilerOptions": {
           "target": "ES2022",
           "module": "NodeNext",
           "moduleResolution": "NodeNext",
           "strict": true,
           "noEmit": true,
           "esModuleInterop": true,
           "forceConsistentCasingInFileNames": true,
           "skipLibCheck": true
         },
         "include": ["src/**/*.ts"]
       }
       ```
     - Field explanations:
       - `target`: tells TypeScript which JavaScript language level to type-check against. `ES2022` is a good baseline for modern Node.
       - `module`: tells TypeScript how modules are interpreted. `NodeNext` matches Node's modern ESM behavior.
       - `moduleResolution`: tells TypeScript how to find imported files and packages. Use `NodeNext` together with `module: NodeNext`.
       - `strict`: enables the important TypeScript safety checks. Keep this on from the start.
       - `noEmit`: prevents `tsc` from generating JavaScript files. In this MVP step, `tsx` runs the `.ts` file directly.
       - `esModuleInterop`: makes CommonJS package interop smoother later.
       - `forceConsistentCasingInFileNames`: catches path casing mistakes that may work on Windows but fail on Linux/macOS.
       - `skipLibCheck`: skips type-checking dependency declaration files, which keeps beginner feedback focused on your own code.
       - `include`: limits TypeScript checking to source files under `src/`.
     - Important beginner rule:
       - `tsconfig.json` does not run your program. It only configures how TypeScript checks your program.
       - `npm run check` uses this file through `tsc --noEmit`.
       - `npm run dev` uses `tsx src/main.ts` to run the program.
  6. Create the source directory.
     - Create `src/`.
     - Create `src/main.ts`.
  7. Add the first CLI entrypoint.
     - In `src/main.ts`, print a single placeholder line.
     - Keep the file simple; `console.log("mvp-agent: ready");` is enough.
     - Do not read `process.argv` yet; TODO-002 will add argument parsing.
  8. Run the first verification.
     - Run `npm run check`.
     - Run `npm run dev`.
     - Run `npm start`.
     - Fix any TypeScript or script errors before moving on.
  9. Inspect the final scaffold.
     - Confirm the folder contains only the minimum files needed for this TODO.
     - Expected files are `package.json`, `package-lock.json`, `tsconfig.json`, `src/main.ts`, and `node_modules/` after install.
     - `node_modules/` should exist locally but should not be committed in a real git project.
- Minimal expected file contents:
  - `package.json` should contain package metadata, `"type": "module"`, `"private": true`, and the three scripts above.
  - `tsconfig.json` should enable strict type checking and include `src/**/*.ts`.
  - `src/main.ts` should only print the placeholder message.
- Beginner notes:
  - `package.json` describes how npm runs the project.
  - `tsconfig.json` tells TypeScript how strict to be and which files to check.
  - `tsx` lets Node run `.ts` files directly during development.
  - `tsc --noEmit` checks types without creating JavaScript output files.
  - ESM means using modern `import` and `export` syntax later.
- Required npm scripts:
  - `check`: run TypeScript type checking without emitting files.
  - `dev`: run `src/main.ts` directly for local development.
  - `start`: run the CLI entrypoint in the same placeholder mode for now.
- Implementation notes:
  - Keep `src/main.ts` intentionally small.
  - The placeholder output should make it obvious the binary is alive, for example `mvp-agent: ready`.
  - Avoid adding CLI parsing now; TODO-002 owns that.
  - Avoid adding AI/config/tool abstractions now; later TODOs own those boundaries.
- Acceptance criteria:
  - `npm install --ignore-scripts` succeeds from inside `mvp-agent/`.
  - `npm run check` succeeds.
  - `npm run dev` prints the placeholder message and exits with code 0.
  - `npm start` prints the placeholder message and exits with code 0.
  - `package.json` uses ESM via `"type": "module"`.
  - `tsconfig.json` has strict type checking enabled.
  - The project has no unused placeholder modules or broad abstractions.
  - The files created are limited to the scaffold needed for this TODO.
- Reviewer checklist:
  - Confirm the project is standalone and does not depend on the parent `pi` workspace.
  - Confirm TypeScript strict mode is enabled.
  - Confirm there are no dynamic imports or non-erasable TypeScript syntax.
  - Confirm the scaffold leaves clean extension points for TODO-002 without pre-implementing it.

### TODO-002: Implement CLI Argument Parsing

- Status: in_progress
- Goal: Teach the CLI to understand user input from the terminal without starting any real agent logic yet.
- Scope:
  - Add a small argument parser in `src/cli/args.ts`.
  - Support prompt input through `-p "text"` and `--prompt "text"`.
  - Support prompt input through positional text, for example `npm run dev -- "say hi"`.
  - Support optional flags: `--model`, `--provider`, and `--cwd`.
  - Support `--help` and `-h`.
  - Update `src/main.ts` to call the parser and print the parsed result.
  - Do not load config, call an LLM, run tools, or persist sessions.
- Likely files or areas: `ChatRealm/src/cli/args.ts`, `ChatRealm/src/main.ts`
- Dependencies: TODO-001
- Step-by-step implementation guide:
  1. Create the CLI folder.
     - Create `src/cli/`.
     - Create `src/cli/args.ts`.
  2. Define the parsed argument type.
     - Add an exported interface named `ParsedArgs`.
     - It should contain:
       - `prompt: string | undefined`
       - `model: string | undefined`
       - `provider: string | undefined`
       - `cwd: string | undefined`
       - `help: boolean`
     - Use `undefined` for values the user did not provide.
     - Put this type near the top of `src/cli/args.ts`.
     - Recommended code:
       ```ts
       export interface ParsedArgs {
         prompt: string | undefined;
         model: string | undefined;
         provider: string | undefined;
         cwd: string | undefined;
         help: boolean;
       }
       ```
     - Why this interface exists:
       - The parser receives raw strings from the terminal.
       - The rest of the program should not work with raw strings directly.
       - `ParsedArgs` is the clean shape that later code can trust.
     - Why each field exists:
       - `prompt`: the user's task text, for example `write a greeting`.
       - `model`: optional model override, for example `gpt-4.1-mini`.
       - `provider`: optional provider override, for example `openai-compatible`.
       - `cwd`: optional working directory override.
       - `help`: whether the user requested help output.
     - Why use `string | undefined`:
       - `string` means the user provided a value.
       - `undefined` means the user did not provide that option.
       - This is clearer than using an empty string because an empty string can also be a real user input.
     - Why `help` is only `boolean`:
       - Help is either requested or not requested.
       - It does not need a string value.
     - What not to do:
       - Do not use `any`.
       - Do not make every field optional with `?` in this TODO; explicit `undefined` makes the parser result easier to inspect while learning.
       - Do not put runtime logic inside the interface. Interfaces are TypeScript-only type declarations.
  3. Define a parser function.
     - Export a function named `parseArgs`.
     - Suggested signature: `parseArgs(argv: string[]): ParsedArgs`.
     - The input should be only the user arguments, not the full `process.argv`.
     - Later, `main.ts` can call it with `process.argv.slice(2)`.
     - Recommended function skeleton:
       ```ts
       export function parseArgs(argv: string[]): ParsedArgs {
         const parsed: ParsedArgs = {
           prompt: undefined,
           model: undefined,
           provider: undefined,
           cwd: undefined,
           help: false,
         };

         return parsed;
       }
       ```
     - What `argv` means:
       - `argv` is short for "argument vector".
       - It is just an array of strings.
       - For `npm run dev -- --prompt "hello"`, the parser should receive `["--prompt", "hello"]`.
       - For `npm run dev -- write a greeting`, the parser should receive `["write", "a", "greeting"]`.
     - Why `parseArgs` should not read `process.argv` directly:
       - A pure function is easier to understand.
       - A pure function is easier to test later.
       - `main.ts` owns Node-specific details like `process.argv`.
       - `args.ts` should only know how to transform `string[]` into `ParsedArgs`.
     - How this function should evolve in later steps:
       - Start with the skeleton above.
       - Step 4 adds `--help` and `-h`.
       - Step 5 adds flags with values.
       - Step 6 adds positional prompt handling.
       - Step 7 adds unknown flag errors.
     - Beginner debugging tip:
       - While building the parser, you can temporarily add `console.log(argv)` in `main.ts`, not inside the final parser.
       - Remove temporary debug output before asking for review.
     - What not to do:
       - Do not make `parseArgs` async; no I/O is needed.
       - Do not mutate `process.argv`.
       - Do not exit the process from inside `parseArgs`.
       - Do not print help text from inside `parseArgs`; it should only return data or throw an error.
  4. Handle boolean help flags first.
     - If an argument is `--help` or `-h`, set `help: true`.
     - Help can appear together with other arguments, but `main.ts` should show help and stop.
     - Recommended approach:
       - Use a `for` loop over `argv`.
       - Read the current argument into a variable such as `arg`.
       - If `arg === "--help" || arg === "-h"`, set `parsed.help = true`.
       - Continue the loop so other arguments can still be scanned.
     - Example code shape:
       ```ts
       for (let index = 0; index < argv.length; index += 1) {
         const arg = argv[index];

         if (arg === "--help" || arg === "-h") {
           parsed.help = true;
           continue;
         }
       }
       ```
     - Why handle help early:
       - Help does not need a following value.
       - Help should be accepted even if the user only runs `--help`.
       - `main.ts` can later decide to print usage and skip normal execution.
     - Expected examples:
       - `parseArgs(["--help"])` should produce `help: true`.
       - `parseArgs(["-h"])` should produce `help: true`.
       - `parseArgs(["--help", "--model", "demo"])` should still produce `help: true`.
     - What not to do:
       - Do not call `console.log` here.
       - Do not call `process.exit` here.
       - Do not return early just because help is present; later steps can still parse the rest consistently.
  5. Handle value flags.
     - `-p` and `--prompt` consume the next argument as the prompt text.
     - `--model` consumes the next argument as the model.
     - `--provider` consumes the next argument as the provider.
     - `--cwd` consumes the next argument as the cwd.
     - If a value flag is missing its value, throw an `Error` with a clear message, for example `Missing value for --model`.
     - A value flag is an option that must be followed by another argument.
       - In `["--model", "demo-model"]`, `--model` is the flag and `demo-model` is its value.
       - In `["-p", "hello"]`, `-p` is the flag and `hello` is its value.
     - Add a small helper inside `parseArgs` to read the next value:
       ```ts
       const readValue = (flag: string, index: number): string => {
         const value = argv[index + 1];

         if (value === undefined) {
           throw new Error(`Missing value for ${flag}`);
         }

         return value;
       };
       ```
     - Then use it inside the loop:
       ```ts
       if (arg === "-p" || arg === "--prompt") {
         parsed.prompt = readValue(arg, index);
         index += 1;
         continue;
       }

       if (arg === "--model") {
         parsed.model = readValue(arg, index);
         index += 1;
         continue;
       }
       ```
     - Why `index += 1` is needed:
       - The next array item has already been consumed as this flag's value.
       - Without `index += 1`, the loop would later treat the value as a positional prompt.
     - Repeat the same pattern for:
       - `--provider`
       - `--cwd`
     - Missing value examples that should throw:
       - `parseArgs(["--model"])`
       - `parseArgs(["--provider"])`
       - `parseArgs(["--cwd"])`
       - `parseArgs(["-p"])`
     - Beginner edge case:
       - For this MVP, if the next value starts with `-`, you may still accept it as the value.
       - Example: `--prompt --help` can parse prompt as `"--help"`.
       - This keeps the first parser simple. More advanced validation can come later.
     - What not to do:
       - Do not silently ignore missing values.
       - Do not default missing values to an empty string.
       - Do not put provider/model defaults here; config loading belongs to TODO-003.
       - Do not support `--model=demo` yet unless you intentionally document it. Space-separated values are enough for this TODO.
  6. Handle positional prompt text.
     - Any argument that is not a known flag should become part of the positional prompt.
     - Join positional prompt parts with a single space.
     - Example: `["write", "a", "haiku"]` becomes `prompt: "write a haiku"`.
     - If `-p/--prompt` was already provided, prefer the explicit prompt and ignore positional prompt for now.
  7. Handle unknown flags.
     - If an argument starts with `-` and is not supported, throw an `Error`.
     - Example message: `Unknown option: --bad`.
  8. Add a help text function.
     - Export a function named `getHelpText`.
     - It should return a short usage string showing supported flags.
     - Keep it plain text.
  9. Update `src/main.ts`.
     - Import `parseArgs` and `getHelpText`.
     - Call `parseArgs(process.argv.slice(2))`.
     - If `help` is true, print the help text and exit normally.
     - Otherwise print the parsed object with `console.log(JSON.stringify(parsed, null, 2));`.
     - Wrap parsing in `try/catch`; on parse errors, print the error message and set `process.exitCode = 1`.
  10. Run manual checks.
      - `npm run check`
      - `npm run dev -- --help`
      - `npm run dev -- -p "hello"`
      - `npm run dev -- --prompt "hello" --model demo-model --provider demo --cwd .`
      - `npm run dev -- write a short greeting`
      - `npm run dev -- --bad`
- Beginner notes:
  - `process.argv` is the raw argument list from Node.
  - `process.argv.slice(2)` removes the Node executable path and script path, leaving only user input.
  - npm requires `--` before passing arguments to your script. Example: `npm run dev -- --help`.
  - A parser should turn messy terminal strings into a clean object the rest of the program can use.
- Acceptance criteria:
  - `npm run check` succeeds.
  - `npm run dev -- --help` prints usage text and exits with code 0.
  - `npm run dev -- -p "hello"` prints JSON with `"prompt": "hello"`.
  - `npm run dev -- --prompt "hello" --model demo-model --provider demo --cwd .` prints all provided values.
  - `npm run dev -- write a short greeting` prints JSON with `"prompt": "write a short greeting"`.
  - `npm run dev -- --bad` prints a clear unknown option error and exits with non-zero status.
  - Missing flag values produce clear errors.
  - No config loading, LLM calls, tools, sessions, or tests are added in this TODO.
- Reviewer checklist:
  - Confirm parser logic is isolated in `src/cli/args.ts`.
  - Confirm `main.ts` only wires parser output for now.
  - Confirm there is no `any`.
  - Confirm the implementation does not use dynamic imports.
  - Confirm the parser is deterministic and easy to test in TODO-014.

### TODO-003: Add Configuration Loading

- Status: pending
- Scope: Load API key, base URL, model, and default working directory from environment variables and an optional local config file.
- Likely files or areas: `src/config/config.ts`, `src/utils/json.ts`
- Dependencies: TODO-001, TODO-002

### TODO-004: Define AI Transport Types

- Status: pending
- Scope: Define provider-neutral message, tool, tool call, response, usage, and streaming-ready interfaces.
- Likely files or areas: `src/ai/types.ts`
- Dependencies: TODO-001

### TODO-005: Implement OpenAI-Compatible Provider

- Status: pending
- Scope: Implement one provider adapter that sends chat requests and returns assistant messages with optional tool calls.
- Likely files or areas: `src/ai/openai-compatible.ts`, `src/config/config.ts`
- Dependencies: TODO-003, TODO-004

### TODO-006: Define Tool Contracts And Registry

- Status: pending
- Scope: Create the internal tool interface, JSON schema metadata, validation boundary, and registry lookup.
- Likely files or areas: `src/tools/types.ts`, `src/tools/registry.ts`, `test/tool-registry.test.ts`
- Dependencies: TODO-004

### TODO-007: Implement Read And Search Tools

- Status: pending
- Scope: Add read-file and search tools with path normalization, cwd confinement, clear errors, and concise output.
- Likely files or areas: `src/tools/read-file.ts`, `src/tools/search.ts`, `src/tools/registry.ts`
- Dependencies: TODO-006

### TODO-008: Implement Write And Shell Tools

- Status: pending
- Scope: Add write-file and shell command tools with explicit safety boundaries and result objects.
- Likely files or areas: `src/tools/write-file.ts`, `src/tools/shell.ts`, `src/tools/registry.ts`
- Dependencies: TODO-006, TODO-007

### TODO-009: Build Minimal Agent State

- Status: pending
- Scope: Store messages, tool results, current cwd, selected model, and run metadata in memory.
- Likely files or areas: `src/agent/state.ts`, `src/agent/prompt.ts`
- Dependencies: TODO-004, TODO-006

### TODO-010: Implement Agent Loop

- Status: pending
- Scope: Run the prompt, call the model, execute requested tools, append tool results, and continue until a final assistant answer or max turns.
- Likely files or areas: `src/agent/agent-loop.ts`, `src/agent/agent.ts`, `test/agent-loop.test.ts`
- Dependencies: TODO-005, TODO-006, TODO-009

### TODO-011: Wire Print Mode End To End

- Status: pending
- Scope: Connect CLI args, config, provider, tool registry, and agent loop so one command can complete a task.
- Likely files or areas: `src/main.ts`, `src/agent/agent.ts`
- Dependencies: TODO-002, TODO-003, TODO-005, TODO-010

### TODO-012: Add JSON Session Persistence

- Status: pending
- Scope: Save and load conversation state under a local session directory for follow-up runs.
- Likely files or areas: `src/session/store.ts`, `src/agent/state.ts`, `src/main.ts`
- Dependencies: TODO-009, TODO-011

### TODO-013: Add Error Handling And User-Facing Output

- Status: pending
- Scope: Normalize provider errors, tool errors, JSON parse errors, and CLI usage errors into concise terminal output.
- Likely files or areas: `src/utils/errors.ts`, `src/main.ts`, `src/agent/agent-loop.ts`
- Dependencies: TODO-011

### TODO-014: Add Focused MVP Tests

- Status: pending
- Scope: Cover CLI parsing, registry lookup, fake-provider agent loop, max-turn handling, and tool error propagation.
- Likely files or areas: `test/cli-args.test.ts`, `test/tool-registry.test.ts`, `test/agent-loop.test.ts`
- Dependencies: TODO-002, TODO-006, TODO-010, TODO-013

### TODO-015: Write MVP Usage Documentation

- Status: pending
- Scope: Document setup, environment variables, example commands, current limitations, and the next architecture milestones.
- Likely files or areas: `README.md`
- Dependencies: TODO-011, TODO-014

## Dependencies Between TODO Items

- TODO-001 must be first.
- TODO-002 and TODO-003 prepare executable configuration.
- TODO-004 and TODO-005 create the AI boundary.
- TODO-006 through TODO-008 create the tool boundary.
- TODO-009 and TODO-010 create the core agent behavior.
- TODO-011 produces the first usable MVP.
- TODO-012 through TODO-015 harden and document the MVP.

## Next Executable Item

- TODO-002: Implement CLI Argument Parsing

## Assumptions

- The MVP is being built as the separate `ChatRealm` learning project under the current workspace.
- TypeScript is the preferred stack because `pi` is TypeScript-based and the architecture lessons transfer directly.
- The first usable agent should prioritize print mode over TUI because it exposes the real agent loop with much less UI complexity.
- Tool execution should be local and explicit; remote sandboxes, approval systems, and plugin loading are deferred.

## Risks

- Tool-call response formats differ across providers; the MVP should start with one OpenAI-compatible API.
- Shell and write-file tools can be unsafe if exposed too early; path confinement and clear command output should be implemented before broad use.
- A full TUI can distract from learning the agent architecture; it should wait until the core loop is understood.
