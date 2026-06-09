# MVP Agent 实现计划

## 工件元数据

- 工件：project-todo
- 语言：中文
- 规范版本：false
- 项目类型：全新的 TypeScript CLI 应用
- 参考项目：pi monorepo 架构索引

## 项目摘要

构建一个受 `pi` 启发的最小但真实可用的 coding agent。MVP 项目是 `ChatRealm`。它应能从终端运行，接收用户提示词，调用 LLM provider，可选地使用一小组本地工具，维护简单的对话状态，并打印有用结果。目标是通过小步骤重建核心架构来学习，而不是克隆所有生产级功能。

## 范围

### 范围内

- TypeScript CLI 应用。
- 优先实现打印模式：`agent "your task"` 或 `agent -p "your task"`。
- 最小 LLM adapter 抽象。
- 一个 OpenAI 兼容的 chat/completions provider。
- 支持 tool-call 的 agent loop。
- 一个小型工具注册表，包含文件系统读取、文件系统写入、 grep/search 和 shell 命令工具。
- 使用 JSON session 持久化基础对话历史。
- 从环境变量和本地配置文件加载基础配置。
- 针对 parser、tool registry 和 agent loop 行为的聚焦测试。

### 范围外

- 完整 TUI。
- RPC 模式。
- 插件市场或 skill 系统。
- 生产级多 provider registry。
- 流式渲染器。
- session 压缩。
- 图像生成。
- 二进制打包。

## 计划结构

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

## 有序 TODO 项

### TODO-001：搭建 TypeScript CLI 项目骨架

- 状态：completed
- 目标：创建一个最小的独立 TypeScript CLI 项目，使其在任何 agent 逻辑存在之前就可以本地安装、类型检查并执行。
- 范围：
  - 创建 `ChatRealm/` 项目目录。
  - 添加 npm package 元数据和脚本。
  - 添加严格的 TypeScript 配置。
  - 添加第一个 `src/main.ts` CLI 入口点。
  - 让 CLI 打印占位消息并成功退出。
  - 暂不实现参数解析、配置加载、provider 调用、工具、session 或测试。
- 可能涉及的文件或区域：`ChatRealm/package.json`、`ChatRealm/tsconfig.json`、`ChatRealm/src/main.ts`、可选的 `ChatRealm/README.md`
- 依赖：无
- 建议 package 选择：
  - 运行时：Node.js with TypeScript。
  - 模块系统：ESM。
  - 直接依赖：本 TODO 不需要，除非本地 runner 需要。
  - 开发依赖：`typescript` 和一个 TypeScript runner，例如 `tsx`。
- 分步实现指南：
  1. 创建项目文件夹。
     - 从仓库根目录创建 `mvp-agent/`。
     - 这个学习项目的所有文件都应位于 `mvp-agent/` 下。
  2. 初始化 npm 元数据。
     - 在 `mvp-agent/` 内运行 `npm init -y`，或手动创建 `package.json`。
     - 设置清晰的 package name，例如 `mvp-agent`。
     - 设置 `"type": "module"`，使 Node 将生成的 JavaScript 视为 ESM。
     - 保留 `"private": true`，因为这个 MVP 尚未准备发布。
  3. 安装开发依赖。
     - 从 `mvp-agent/` 安装 TypeScript 工具：`npm install --save-dev --ignore-scripts typescript tsx`。
     - 不要在 TODO-001 添加运行时依赖。
  4. 向 `package.json` 添加 npm scripts。
     - 添加 `"check": "tsc --noEmit"`。
     - 添加 `"dev": "tsx src/main.ts"`。
     - 添加 `"start": "tsx src/main.ts"`。
     - 目前 `dev` 和 `start` 可以相同，因为还没有 build 输出。
  5. 创建 `tsconfig.json`。
     - 使用严格 TypeScript 设置。
     - 将 `target` 设为现代 Node 兼容值，例如 `ES2022`。
     - 将 `module` 和 `moduleResolution` 设为 Node ESM 兼容值。
     - 目前只 include `src/**/*.ts`。
     - 暂不配置测试文件。
     - 推荐起始内容：
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
     - 字段说明：
       - `target`：告诉 TypeScript 按哪个 JavaScript 语言级别进行类型检查。`ES2022` 是现代 Node 的良好基线。
       - `module`：告诉 TypeScript 如何解释模块。`NodeNext` 匹配 Node 的现代 ESM 行为。
       - `moduleResolution`：告诉 TypeScript 如何查找被导入的文件和 package。与 `module: NodeNext` 一起使用 `NodeNext`。
       - `strict`：启用重要的 TypeScript 安全检查。从一开始就保持开启。
       - `noEmit`：阻止 `tsc` 生成 JavaScript 文件。在这个 MVP 步骤中，`tsx` 会直接运行 `.ts` 文件。
       - `esModuleInterop`：让后续 CommonJS package 互操作更顺畅。
       - `forceConsistentCasingInFileNames`：捕获路径大小写错误，这类错误可能在 Windows 可用但在 Linux/macOS 失败。
       - `skipLibCheck`：跳过依赖声明文件的类型检查，让初学者反馈集中在自己的代码上。
       - `include`：将 TypeScript 检查限制到 `src/` 下的源文件。
     - 重要初学者规则：
       - `tsconfig.json` 不运行程序。它只配置 TypeScript 如何检查程序。
       - `npm run check` 通过 `tsc --noEmit` 使用此文件。
       - `npm run dev` 使用 `tsx src/main.ts` 运行程序。
  6. 创建 source 目录。
     - 创建 `src/`。
     - 创建 `src/main.ts`。
  7. 添加第一个 CLI 入口点。
     - 在 `src/main.ts` 中打印一行占位文本。
     - 保持文件简单；`console.log("mvp-agent: ready");` 就足够。
     - 暂不读取 `process.argv`；TODO-002 会添加参数解析。
  8. 运行第一次验证。
     - 运行 `npm run check`。
     - 运行 `npm run dev`。
     - 运行 `npm start`。
     - 在继续之前修复所有 TypeScript 或脚本错误。
  9. 检查最终骨架。
     - 确认文件夹只包含本 TODO 所需的最小文件。
     - 预期文件为 `package.json`、`package-lock.json`、`tsconfig.json`、`src/main.ts`，安装后还有 `node_modules/`。
     - `node_modules/` 应存在于本地，但在真实 git 项目中不应提交。
- 最小预期文件内容：
  - `package.json` 应包含 package 元数据、`"type": "module"`、`"private": true` 和上面的三个 scripts。
  - `tsconfig.json` 应启用严格类型检查并 include `src/**/*.ts`。
  - `src/main.ts` 应只打印占位消息。
- 初学者说明：
  - `package.json` 描述 npm 如何运行项目。
  - `tsconfig.json` 告诉 TypeScript 严格程度以及检查哪些文件。
  - `tsx` 允许 Node 在开发期间直接运行 `.ts` 文件。
  - `tsc --noEmit` 检查类型但不创建 JavaScript 输出文件。
  - ESM 表示后续使用现代 `import` 和 `export` 语法。
- 必需 npm scripts：
  - `check`：运行 TypeScript 类型检查，不输出文件。
  - `dev`：直接运行 `src/main.ts` 进行本地开发。
  - `start`：目前以相同的占位模式运行 CLI 入口点。
- 实现说明：
  - 保持 `src/main.ts` 有意精简。
  - 占位输出应明显表明 binary 已启动，例如 `mvp-agent: ready`。
  - 现在避免添加 CLI parsing；TODO-002 负责它。
  - 现在避免添加 AI/config/tool 抽象；后续 TODO 负责这些边界。
- 验收标准：
  - 在 `mvp-agent/` 内执行 `npm install --ignore-scripts` 成功。
  - `npm run check` 成功。
  - `npm run dev` 打印占位消息并以 exit code 0 退出。
  - `npm start` 打印占位消息并以 exit code 0 退出。
  - `package.json` 通过 `"type": "module"` 使用 ESM。
  - `tsconfig.json` 已启用严格类型检查。
  - 项目没有未使用的占位模块或宽泛抽象。
  - 创建的文件仅限于本 TODO 所需的骨架。
- Reviewer checklist：
  - 确认项目是独立的，不依赖父级 `pi` workspace。
  - 确认 TypeScript strict mode 已启用。
  - 确认没有 dynamic imports 或 non-erasable TypeScript 语法。
  - 确认骨架为 TODO-002 留出干净扩展点，但没有提前实现它。

### TODO-002：实现 CLI 参数解析

- 状态：completed
- 目标：让 CLI 能理解来自终端的用户输入，但暂不启动任何真实 agent 逻辑。
- 范围：

  - 在 `src/cli/args.ts` 添加一个小型参数 parser。
  - 支持通过 `-p "text"` 和 `--prompt "text"` 输入 prompt。
  - 支持通过位置文本输入 prompt，例如 `npm run dev -- "say hi"`。
  - 支持可选 flags：`--model`、`--provider` 和 `--cwd`。
  - 支持 `--help` 和 `-h`。
  - 更新 `src/main.ts` 调用 parser 并打印解析结果。
  - 不要加载配置、调用 LLM、运行工具或持久化 session。
- 可能涉及的文件或区域：`ChatRealm/src/cli/args.ts`、`ChatRealm/src/main.ts`
- 依赖：TODO-001
- 分步实现指南：

  1. 创建 CLI 文件夹。
     - 创建 `src/cli/`。
     - 创建 `src/cli/args.ts`。
  2. 定义解析后的参数类型。
     - 添加一个导出的 interface，命名为 `ParsedArgs`。
     - 它应包含：
       - `prompt: string | undefined`
       - `model: string | undefined`
       - `provider: string | undefined`
       - `cwd: string | undefined`
       - `help: boolean`
     - 对用户未提供的值使用 `undefined`。
     - 将此类型放在 `src/cli/args.ts` 顶部附近。
     - 推荐代码：
       ```ts
       export interface ParsedArgs {
         prompt: string | undefined;
         model: string | undefined;
         provider: string | undefined;
         cwd: string | undefined;
         help: boolean;
       }
       ```
     - 为什么需要这个 interface：
       - parser 接收来自终端的原始字符串。
       - 程序其余部分不应直接处理原始字符串。
       - `ParsedArgs` 是后续代码可以信任的干净形状。
     - 每个字段存在的原因：
       - `prompt`：用户的任务文本，例如 `write a greeting`。
       - `model`：可选 model override，例如 `gpt-4.1-mini`。
       - `provider`：可选 provider override，例如 `openai-compatible`。
       - `cwd`：可选工作目录 override。
       - `help`：用户是否请求 help 输出。
     - 为什么使用 `string | undefined`：
       - `string` 表示用户提供了值。
       - `undefined` 表示用户没有提供该选项。
       - 这比使用空字符串更清晰，因为空字符串也可能是真实用户输入。
     - 为什么 `help` 只是 `boolean`：
       - Help 只有请求或未请求两种状态。
       - 它不需要字符串值。
     - 不要做什么：
       - 不要使用 `any`。
       - 本 TODO 中不要用 `?` 把每个字段都设为 optional；显式 `undefined` 让 parser 结果在学习时更易检查。
       - 不要把运行时逻辑放进 interface。Interfaces 是 TypeScript-only 类型声明。
  3. 定义 parser 函数。
     - 导出名为 `parseArgs` 的函数。
     - 建议签名：`parseArgs(argv: string[]): ParsedArgs`。
     - 输入应只包含用户参数，而不是完整 `process.argv`。
     - 后续 `main.ts` 可以用 `process.argv.slice(2)` 调用它。
     - 推荐函数骨架：
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
     - `argv` 的含义：
       - `argv` 是 "argument vector" 的缩写。
       - 它只是一个字符串数组。
       - 对于 `npm run dev -- --prompt "hello"`，parser 应接收 `["--prompt", "hello"]`。
       - 对于 `npm run dev -- write a greeting`，parser 应接收 `["write", "a", "greeting"]`。
     - 为什么 `parseArgs` 不应直接读取 `process.argv`：
       - 纯函数更容易理解。
       - 纯函数更容易后续测试。
       - `main.ts` 负责 `process.argv` 等 Node-specific 细节。
       - `args.ts` 只应知道如何将 `string[]` 转换为 `ParsedArgs`。
     - 此函数在后续步骤中如何演进：
       - 从上面的骨架开始。
       - Step 4 添加 `--help` 和 `-h`。
       - Step 5 添加带值 flags。
       - Step 6 添加位置 prompt 处理。
       - Step 7 添加 unknown flag 错误。
     - 初学者调试提示：
       - 构建 parser 时，可以临时在 `main.ts` 添加 `console.log(argv)`，不要放在最终 parser 内。
       - 请求 review 前删除临时 debug 输出。
     - 不要做什么：
       - 不要让 `parseArgs` 变成 async；这里不需要 I/O。
       - 不要修改 `process.argv`。
       - 不要从 `parseArgs` 内退出进程。
       - 不要从 `parseArgs` 内打印 help text；它应只返回数据或抛出错误。
  4. 先处理 boolean help flags。
     - 如果参数是 `--help` 或 `-h`，设置 `help: true`。
     - Help 可以和其他参数同时出现，但 `main.ts` 应展示 help 并停止。
     - 推荐方式：
       - 使用 `for` 循环遍历 `argv`。
       - 将当前参数读取到变量中，例如 `arg`。
       - 如果 `arg === "--help" || arg === "-h"`，设置 `parsed.help = true`。
       - 继续循环，让其他参数仍可被扫描。
     - 示例代码形状：
       ```ts
       for (let index = 0; index < argv.length; index += 1) {
         const arg = argv[index];

         if (arg === "--help" || arg === "-h") {
           parsed.help = true;
           continue;
         }
       }
       ```
     - 为什么要早处理 help：
       - Help 不需要后续值。
       - 即使用户只运行 `--help`，help 也应被接受。
       - `main.ts` 后续可以决定打印 usage 并跳过正常执行。
     - 预期示例：
       - `parseArgs(["--help"])` 应产生 `help: true`。
       - `parseArgs(["-h"])` 应产生 `help: true`。
       - `parseArgs(["--help", "--model", "demo"])` 仍应产生 `help: true`。
     - 不要做什么：
       - 不要在这里调用 `console.log`。
       - 不要在这里调用 `process.exit`。
       - 不要因为出现 help 就提前 return；后续步骤仍可一致地解析剩余内容。
  5. 处理带值 flags。
     - `-p` 和 `--prompt` 消费下一个参数作为 prompt 文本。
     - `--model` 消费下一个参数作为 model。
     - `--provider` 消费下一个参数作为 provider。
     - `--cwd` 消费下一个参数作为 cwd。
     - 如果带值 flag 缺少值，抛出带清晰消息的 `Error`，例如 `Missing value for --model`。
     - 带值 flag 是必须跟随另一个参数的选项。
       - 在 `["--model", "demo-model"]` 中，`--model` 是 flag，`demo-model` 是它的值。
       - 在 `["-p", "hello"]` 中，`-p` 是 flag，`hello` 是它的值。
     - 在 `parseArgs` 内添加一个小 helper 读取下一个值：
       ```ts
       	const readValue = (flag: string, index: number): string => {
         const value = argv[index + 1];

         if (value === undefined) {
           throw new Error(`Missing value for ${flag}`);
         }

         return value;
       };
       ```
     - 然后在循环内使用它：
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
     - 为什么需要 `index += 1`：
       - 下一个数组项已作为此 flag 的值被消费。
       - 没有 `index += 1`，循环后续会把该值当作位置 prompt。
     - 对以下 flags 重复相同模式：
       - `--provider`
       - `--cwd`
     - 应抛错的缺失值示例：
       - `parseArgs(["--model"])`
       - `parseArgs(["--provider"])`
       - `parseArgs(["--cwd"])`
       - `parseArgs(["-p"])`
     - 初学者边界情况：
       - 对此 MVP 来说，如果下一个值以 `-` 开头，也可以仍接受它作为值。
       - 示例：`--prompt --help` 可以将 prompt 解析为 `"--help"`。
       - 这让第一个 parser 保持简单。更高级的校验可之后再加。
     - 不要做什么：
       - 不要静默忽略缺失值。
       - 不要把缺失值默认成空字符串。
       - 不要在这里放 provider/model defaults；配置加载属于 TODO-003。
       - 除非有意文档化，否则暂不支持 `--model=demo`。本 TODO 中空格分隔值已足够。
  6. 处理位置 prompt 文本。
     - 任何不是已知 flag 的参数都应成为位置 prompt 的一部分。
     - 用单个空格连接位置 prompt 片段。
     - 示例：`["write", "a", "haiku"]` 变成 `prompt: "write a haiku"`。
     - 如果已经通过 `-p/--prompt` 提供 prompt，目前优先使用显式 prompt，并忽略位置 prompt。
     - “位置参数”是什么意思：
       - 位置参数就是没有跟在某个 flag 名字后面的参数。
       - 在 `agent --model demo write a greeting` 中，`--model` 是 flag，`demo` 是这个 flag 的值，`write`、`a`、`greeting` 是位置 prompt 片段。
       - 在 `agent "write a greeting"` 中，整个 `"write a greeting"` 字符串就是一个位置参数。
     - 添加一个本地数组收集位置片段：
       ```ts
       const positionalParts: string[] = [];
       ```
     - 把这个数组放在 `parseArgs` 顶部附近，在 `parsed` 对象之后、循环之前。
     - 在循环内部，所有已知 flag 检查都完成之后，把当前参数当成位置文本：
       ```ts
       positionalParts.push(arg);
       ```
     - 到达循环里的这个位置时，`arg` 可以安全收集，因为：
       - `--help` 和 `-h` 已经执行了 `continue`。
       - `--model demo` 这类带值 flag 已经消费了自己的值，并执行了 `continue`。
       - 已知 flag 已经被处理完。
     - 循环结束后，把收集到的片段转换成最终 prompt：
       ```ts
       if (parsed.prompt === undefined && positionalParts.length > 0) {
         parsed.prompt = positionalParts.join(" ");
       }
       ```
     - 为什么要在循环结束后处理：
       - parser 需要先看完所有参数，才知道完整的位置参数有哪些。
       - 最后只 join 一次，比在循环里不断修改 `parsed.prompt` 更简单。
       - 这样显式 prompt 也更容易处理：`-p "hello"` 优先于位置文本。
     - 为什么检查 `parsed.prompt === undefined`：
       - `-p` 和 `--prompt` 是用户显式选择。
       - 本 MVP 中，显式 prompt 应优先于位置文本。
       - 示例：`agent -p "hello" ignored words` 目前应保留 `prompt: "hello"`。
     - 手动推演示例：
       - `parseArgs(["write", "a", "haiku"])` 应返回 `prompt: "write a haiku"`。
       - `parseArgs(["--model", "demo", "write", "a", "haiku"])` 应返回 `model: "demo"` 和 `prompt: "write a haiku"`。
       - `parseArgs(["-p", "hello", "ignored"])` 应返回 `prompt: "hello"`。
       - `parseArgs([])` 应保持 `prompt: undefined`。
     - 初学者调试提示：
       - 如果某个 flag 的值意外出现在 prompt 里，检查读取该 flag 值后是否忘了 `index += 1`。
       - 如果所有位置文本都消失了，检查 `positionalParts.push(arg)` 是否放在某个会跳过它的 `continue` 之前。
     - 不要做什么：
       - 不要直接 join 整个 `argv`；那会意外包含 `--model` 这类 flags。
       - 不要让位置文本覆盖 `-p` 或 `--prompt`。
       - 暂时不要 trim 或校验 prompt，除非你有意记录这个行为。
       - 不要在这里添加 config defaults；parser 只应反映用户实际输入。
  7. 处理 unknown flags。
     - 如果参数以 `-` 开头且不受支持，抛出 `Error`。
     - 示例消息：`Unknown option: --bad`。
     - 为什么需要这一步：
       - 如果不处理 unknown flag，像 `--modle demo` 这样的拼写错误会被当成位置 prompt 文本。
       - 这会掩盖用户输入错误，让 CLI 行为变得不可预测。
       - CLI 遇到不认识的选项时，应尽早失败。
     - 这个检查放在哪里：
       - 放在 `for` 循环内部。
       - 放在所有已支持 flag 的判断之后。
       - 放在 `positionalParts.push(arg)` 之前。
     - 顺序应类似这样：
       ```ts
       for (let index = 0; index < argv.length; index += 1) {
         const arg = argv[index];

         if (arg === "--help" || arg === "-h") {
           parsed.help = true;
           continue;
         }

         if (arg === "-p" || arg === "--prompt") {
           parsed.prompt = readValue(arg, index);
           index += 1;
           continue;
         }

         // 其他已知 flags 放在这里。

         if (arg.startsWith("-")) {
           throw new Error(`Unknown option: ${arg}`);
         }

         positionalParts.push(arg);
       }
       ```
     - 为什么本 MVP 中 `startsWith("-")` 就够用：
       - CLI flags 通常以 `-` 开头，例如 `-p` 或 `--model`。
       - 位置 prompt 文本通常不以 `-` 开头。
       - 这个简单规则能捕获常见错误，同时避免引入复杂 parser。
     - 重要边界情况：
       - 在这个 MVP 中，如果位置 prompt 文本以 `-` 开头，会被拒绝。
       - 示例：`agent explain --not-a-real-flag` 应抛出 `Unknown option: --not-a-real-flag`。
       - 如果用户确实需要传入以 `-` 开头的 prompt 文本，可以使用 `-p "--not-a-real-flag"`，因为第 5 步允许 flag 的值以 `-` 开头。
     - 手动示例：
       - `parseArgs(["--bad"])` 应抛出 `Unknown option: --bad`。
       - `parseArgs(["--model", "demo", "--bad"])` 应抛出 `Unknown option: --bad`。
       - `parseArgs(["write", "--bad"])` 应抛出 `Unknown option: --bad`。
       - `parseArgs(["-p", "--bad"])` 应返回 `prompt: "--bad"`，因为 `--bad` 是被 `-p` 消费的值。
       - `parseArgs(["--prompt", "--bad"])` 也应返回 `prompt: "--bad"`，原因相同。
     - 在 `main.ts` 已接入 parser 输出后如何验证：
       - `npm run dev -- -- --bad`
       - 预期终端输出应包含 `Unknown option: --bad`。
       - 进程应以非零状态退出，因为 `main.ts` 在 `catch` 中设置了 `process.exitCode = 1`。
     - 初学者调试提示：
       - 如果 `--bad` 出现在打印的 JSON prompt 里，unknown flag 检查很可能放在了 `positionalParts.push(arg)` 之后，或根本没写。
       - 如果 `-p --bad` 抛出 unknown option 错误，unknown flag 检查很可能在 `-p` 分支消费值之前运行了。
     - 不要做什么：
       - 不要静默忽略 unknown flags。
       - 不要把 unknown flags 加进 `positionalParts`。
       - 不要添加 TODO 中没有列出的别名。
       - 暂时不要引入第三方参数解析库；目标是先理解机制。
  8. 添加 help text 函数。
     - 从 `src/cli/args.ts` 导出名为 `getHelpText` 的函数。
     - 让它和 `parseArgs` 保持分离：`parseArgs` 负责解析输入，`getHelpText` 负责返回展示文本。
     - 本 TODO 中，这个函数不应打印、不应退出进程、不应读取文件，也不需要接收参数。
     - 使用字符串数组加 `join("\n")`，这样 Markdown 代码块更容易阅读。
     - 推荐实现：

       ```ts
       export function getHelpText(): string {
         return [
           "Usage:",
           "  agent [options] [prompt]",
           "",
           "Options:",
           "  -p, --prompt <text>     Prompt text to send to the agent",
           "  --model <name>          Model name override",
           "  --provider <name>       Provider name override",
           "  --cwd <path>            Working directory override",
           "  -h, --help              Show help",
         ].join("\n");
       }
       ```
     - 在这段 usage text 中，`[options]` 和 `[prompt]` 表示这些部分是可选的。
     - Help text 只记录 TODO-002 已经存在的功能。暂时不要提配置文件、LLM 调用、工具、session 或未来模式。
     - Step 9 会在 `main.ts` 中这样使用它：

       ```ts
       if (parsed.help) {
         console.log(getHelpText());
         return;
       }
       ```
     - Step 9 接好 `main.ts` 后的手动检查：

       - `npm run dev -- -- --help` 应打印 help text，而不是 JSON。
       - `npm run dev -- -- -h` 应打印相同的 help text。
       - Help 输出应成功退出。
     - 初学者检查：

       - 如果 TypeScript 报字符串未结束，确认数组里的每个字符串都有成对引号。
       - 如果 `--help` 仍打印 JSON，确认 `main.ts` 在打印解析对象之前先检查 `parsed.help`。
       - 如果 help text 记录了某个 flag，这个 flag 应该已经被 `parseArgs` 支持。
  9. 更新 `src/main.ts`。
     - 导入 `parseArgs` 和 `getHelpText`。
     - 调用 `parseArgs(process.argv.slice(2))`。
     - 如果 `help` 为 true，打印 help text 并正常退出。
     - 否则使用 `console.log(JSON.stringify(parsed, null, 2));` 打印解析对象。
     - 用 `try/catch` 包裹 parsing；遇到 parse errors 时打印错误消息并设置 `process.exitCode = 1`。
  10. 运行手动检查。
      - `npm run check`
      - `npm run dev -- --help`
      - `npm run dev -- -p "hello"`
      - `npm run dev -- --prompt "hello" --model demo-model --provider demo --cwd .`
      - `npm run dev -- write a short greeting`
      - `npm run dev -- --bad`
- 初学者说明：

  - `process.argv` 是来自 Node 的原始参数列表。
  - `process.argv.slice(2)` 移除 Node 可执行文件路径和脚本路径，只留下用户输入。
  - npm 需要用 `--` 将参数传给脚本。示例：`npm run dev -- --help`。
  - parser 应将杂乱的终端字符串转换为程序其余部分可使用的干净对象。
- 验收标准：

  - `npm run check` 成功。
  - `npm run dev -- --help` 打印 usage text 并以 exit code 0 退出。
  - `npm run dev -- -p "hello"` 打印包含 `"prompt": "hello"` 的 JSON。
  - `npm run dev -- --prompt "hello" --model demo-model --provider demo --cwd .` 打印所有提供的值。
  - `npm run dev -- write a short greeting` 打印包含 `"prompt": "write a short greeting"` 的 JSON。
  - `npm run dev -- --bad` 打印清晰的 unknown option 错误并以非零状态退出。
  - 缺失 flag 值时产生清晰错误。
  - 本 TODO 不添加配置加载、LLM 调用、工具、session 或测试。
- Reviewer checklist：

  - 确认 parser 逻辑隔离在 `src/cli/args.ts`。
  - 确认 `main.ts` 目前只连接 parser 输出。
  - 确认没有 `any`。
  - 确认实现没有使用 dynamic imports。
  - 确认 parser 是确定性的，且在 TODO-014 中易于测试。

### TODO-003：添加配置加载

- 状态：pending
- 目标：添加一个小型配置层，让后续 TODO 可以获取 provider 设置，而不需要在业务代码里直接读取环境变量或 JSON 文件。
- 范围：
  - 创建 `src/config/config.ts`。
  - 创建 `src/utils/json.ts`。
  - 从环境变量加载配置。
  - 从可选本地 JSON 配置文件加载配置。
  - 用清晰的优先级合并配置值。
  - 提供默认工作目录。
  - 暂不调用 LLM、不创建 provider 对象、不运行工具、不持久化 session、不添加测试。
- 可能涉及的文件或区域：`src/config/config.ts`、`src/utils/json.ts`
- 依赖：TODO-001、TODO-002
- 配置来源设计：
  - 本地配置文件名：`chatrealm.config.json`。
  - 默认查找位置：当前工作目录。
  - 可选配置路径 override：`CHATREALM_CONFIG`。
  - 环境变量：
    - `CHATREALM_API_KEY`
    - `CHATREALM_BASE_URL`
    - `CHATREALM_MODEL`
    - `CHATREALM_CWD`
  - JSON 配置 keys：
    - `apiKey`
    - `baseUrl`
    - `model`
    - `cwd`
  - 优先级：
    - 环境变量覆盖配置文件值。
    - 配置文件值覆盖内置默认值。
    - 未提供 `cwd` 时默认使用 `process.cwd()`。
    - API key、base URL 和 model 目前可以保持 `undefined`；TODO-005 或 TODO-011 再决定它们什么时候必须存在。
- 分步实现指南：
  1. 创建文件夹。
     - 创建 `src/config/`。
     - 创建 `src/utils/`。
     - 创建 `src/config/config.ts`。
     - 创建 `src/utils/json.ts`。
  2. 在 `src/config/config.ts` 中定义配置类型。
     - 导出名为 `AppConfig` 的 interface。
     - 对可选 provider 设置使用显式的 `string | undefined`。
     - `cwd` 保持必需的 `string`，因为程序应始终有一个工作目录。
     - 推荐形状：
       ```ts
       export interface AppConfig {
         apiKey: string | undefined;
         baseUrl: string | undefined;
         model: string | undefined;
         cwd: string;
       }
       ```
     - 为什么 `cwd` 不是 optional：
       - 后续文件工具会需要工作目录。
       - 如果用户没有提供，`process.cwd()` 是合理默认值。
  3. 定义一个小型 load-options 类型。
     - 导出名为 `LoadConfigOptions` 的 interface。
     - 这会让 loader 更容易手动验证，后续也更容易测试。
     - 暂时避免使用 `NodeJS.ProcessEnv`，这样本学习步骤不需要额外理解 Node 类型细节。
     - 推荐形状：
       ```ts
       export interface LoadConfigOptions {
         env?: Record<string, string | undefined>;
         cwd?: string;
       }
       ```
     - `env` 让测试或手动检查以后可以传入假的环境变量。
     - `cwd` 让调用方选择从哪里查找 `chatrealm.config.json`。
  4. 在 `src/utils/json.ts` 中添加 JSON object parser。
     - 导出名为 `parseJsonObject` 的函数。
     - 它应接收 `text: string` 和 `sourceName: string`。
     - 它应返回 `Record<string, unknown>`。
     - 如果 JSON 解析失败，或解析结果不是 object，应抛出清晰错误。
     - 从这个函数骨架开始：

       ```ts
       export function parseJsonObject(
         text: string,
         sourceName: string,
       ): Record<string, unknown> {
         // Implementation goes here.
       }
       ```
     - 在 `try/catch` 中解析 JSON。
     - 将解析结果保存在一个类型为 `unknown` 的变量中。
     - 使用 `unknown`，因为文件内容可能是任何东西：object、array、string、number、`true`、`false` 或 `null`。
     - 推荐解析代码：

       ```ts
       let parsed: unknown;

       try {
         parsed = JSON.parse(text);
       } catch {
         throw new Error(`Invalid JSON in ${sourceName}`);
       }
       ```
     - 解析后，验证这个值是普通 JSON object。
     - 这个检查需要三部分：

       - `typeof parsed === "object"` 确认它像 object。
       - `parsed !== null` 排除 `null`，因为 JavaScript 中 `typeof null` 的结果也是 `"object"`。
       - `!Array.isArray(parsed)` 排除数组，因为数组在 JavaScript 中也是 object，但本 TODO 中它不是有效 config object。
     - 推荐 object 检查：

       ```ts
       if (
         typeof parsed !== "object" ||
         parsed === null ||
         Array.isArray(parsed)
       ) {
         throw new Error(`Expected JSON object in ${sourceName}`);
       }

       return parsed as Record<string, unknown>;
       ```
     - 为什么这里可以使用最后的类型断言：

       - 运行时检查已经证明它是非 null object，且不是数组。
       - TypeScript 仍然不知道它的每个 key 都映射到 `unknown`。
       - `Record<string, unknown>` 是安全形状，因为每个值仍未被信任。
       - Step 5 会在把值当成 string 使用前，逐个验证字段值。
     - 完整推荐实现：

       ```ts
       export function parseJsonObject(
         text: string,
         sourceName: string,
       ): Record<string, unknown> {
         let parsed: unknown;

         try {
           parsed = JSON.parse(text);
         } catch {
           throw new Error(`Invalid JSON in ${sourceName}`);
         }

         if (
           typeof parsed !== "object" ||
           parsed === null ||
           Array.isArray(parsed)
         ) {
           throw new Error(`Expected JSON object in ${sourceName}`);
         }

         return parsed as Record<string, unknown>;
       }
       ```
     - 手动推演示例：

       - `parseJsonObject("{\"model\":\"demo\"}", "chatrealm.config.json")` 应成功。
       - `parseJsonObject("{", "chatrealm.config.json")` 应抛出 `Invalid JSON in chatrealm.config.json`。
       - `parseJsonObject("null", "chatrealm.config.json")` 应抛出 `Expected JSON object in chatrealm.config.json`。
       - `parseJsonObject("[]", "chatrealm.config.json")` 应抛出 `Expected JSON object in chatrealm.config.json`。
       - `parseJsonObject("\"hello\"", "chatrealm.config.json")` 应抛出 `Expected JSON object in chatrealm.config.json`。
     - 不要做什么：

       - 不要直接返回 `JSON.parse` 的原始结果。
       - 不要使用 `any`。
       - JSON 无效时不要静默返回 `{}`。
       - 不要在这个函数中验证 `apiKey`、`baseUrl`、`model` 或 `cwd`；Step 5 负责字段值级别的验证。
  5. 添加读取可选 string keys 的 helper。
     - 在 `src/utils/json.ts` 中导出名为 `readOptionalString` 的函数。
     - 建议签名：

       ```ts
       export function readOptionalString(
         object: Record<string, unknown>,
         key: string,
         sourceName: string,
       ): string | undefined
       ```
     - 如果 key 不存在，返回 `undefined`。
     - 如果值是 string，返回它。
     - 如果值存在但不是 string，抛出清晰错误，例如 `Expected string for model in chatrealm.config.json`。
     - 不要使用 `any`。
     - 为什么需要这个 helper：

       - `parseJsonObject` 只证明了整个 JSON 文件是一个 object。
       - 它不能证明 `object.model`、`object.apiKey` 或其他字段一定是 string。
       - JSON 文件是外部输入，所以 TypeScript 不能信任里面的内容。
       - 这个 helper 把“检查可选 string 字段”的逻辑集中到一个小函数里，后面可以重复使用。
     - 这里的“可选 string”是什么意思：

       - key 可以不存在。例如：`{ "model": "demo" }` 里面没有 `apiKey`。
       - 如果 key 不存在，loader 应该把这个值当作“未配置”，并返回 `undefined`。
       - 如果 key 存在，那么它的值必须是 string。
       - `undefined` 表示“没有提供”；对于可选配置项来说，这不是错误。
     - 把这个函数添加在 `src/utils/json.ts` 的 `parseJsonObject` 下面。
     - 推荐实现：

       ```ts
       export function readOptionalString(
         object: Record<string, unknown>,
         key: string,
         sourceName: string,
       ): string | undefined {
         const value = object[key];

         if (value === undefined) {
           return undefined;
         }

         if (typeof value !== "string") {
           throw new Error(`Expected string for ${key} in ${sourceName}`);
         }

         return value;
       }
       ```
     - 从上到下读这段代码：

       - `const value = object[key];` 是从 JSON object 里读取一个属性。
       - `object[key]` 叫方括号属性访问。这里使用它，是因为 `key` 是一个变量。
       - 如果 `key` 是 `"model"`，那么 `object[key]` 就等价于 `object.model`。
       - `value === undefined` 表示 JSON object 没有这个 key，或者这个 key 的值实际是 `undefined`。
       - JSON 文件本身不能自然写出 `undefined`，所以在这个 TODO 里可以把它理解为“缺失”。
       - `typeof value !== "string"` 会拦截 number、boolean、array、object、`null` 等无效值。
       - 通过这个检查之后，TypeScript 就能理解 `value` 是一个 `string`。
       - 最后返回 `value` 是安全的，因为非 string 值已经被前面的检查拒绝了。
     - 为什么函数需要 `sourceName`：

       - 错误消息应该告诉用户坏值来自哪里。
       - `Expected string for model in chatrealm.config.json` 比 `Invalid config` 更容易定位和修复。
       - 后续如果配置可以来自其他文件，同一个 helper 仍然能产生有用的错误消息。
     - 为什么返回类型是 `string | undefined`：

       - `string` 表示配置文件提供了合法值。
       - `undefined` 表示配置文件没有提供这个 key。
       - 不要用空字符串作为默认值，因为空字符串可能掩盖配置错误。
     - 手动推理几个例子：

       - `readOptionalString({ model: "demo" }, "model", "chatrealm.config.json")` 应该返回 `"demo"`。
       - `readOptionalString({}, "model", "chatrealm.config.json")` 应该返回 `undefined`。
       - `readOptionalString({ model: 123 }, "model", "chatrealm.config.json")` 应该抛出 `Expected string for model in chatrealm.config.json`。
       - `readOptionalString({ model: null }, "model", "chatrealm.config.json")` 应该抛出 `Expected string for model in chatrealm.config.json`。
       - `readOptionalString({ model: ["demo"] }, "model", "chatrealm.config.json")` 应该抛出 `Expected string for model in chatrealm.config.json`。
     - 初学者检查点：

       - 如果 TypeScript 说 `object` 有 implicit `any` 类型，确认参数写的是 `object: Record<string, unknown>`。
       - 如果 TypeScript 说 `key` 有 implicit `any` 类型，确认参数写的是 `key: string`。
       - 如果 TypeScript 说函数缺少返回值，确认每个分支都 `return` 或 `throw`。
       - 如果错误消息打印了错误的字段名，确认模板字符串里使用的是 `${key}`。
       - 模板字符串使用反引号，不是普通引号：`` `Expected string for ${key} in ${sourceName}` ``。
     - 不要这样做：

       - 不要写 `return object[key] as string`；这会跳过运行时校验。
       - 不要使用 `String(value)`；它会悄悄把 `123` 变成 `"123"`，从而隐藏错误配置。
       - key 缺失时不要返回 `""`；请返回 `undefined`。
       - 不要在这个 helper 里验证字符串是不是有效 API key、URL、model name 或路径。
       - 不要在这个 helper 里读文件；读文件属于 `loadConfig` 的职责。
  6. 在 `src/config/config.ts` 中实现配置文件加载。
     - 在文件顶部导入 Node built-ins：

       ```ts
       import { existsSync, readFileSync } from "node:fs";
       import { resolve } from "node:path";
       ```
     - 从 `../utils/json.js` 导入 JSON helpers。
     - 在 `loadConfig` 内确定：

       - `env`：默认使用 `process.env`。
       - `cwd`：默认使用 `process.cwd()`。
       - `configPath`：如果存在 `env.CHATREALM_CONFIG` 就用它，否则使用 `resolve(cwd, "chatrealm.config.json")`。
     - 如果配置文件存在，以 UTF-8 读取并解析。
     - 如果配置文件不存在，继续使用空对象。
     - 本 TODO 不创建配置文件。
     - 为什么需要这一步：

       - 后续代码应该只调用一个函数 `loadConfig`，而不是到处都知道配置文件放在哪里。
       - 这样可以把文件系统细节限制在 `src/config/config.ts` 里。
       - 也可以避免 provider、agent、tool 代码直接读取环境变量。
     - 把 imports 放在 `src/config/config.ts` 文件最顶部。
     - 从 `../utils/json.js` 导入 Step 4 和 Step 5 里的两个 helper：

       ```ts
       import { parseJsonObject, readOptionalString } from "../utils/json.js";
       ```
     - 为什么导入路径以 `.js` 结尾：

       - 这个 TypeScript 项目使用 Node ESM 设置。
       - 在 Node ESM 风格的 TypeScript 中，本地相对导入应该写运行时的 `.js` 扩展名。
       - 源文件仍然是 `json.ts`；开发时 TypeScript 能理解 `../utils/json.js` 指向它。
     - 在 `src/config/config.ts` 的 interfaces 下面添加 `loadConfig` 函数。
     - 推荐起始骨架：

       ```ts
       export function loadConfig(options: LoadConfigOptions = {}): AppConfig {
         const env = options.env ?? process.env;
         const cwd = options.cwd ?? process.cwd();
         const configPath = env.CHATREALM_CONFIG ?? resolve(cwd, "chatrealm.config.json");

         let fileConfig: Record<string, unknown> = {};

         if (existsSync(configPath)) {
           const text = readFileSync(configPath, "utf8");
           fileConfig = parseJsonObject(text, configPath);
         }

         const fileApiKey = readOptionalString(fileConfig, "apiKey", configPath);
         const fileBaseUrl = readOptionalString(fileConfig, "baseUrl", configPath);
         const fileModel = readOptionalString(fileConfig, "model", configPath);
         const fileCwd = readOptionalString(fileConfig, "cwd", configPath);

         // Step 7 will merge file values with environment variables.
       }
       ```
     - 这个骨架暂时不会通过 TypeScript，因为它还没有返回 `AppConfig`。

       - 如果你正在第 6 步中间，这是正常的。
       - Step 7 会添加最终的 `const config: AppConfig = ...` 和 `return config`。
       - 如果你希望第 6 步写完后立刻 `npm run check` 通过，可以直接继续写 Step 7 的返回部分，而不是停在注释处。
     - 仔细理解前三个常量：

       - `options.env ?? process.env` 表示：如果调用方传了假的/测试用环境变量，就用它；否则使用真实进程环境变量。
       - `options.cwd ?? process.cwd()` 表示：如果调用方传了工作目录，就用它；否则使用启动命令时所在的目录。
       - `env.CHATREALM_CONFIG ?? resolve(cwd, "chatrealm.config.json")` 表示：如果提供了显式配置路径就用它；否则在 `cwd` 里找 `chatrealm.config.json`。
     - `resolve(cwd, "chatrealm.config.json")` 做了什么：

       - 它把工作目录和配置文件名合成一个路径。
       - 如果 `cwd` 是 `/project/ChatRealm`，结果就是 `/project/ChatRealm/chatrealm.config.json`。
       - 在 Windows 上，结果会是 Windows 风格的绝对路径。
       - 使用 `resolve` 比自己用 `/` 拼字符串更稳。
     - 为什么 `fileConfig` 一开始是 `{}`：

       - 配置文件是可选的。
       - 如果文件不存在，loader 仍然需要一个 object 来读取字段。
       - 从 `{}` 读取可选 key 只会得到 `undefined`。
     - `existsSync(configPath)` 做了什么：

       - 它检查当前是否存在这个文件或路径。
       - 如果返回 `true`，本 TODO 就读取文件。
       - 如果返回 `false`，本 TODO 就跳过读取，并保持 `fileConfig` 为 `{}`。
     - `readFileSync(configPath, "utf8")` 做了什么：

       - 它把整个文件读成文本。
       - `"utf8"` 告诉 Node 按普通文本解码文件，而不是返回原始字节。
       - 同步读取在这里可以接受，因为配置加载只发生在 CLI 启动时一次。
     - `parseJsonObject(text, configPath)` 做了什么：

       - 它把文本解析成 JSON。
       - 它会拒绝非法 JSON。
       - 它也会拒绝不是 object 的合法 JSON，例如 `null`、`[]` 或 `"hello"`。
       - 传入 `configPath` 可以让错误消息指向真实文件路径。
     - 为什么这一步先读取文件值再合并：

       - `fileApiKey`、`fileBaseUrl`、`fileModel`、`fileCwd` 只是 JSON 文件里的值。
       - 它们还不包含环境变量覆盖。
       - 把文件值单独放着，Step 7 的优先级规则会更容易看懂。
     - 手动推理几个例子：

       - 如果配置文件不存在，`fileConfig` 应保持为 `{}`。
       - 如果 `chatrealm.config.json` 包含 `{ "model": "demo-model" }`，那么 `fileModel` 应该是 `"demo-model"`。
       - 如果它包含 `{ "model": 123 }`，`readOptionalString` 应该抛出清晰错误。
       - 如果设置了 `CHATREALM_CONFIG`，loader 应该检查那个路径，而不是 `cwd` 里的默认文件。
     - 初学者检查点：

       - 如果 TypeScript 找不到 `node:fs` 或 `process`，后续可能需要安装 Node types，但不要为了绕过问题而改变这个 TODO 的架构。
       - 如果 TypeScript 报 `loadConfig` 没有返回值，先完成 Step 7 再做最终检查。
       - 如果 TypeScript 找不到 `../utils/json.js`，确认 `src/utils/json.ts` 存在，并且从 `src/config/config.ts` 出发的相对路径正确。
       - 如果配置文件明明存在却没有被读取，可以临时打印或检查 `configPath`，确认 `cwd` 指向哪个目录。
     - 不要这样做：

       - 不要自动创建 `chatrealm.config.json`。
       - 不要 catch 后隐藏 JSON parse 错误。
       - 不要在这一步放默认 model 或 API key。
       - 不要在读取文件的代码块里合并环境变量；Step 7 负责优先级。
       - 不要在 `loadConfig` 里调用 LLM 或创建 provider。
  7. 合并文件值和环境变量值。
     - 从 JSON keys 读取文件值：`apiKey`、`baseUrl`、`model`、`cwd`。
     - 从环境变量读取值：`CHATREALM_API_KEY`、`CHATREALM_BASE_URL`、`CHATREALM_MODEL`、`CHATREALM_CWD`。
     - 环境变量优先于文件值。
     - `cwd` 应回退到 loader 的当前工作目录。
     - 推荐合并形状：
       ```ts
       const config: AppConfig = {
         apiKey: env.CHATREALM_API_KEY ?? fileApiKey,
         baseUrl: env.CHATREALM_BASE_URL ?? fileBaseUrl,
         model: env.CHATREALM_MODEL ?? fileModel,
         cwd: env.CHATREALM_CWD ?? fileCwd ?? cwd,
       };
       ```
     - 返回这个 config object。
  8. 临时接入 `main.ts` 进行手动验证。
     - 导入 `loadConfig`。
     - 在解析 CLI args 并处理 help 之后，调用 `loadConfig()`。
     - 目前打印 parsed args 和 config。
     - 保持简单；TODO-011 会决定 CLI overrides 如何和 config 合并。
     - 示例临时输出形状：
       ```ts
       console.log(JSON.stringify({ args: parsed, config }, null, 2));
       ```
  9. 运行手动检查。
     - `npm run check`
     - `npm run dev -- --help`
     - `npm run dev -- -p "hello"`
     - 创建本地 `chatrealm.config.json`：
       ```json
       {
         "baseUrl": "https://example.test/v1",
         "model": "demo-model",
         "cwd": "."
       }
       ```
     - 运行 `npm run dev -- -p "hello"`，确认打印的 config 包含这些值。
     - 在 PowerShell 中测试环境变量 override：
       ```powershell
       $env:CHATREALM_MODEL = "env-model"
       npm run dev -- -p "hello"
       Remove-Item Env:\CHATREALM_MODEL
       ```
     - 确认 env var 设置期间 `model` 变成 `"env-model"`。
     - 使用无效 JSON 运行一次，确认错误清晰。
  10. 清理手动验证文件。
      - 如果 `chatrealm.config.json` 只是为了手动测试创建的，验证后删除它。
      - 不要提交本地 secrets。
- 初学者说明：
  - 环境变量是 shell 或操作系统提供的字符串。
  - 配置文件适合保存不想每次都输入的值。
  - 不要把真实 API keys 硬编码进源码或提交的配置文件。
  - `process.cwd()` 表示启动命令时所在的目录。
  - `resolve(cwd, "chatrealm.config.json")` 会得到预期配置文件的绝对路径。
  - `??` 表示“如果左边不是 `null` 或 `undefined`，就用左边；否则用右边”。
- 验收标准：
  - `npm run check` 成功。
  - 缺少 `chatrealm.config.json` 时不会崩溃。
  - 有效的 `chatrealm.config.json` 会被加载。
  - 环境变量会覆盖配置文件值。
  - `cwd` 始终有 string 值。
  - 无效 JSON 产生清晰错误。
  - string 字段出现非 string 配置值时产生清晰错误。
  - 本 TODO 不添加 LLM 调用、工具执行、session 或测试。
- Reviewer checklist：
  - 确认配置加载隔离在 `src/config/config.ts`。
  - 确认 JSON parsing helpers 隔离在 `src/utils/json.ts`。
  - 确认没有 `any`。
  - 确认没有提交 secrets。
  - 确认 `main.ts` 只是临时打印 config 用于验证，没有启动 agent 行为。

### TODO-004：定义 AI Transport 类型

- 状态：pending
- 目标：创建后续 OpenAI 兼容 provider、agent loop 和 tools 共享的 provider-neutral TypeScript 类型。
- 范围：
  - 创建 `src/ai/`。
  - 创建 `src/ai/types.ts`。
  - 定义 user、assistant、tool-result message 类型。
  - 定义 assistant 的普通文本内容和 tool call 内容。
  - 定义可以发送给模型的 tool definition 元数据。
  - 定义 provider request 和 response 类型。
  - 定义 usage 和 stop reason 类型。
  - 定义一个 TODO-005 可以实现的最小 transport interface。
  - 定义 streaming-ready event 类型，但暂不实现 streaming。
  - 暂不调用 provider、不执行工具、不构建 agent loop、不添加测试。
- 可能涉及的文件或区域：`src/ai/types.ts`
- 依赖：TODO-001、TODO-003
- 来自 `pi` 的参考：
  - `pi` 在 [packages/ai/src/types.ts](../packages/ai/src/types.ts) 里有更大的同类边界。
  - ChatRealm 保留同样的思想，但做小很多。
  - 这里最重要的不是类型数量，而是把 provider-neutral 应用代码和 provider-specific API 代码分开。
- 分步实现指南：
  1. 创建 AI 文件夹。

     - 创建 `src/ai/`。
     - 创建 `src/ai/types.ts`。
     - 这个文件只放导出的 TypeScript types 和 interfaces。
     - 不要在这个文件里写运行时 provider 代码。
  2. 添加一个小型 JSON value 类型。

     - Tool arguments 和 JSON schema object 需要表达未知 JSON 数据。
     - 不要使用 `any`。
     - 在 `src/ai/types.ts` 顶部附近添加这些类型：

       ```ts
       export type JsonPrimitive = string | number | boolean | null;

       export type JsonValue =
         | JsonPrimitive
         | JsonValue[]
         | { [key: string]: JsonValue };

       export type JsonObject = { [key: string]: JsonValue };
       ```
     - 为什么需要它：

       - LLM tool calls 通常会用 JSON 传递参数。
       - JSON 可以包含 string、number、boolean、null、array 和 object。
       - `JsonValue` 可以表达这个形状，同时避免退回到 `any`。
     - 初学者说明：

       - 这是递归类型。`JsonValue[]` 表示数组里的每一项也都是 JSON value。
       - `{ [key: string]: JsonValue }` 表示 object 的每个 key 都是 string，每个 value 也都是 JSON value。
  3. 定义基础文本内容。

     - 添加 `TextContent` interface：

       ```ts
       export interface TextContent {
         type: "text";
         text: string;
       }
       ```
     - 为什么需要 `type: "text"`：

       - 这是 discriminated union 的标签。
       - 后续代码可以检查 `content.type === "text"`，然后 TypeScript 就知道这个对象有 `text`。
       - Agent 代码经常使用这个模式，因为 message 里可能有不同种类的内容。
  4. 定义 tool-call 内容。

     - 添加 `ToolCallContent` interface：

       ```ts
       export interface ToolCallContent {
         type: "toolCall";
         id: string;
         name: string;
         arguments: JsonObject;
       }
       ```
     - 字段含义：

       - `id`：provider 生成或 adapter 生成的 ID，用来匹配后续 tool result。
       - `name`：tool 名称，例如 `read_file` 或 `search`。
       - `arguments`：已经解析好的 JSON object，后续会传给 tool。
     - 为什么 `arguments` 不是 `string`：

       - Provider API 经常把 tool arguments 作为 JSON string 返回。
       - TODO-005 的 provider adapter 应该解析这个 string。
       - ChatRealm 其他部分应该收到 typed object，而不是原始 JSON 文本。
  5. 把 assistant content 定义成 union。

     - 添加：

       ```ts
       export type AssistantContent = TextContent | ToolCallContent;
       ```
     - 含义：

       - Assistant response 可以包含普通文本。
       - 它也可以请求一个或多个工具。
       - TODO-010 的 agent loop 会检查这个 union，决定打印最终答案还是运行工具。
  6. 定义 usage 和 stop reason。

     - 添加：

       ```ts
       export interface Usage {
         inputTokens: number;
         outputTokens: number;
         totalTokens: number;
       }

       export type StopReason = "stop" | "length" | "toolUse" | "error";
       ```
     - 它们的含义：

       - `Usage` 记录 provider 返回的大致 token 数。
       - `stop` 表示 assistant 正常完成。
       - `length` 表示模型因为 token 限制停止。
       - `toolUse` 表示模型希望 agent 运行工具。
       - `error` 表示 adapter 创建了错误响应，而不是正常答案。
     - MVP 暂不做 cost 统计。
  7. 定义 message 类型。

     - 添加：

       ```ts
       export interface UserMessage {
         role: "user";
         content: string;
       }

       export interface AssistantMessage {
         role: "assistant";
         content: AssistantContent[];
         model: string;
         usage: Usage | undefined;
         stopReason: StopReason;
         errorMessage: string | undefined;
       }

       export interface ToolResultMessage {
         role: "toolResult";
         toolCallId: string;
         toolName: string;
         content: string;
         isError: boolean;
       }

       export type Message = UserMessage | AssistantMessage | ToolResultMessage;
       ```
     - 为什么每个 message 都有字面量 `role`：

       - `role` 告诉后续代码这是哪种 message。
       - TypeScript 可以根据 `message.role` 缩小 union 类型。
       - 例如：执行 `if (message.role === "assistant")` 之后，TypeScript 就知道 `message.content` 是 `AssistantContent[]`。
     - 为什么 `usage` 和 `errorMessage` 显式写 `| undefined`：

       - 有些 provider 可能不返回 usage。
       - 正常响应没有 error message。
       - 这和前面 `ParsedArgs`、`AppConfig` 的风格一致。
  8. 定义 tool definition 元数据。

     - 添加：

       ```ts
       export interface ToolDefinition {
         name: string;
         description: string;
         parameters: JsonObject;
       }
       ```
     - `parameters` 是什么意思：

       - 它是一个类似 JSON schema 的 object，用来描述这个 tool 接受哪些参数。
       - 后续例子：read-file tool 可能声明自己需要一个 `path` string。
       - 本 TODO 不引入 JSON schema library。
     - 为什么它属于 `src/ai/types.ts`：

       - Model provider 需要 tool metadata，才能发送给 API。
       - TODO-006 的 tool registry 后续可以使用兼容的 metadata。
       - 这会形成 AI provider 代码和 tool 代码之间的契约。
  9. 定义 provider request 和 response 类型。

     - 添加：

       ```ts
       export interface ChatRequest {
         model: string;
         systemPrompt: string | undefined;
         messages: Message[];
         tools: ToolDefinition[];
       }

       export interface ChatResponse {
         message: AssistantMessage;
       }
       ```
     - 为什么需要 `ChatRequest`：

       - Agent loop 不应该知道 OpenAI 具体的 HTTP request 形状。
       - 它应该构建 provider-neutral 的 `ChatRequest`。
       - TODO-005 会把 `ChatRequest` 转换成 OpenAI 兼容 API payload。
     - 为什么 `tools` 永远是数组：

       - 空数组表示“没有可用工具”。
       - 这比同时处理 `undefined` 和 array 两种情况更简单。
  10. 定义 transport interface。

      - 添加：

        ```ts
        export interface ChatTransport {
          complete(request: ChatRequest): Promise<ChatResponse>;
        }
        ```
      - 什么是 transport：

        - 它是一个知道如何调用模型 provider 的对象。
        - Agent loop 可以调用 `transport.complete(request)`，而不需要知道 provider 是 OpenAI、本地 fake provider，还是其他东西。
        - TODO-005 会为一个 OpenAI 兼容 provider 实现这个 interface。
      - 为什么 `complete` 返回 `Promise`：

        - Provider 调用需要网络 I/O。
        - JavaScript 里的网络 I/O 是异步的。
        - `Promise<ChatResponse>` 表示这个函数未来会解析成一个 `ChatResponse`。
  11. 添加 streaming-ready event 类型。

      - MVP 暂不 streaming，但现在定义小型 event 类型可以让边界提前准备好。
      - 添加：

        ```ts
        export type ChatStreamEvent =
          | { type: "textDelta"; delta: string }
          | { type: "toolCall"; toolCall: ToolCallContent }
          | { type: "done"; response: ChatResponse }
          | { type: "error"; message: string };
        ```
      - 为什么这是 “streaming-ready”：

        - 后续 provider 可以在文本片段到达时逐段发出事件。
        - 程序其他部分可以处理 events，而不需要修改核心 message 类型。
        - 目前 TODO-005 可以暂时忽略这个类型。
  12. 检查完整预期的 `src/ai/types.ts`。

      - 一个完整的第一版可以长这样：

        ```ts
        export type JsonPrimitive = string | number | boolean | null;

        export type JsonValue =
          | JsonPrimitive
          | JsonValue[]
          | { [key: string]: JsonValue };

        export type JsonObject = { [key: string]: JsonValue };

        export interface TextContent {
          type: "text";
          text: string;
        }

        export interface ToolCallContent {
          type: "toolCall";
          id: string;
          name: string;
          arguments: JsonObject;
        }

        export type AssistantContent = TextContent | ToolCallContent;

        export interface Usage {
          inputTokens: number;
          outputTokens: number;
          totalTokens: number;
        }

        export type StopReason = "stop" | "length" | "toolUse" | "error";

        export interface UserMessage {
          role: "user";
          content: string;
        }

        export interface AssistantMessage {
          role: "assistant";
          content: AssistantContent[];
          model: string;
          usage: Usage | undefined;
          stopReason: StopReason;
          errorMessage: string | undefined;
        }

        export interface ToolResultMessage {
          role: "toolResult";
          toolCallId: string;
          toolName: string;
          content: string;
          isError: boolean;
        }

        export type Message = UserMessage | AssistantMessage | ToolResultMessage;

        export interface ToolDefinition {
          name: string;
          description: string;
          parameters: JsonObject;
        }

        export interface ChatRequest {
          model: string;
          systemPrompt: string | undefined;
          messages: Message[];
          tools: ToolDefinition[];
        }

        export interface ChatResponse {
          message: AssistantMessage;
        }

        export interface ChatTransport {
          complete(request: ChatRequest): Promise<ChatResponse>;
        }

        export type ChatStreamEvent =
          | { type: "textDelta"; delta: string }
          | { type: "toolCall"; toolCall: ToolCallContent }
          | { type: "done"; response: ChatResponse }
          | { type: "error"; message: string };
        ```
  13. 运行验证。

      - 运行 `npm run check`。
      - 如果 TypeScript 报未使用代码，记住导出的 types 即使暂时还没被 import，也可以存在。
      - 如果 checker 报语法错误，检查最近的 union type，确认每一行的 `|`、`{}` 和 `;` 都正确。
- 初学者说明：
  - type 文件描述形状；它不运行行为。
  - `interface` 适合描述 object 形状。
  - `type` 适合描述 union，例如 `"stop" | "length"`。
  - discriminated union 是一种 union，其中每个成员都有字面量标签字段，例如 `role` 或 `type`。
  - `unknown` 表示“我们还不信任这个值”；`JsonValue` 比 `unknown` 更具体，因为它把值限制在 JSON 兼容数据里。
  - `Promise<T>` 表示 async function 未来会产生 `T`。
- 验收标准：
  - `src/ai/types.ts` 存在。
  - `npm run check` 成功。
  - 文件导出了 provider-neutral 的 message、content、tool、usage、request、response、transport 和 stream-event types。
  - 暂不添加 provider-specific HTTP payload 类型。
  - 暂不添加运行时 provider 调用。
  - 不使用 `any`。
  - 不添加新的 runtime dependency。
- Reviewer checklist：
  - 确认 AI 边界没有导入 OpenAI-specific types。
  - 确认 tool-call arguments 使用 `JsonObject`，不是 `any`。
  - 确认 assistant text 和 tool-call content 可以通过 `type` 区分。
  - 确认 messages 可以通过 `role` 区分。
  - 确认 TODO-005 可以在不修改这些类型的情况下实现 `ChatTransport`。

### TODO-005：实现 OpenAI 兼容 Provider

- 状态：completed
- 目标：实现一个真实 provider adapter，满足 TODO-004 里的 `ChatTransport` interface，并能调用 OpenAI 兼容的 `/chat/completions` API。
- 范围：
  - 创建 `src/ai/openai-compatible.ts`。
  - 使用 `src/ai/types.ts` 中的 provider-neutral 类型。
  - 把 user、assistant、tool-result messages 发送给 OpenAI 兼容 API。
  - 使用 OpenAI 的 `tools` 格式发送可选 tool definitions。
  - 把 provider response 转回 `ChatResponse`。
  - 解析 assistant 普通文本回复。
  - 解析 assistant tool calls，并把 tool-call arguments 转成 `JsonObject`。
  - 对缺失 API key、HTTP 失败、无效 JSON、畸形 provider response 添加清晰错误。
  - 暂不构建 agent loop。
  - 暂不执行任何 tools。
  - 暂不添加 streaming。
  - 暂不添加测试，除非你想额外练习；TODO-014 负责正式测试。
- 可能涉及的文件或区域：`src/ai/openai-compatible.ts`、`src/config/config.ts`
- 依赖：TODO-003、TODO-004
- 来自 `pi` 的参考：
  - `pi` 在 [packages/ai/src/providers/](../packages/ai/src/providers/) 下有更大的 provider layer。
  - ChatRealm 不要复制完整 registry。
  - MVP 要学的是边界：app code 使用 `ChatTransport`，provider code 知道 OpenAI 兼容的 wire format。
- 初学者心智模型：
  - `ChatTransport` 是你的 app 内部形状。
  - OpenAI 兼容 chat completions 是 provider 的 HTTP 形状。
  - `openai-compatible.ts` 就是这两个世界之间的翻译器。
  - ChatRealm 其他部分不应该需要知道 OpenAI 的具体 JSON 字段名。
- 分步实现指南：
  1. 创建 provider 文件。
     - 创建 `src/ai/openai-compatible.ts`。
     - 这个文件放运行时代码，不同于 `src/ai/types.ts`，后者只放类型。
     - 只使用顶部 imports：

       ```ts
       import { parseJsonObject } from "../utils/json.js";
       import type {
         AssistantContent,
         AssistantMessage,
         ChatRequest,
         ChatResponse,
         ChatTransport,
         JsonObject,
         JsonValue,
         Message,
         StopReason,
         ToolCallContent,
         ToolDefinition,
         Usage,
       } from "./types.js";
       ```
     - 为什么使用 `import type`：

       - 这些 imports 只用于 TypeScript 类型。
       - 它们在运行时会消失。
       - 这样可以让生成的 JavaScript 更小，也避免意外的运行时依赖。
     - imports 保持在文件顶部。不要使用 dynamic imports。
  2. 定义 provider options。
     - 添加一个导出的 interface，名为 `OpenAICompatibleOptions`。
     - 推荐形状：

       ```ts
       export interface OpenAICompatibleOptions {
         apiKey: string;
         baseUrl?: string;
       }
       ```
     - `apiKey` 必填，因为 provider 没有它就无法调用 API。
     - `baseUrl` 可选，因为 provider 可以默认使用官方 OpenAI base URL。
     - 这个 MVP 不要把 `model` 放在这里。model 来自 `ChatRequest.model`。
  3. 添加默认 base URL。
     - 在文件顶部附近添加：

       ```ts
       const DEFAULT_BASE_URL = "https://api.openai.com/v1";
       ```
     - 这样普通 OpenAI 用户只需要配置 `apiKey`。
     - 使用兼容服务的用户仍然可以传入自定义 `baseUrl`。
  4. 定义最小 raw provider response 类型。
     - 这些类型只描述 ChatRealm 需要从 HTTP response 中读取的字段。
     - 不要建模完整 OpenAI API。
     - 推荐类型：

       ```ts
       interface OpenAIChatCompletionResponse {
         choices?: OpenAIChoice[];
         usage?: {
           prompt_tokens?: number;
           completion_tokens?: number;
           total_tokens?: number;
         };
       }

       interface OpenAIChoice {
         finish_reason?: string | null;
         message?: {
           content?: string | null;
           tool_calls?: OpenAIToolCall[];
         };
       }

       interface OpenAIToolCall {
         id?: string;
         type?: string;
         function?: {
           name?: string;
           arguments?: string;
         };
       }
       ```
     - 为什么字段都是可选的：

       - 外部 HTTP response 不可信。
       - 可选字段会强迫代码在使用前检查。
       - 这比假设网络永远返回精确形状更安全。
  5. 实现 transport class。
     - 添加一个 class，实现 `ChatTransport`。
     - 推荐骨架：

       ```ts
       export class OpenAICompatibleTransport implements ChatTransport {
         private readonly apiKey: string;
         private readonly baseUrl: string;

         constructor(options: OpenAICompatibleOptions) {
           if (options.apiKey.trim() === "") {
             throw new Error("Missing OpenAI-compatible API key");
           }

           this.apiKey = options.apiKey;
           this.baseUrl = trimTrailingSlash(options.baseUrl ?? DEFAULT_BASE_URL);
         }

         async complete(request: ChatRequest): Promise<ChatResponse> {
           // Implementation goes here.
         }
       }
       ```
     - 为什么这里适合用 class：

       - API key 和 base URL 是初始化时的设置值。
       - `complete` 可以在每次请求时重复使用它们。
       - 后续测试时，你可以把这个 transport 换成 fake transport。
  6. 添加一个小 URL helper。
     - 在 class 下方或上方添加：

       ```ts
       function trimTrailingSlash(value: string): string {
         return value.endsWith("/") ? value.slice(0, -1) : value;
       }
       ```
     - 为什么需要它：

       - 用户可能配置带结尾斜杠的 `https://api.openai.com/v1/`。
       - provider 会追加 `/chat/completions`。
       - 去掉结尾斜杠可以避免 `https://api.openai.com/v1//chat/completions`。
  7. 构造 HTTP request body。
     - 在 `complete` 内创建一个发送给 OpenAI 兼容 API 的普通对象：

       ```ts
       const body = {
         model: request.model,
         messages: toOpenAIMessages(request),
         tools: request.tools.length > 0 ? request.tools.map(toOpenAITool) : undefined,
       };
       ```
     - `messages` 字段必须使用 OpenAI 的 roles 和 content 格式。
     - 没有 tools 时应省略 `tools` 字段。
     - 这个 TODO 不添加 streaming 字段。
     - 不要在这里执行 tool；这个文件只发送 tool definitions，并接收模型提出的 tool-call requests。
  8. 使用 `fetch` 发送 HTTP request。
     - Node 18+ 有全局 `fetch`，这个 MVP 不需要额外 runtime dependency。
     - 推荐代码形状：

       ```ts
       const response = await fetch(`${this.baseUrl}/chat/completions`, {
         method: "POST",
         headers: {
           "authorization": `Bearer ${this.apiKey}`,
           "content-type": "application/json",
         },
         body: JSON.stringify(body),
       });
       ```
     - Header 说明：

       - `authorization` 携带 API key。
       - `content-type` 告诉服务器 body 是 JSON。
       - Header 名字大小写不敏感，所以小写可以。
  9. 处理 HTTP errors。
     - 如果 `response.ok` 是 false，读取 response text 并抛出清晰错误。
     - 推荐代码形状：

       ```ts
       if (!response.ok) {
         const errorText = await response.text();
         throw new Error(
           `OpenAI-compatible request failed with ${response.status}: ${errorText}`,
         );
       }
       ```
     - 这样你能看出问题是 invalid key、bad base URL、bad model，还是 provider-side error。
     - 不要吞掉 HTTP error 并返回 assistant message；HTTP 失败不是正常 assistant response。
  10. 解析 JSON response。
      - 先把 response body 读成 text。
      - 使用 `parseJsonObject`，这样无效 JSON 会产生清晰错误。
      - 推荐代码形状：

        ```ts
        const responseText = await response.text();
        const json = parseJsonObject(responseText, "OpenAI-compatible response");
        ```
      - 然后在 helper 检查后，把 `json` 转成 `OpenAIChatCompletionResponse`。
      - 避免 `any`；使用 `unknown`、`Record<string, unknown>` 和小 helper functions。
      - 为什么这一步不能只有 `JSON.parse`：
        - `JSON.parse` 只能告诉你文本是不是合法 JSON。
        - 它不能告诉你这个 JSON 是否符合 provider 期望的形状。
        - Provider response 可能是合法 JSON，但仍然不能用，例如 `{ "error": "bad model" }`。
        - 这一步应该在后续代码读取字段前，先拒绝畸形的成功 response。
      - 不要这样写：

        ```ts
        const data = await response.json() as OpenAIChatCompletionResponse;
        ```

      - 为什么不要这样写：
        - `response.json()` 返回的是不可信外部数据。
        - `as OpenAIChatCompletionResponse` 只是告诉 TypeScript“相信我”。
        - 它不会做任何运行时检查。
        - 如果 response 形状不对，代码可能会在后面用很难懂的错误崩掉。
      - 使用更安全的流程：
        1. 读取 response text。
        2. 使用 `parseJsonObject` 解析。
        3. 验证 provider 需要的字段。
        4. 返回一个后续步骤可用的小型 typed object。
      - 添加一个识别普通 object 的 helper：

        ```ts
        function isRecord(value: unknown): value is Record<string, unknown> {
          return (
            typeof value === "object" &&
            value !== null &&
            !Array.isArray(value)
          );
        }
        ```

      - 为什么需要 `isRecord`：
        - TypeScript 不能安全地从 `unknown` 上读取 `value.choices`。
        - 当 `isRecord(value)` 返回 true 后，TypeScript 才知道 `value` 像 object。
        - 但它仍然不会信任每个具体字段；每个字段还需要单独检查。
      - 添加一个验证 top-level response 的 helper：

        ```ts
        function toOpenAIChatCompletionResponse(
          json: Record<string, unknown>,
        ): OpenAIChatCompletionResponse {
          const choices = json.choices;

          if (!Array.isArray(choices)) {
            throw new Error("OpenAI-compatible response is missing choices");
          }

          return {
            choices: choices.map(toOpenAIChoice),
            usage: toOpenAIUsage(json.usage),
          };
        }
        ```

      - 这个 helper 检查什么：
        - `choices` 必须存在。
        - `choices` 必须是 array。
        - `choices` 里的每一项交给另一个 helper 继续验证。
        - `usage` 是可选字段，所以可以单独转换。
      - 添加一个验证每个 choice 的 helper：

        ```ts
        function toOpenAIChoice(value: unknown): OpenAIChoice {
          if (!isRecord(value)) {
            throw new Error("OpenAI-compatible choice must be an object");
          }

          const message = value.message;

          if (!isRecord(message)) {
            throw new Error("OpenAI-compatible choice is missing message");
          }

          return {
            finish_reason: readOptionalStringOrNull(value.finish_reason),
            message: {
              content: readOptionalStringOrNull(message.content),
              tool_calls: readOptionalToolCalls(message.tool_calls),
            },
          };
        }
        ```

      - 为什么把 choice validation 单独拆出来：
        - top-level response 只知道 `choices` 是 array。
        - array 里的每一项仍然需要自己的检查。
        - 小 helper 会让 TypeScript 报错更容易理解。
      - 添加几个小的 value helpers：

        ```ts
        function readOptionalStringOrNull(value: unknown): string | null | undefined {
          if (value === undefined || value === null || typeof value === "string") {
            return value;
          }

          throw new Error("Expected optional string value in OpenAI-compatible response");
        }

        function readOptionalNumber(value: unknown): number | undefined {
          if (value === undefined) {
            return undefined;
          }

          if (typeof value !== "number") {
            throw new Error("Expected optional number value in OpenAI-compatible response");
          }

          return value;
        }
        ```

      - 为什么这些 helpers 故意比较通用：
        - 它们能避免反复写同样的 `typeof` 检查。
        - 它们能让 response parser 更容易读。
        - 这个 MVP 暂时不需要每个字段都有完全独立的错误消息。
      - 添加 usage helper：

        ```ts
        function toOpenAIUsage(value: unknown): OpenAIChatCompletionResponse["usage"] {
          if (value === undefined) {
            return undefined;
          }

          if (!isRecord(value)) {
            throw new Error("OpenAI-compatible usage must be an object");
          }

          return {
            prompt_tokens: readOptionalNumber(value.prompt_tokens),
            completion_tokens: readOptionalNumber(value.completion_tokens),
            total_tokens: readOptionalNumber(value.total_tokens),
          };
        }
        ```

      - 添加 tool-call list helper：

        ```ts
        function readOptionalToolCalls(value: unknown): OpenAIToolCall[] | undefined {
          if (value === undefined) {
            return undefined;
          }

          if (!Array.isArray(value)) {
            throw new Error("OpenAI-compatible tool_calls must be an array");
          }

          return value.map(toOpenAIToolCall);
        }
        ```

      - 添加单个 tool-call helper：

        ```ts
        function toOpenAIToolCall(value: unknown): OpenAIToolCall {
          if (!isRecord(value)) {
            throw new Error("OpenAI-compatible tool call must be an object");
          }

          const fn = value.function;

          if (!isRecord(fn)) {
            throw new Error("OpenAI-compatible tool call is missing function");
          }

          return {
            id: readOptionalStringOrNull(value.id) ?? undefined,
            type: readOptionalStringOrNull(value.type) ?? undefined,
            function: {
              name: readOptionalStringOrNull(fn.name) ?? undefined,
              arguments: readOptionalStringOrNull(fn.arguments) ?? undefined,
            },
          };
        }
        ```

      - 有了这些 helpers 后，`complete` 里的 Step 10 可以长这样：

        ```ts
        const responseText = await response.text();
        const json = parseJsonObject(responseText, "OpenAI-compatible response");
        const data = toOpenAIChatCompletionResponse(json);
        ```

      - 后续步骤就可以使用 `data.choices` 和 `data.usage`，不用再反复解析原始 JSON。
      - 初学者检查点：
        - 如果 TypeScript 说某个值是 `unknown`，先加运行时检查，再读它的属性。
        - 如果 TypeScript 说 `unknown` 上不存在某个 property，多半是忘了用 `isRecord`。
        - 如果 TypeScript 说返回类型不匹配，检查是不是在 interface 期待 `undefined` 的地方返回了 `null`。
        - 如果 helper 过早 throw，把真实 provider JSON 和 Step 4 中的最小 raw response types 对照一下。
      - 不要这样做：
        - 不要使用 `any`。
        - 不要不验证就相信 `response.json()`。
        - 不要在 Step 10 里解析 tool-call `arguments`；Step 14 负责 assistant content parsing。
        - 不要在 Step 10 里转换成 `ChatResponse`；Step 13 负责这个转换。
        - 不要在这里 catch 后隐藏畸形 response 错误，除非你重新抛出清晰错误。
  11. 把 ChatRealm messages 转成 OpenAI messages。
      - 添加 helper，名为 `toOpenAIMessages`。
      - 它应该：

        - 如果 `request.systemPrompt` 存在，先添加 system message。
        - 把 user message 转成 `{ role: "user", content: message.content }`。
        - 把 assistant text 和 tool-call content 转成一个 assistant message。
        - 把 tool-result message 转成 `{ role: "tool", tool_call_id, content }`。
      - 初学者友好的第一版：

        ```ts
        function toOpenAIMessages(request: ChatRequest): JsonObject[] {
          const messages: JsonObject[] = [];

          if (request.systemPrompt !== undefined) {
            messages.push({
              role: "system",
              content: request.systemPrompt,
            });
          }

          for (const message of request.messages) {
            messages.push(toOpenAIMessage(message));
          }

          return messages;
        }
        ```
      - 然后添加 `toOpenAIMessage(message: Message): JsonObject`。
      - 保持 helper 小，用 `switch (message.role)`。
      - 这个 TODO 不支持 image messages 或 streaming chunks。
  12. 把 tools 转成 OpenAI tool definitions。
      - 添加 helper，名为 `toOpenAITool`。
      - 推荐形状：

        ```ts
        function toOpenAITool(tool: ToolDefinition): JsonObject {
          return {
            type: "function",
            function: {
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters,
            },
          };
        }
        ```
      - 这是把 ChatRealm 的 provider-neutral `ToolDefinition` 转成 OpenAI 的 function-tool 格式。
      - provider 不执行 tool。它只告诉模型有哪些 tools 可用。
  13. 把 provider response 转成 `ChatResponse`。
      - 正常路径是：

        - 取第一个 choice。
        - 读取 `choice.message.content`。
        - 读取 `choice.message.tool_calls`。
        - 转成 `AssistantContent[]`。
        - 转换 usage。
        - 转换 finish reason。
        - 返回 `{ message }`。
      - 推荐最终形状：

        ```ts
        const message: AssistantMessage = {
          role: "assistant",
          content,
          model: request.model,
          usage,
          stopReason,
          errorMessage: undefined,
        };

        return { message };
        ```
      - 如果 response 没有 choices 或没有 message，抛出清晰错误。
  14. 解析 assistant content。
      - 如果 `content` 是非空 string，添加：

        ```ts
        { type: "text", text: content }
        ```
      - 如果存在 `tool_calls`，把每个 function tool call 转成：

        ```ts
        {
          type: "toolCall",
          id: toolCall.id,
          name: toolCall.function.name,
          arguments: parsedArguments,
        }
        ```
      - `toolCall.function.arguments` 是 JSON string，不是 object。
      - 使用 `parseJsonObject(argumentsText, "tool call arguments")` 解析它。
      - 缺少 `id`、缺少 `name` 或 arguments 无效，都应该视为畸形 provider response。
  15. 转换 finish reasons。
      - 添加 helper，名为 `toStopReason`。
      - 推荐映射：

        ```ts
        function toStopReason(finishReason: string | null | undefined): StopReason {
          if (finishReason === "tool_calls") {
            return "toolUse";
          }

          if (finishReason === "length") {
            return "length";
          }

          if (finishReason === "stop" || finishReason === null || finishReason === undefined) {
            return "stop";
          }

          return "error";
        }
        ```
      - OpenAI 使用 `"tool_calls"`；ChatRealm 使用 `"toolUse"`。
      - 这个 helper 可以避免 provider-specific 命名进入 app 其他部分。
  16. 转换 usage。
      - 添加 helper，名为 `toUsage`。
      - 如果 usage 缺失，返回 `undefined`。
      - 否则映射：
        - `prompt_tokens` 到 `inputTokens`
        - `completion_tokens` 到 `outputTokens`
        - `total_tokens` 到 `totalTokens`
      - 如果某个 number 缺失，这个 MVP 里使用 `0`。
  17. 添加一个小 factory function。
      - 在文件底部添加：

        ```ts
        export function createOpenAICompatibleTransport(
          options: OpenAICompatibleOptions,
        ): ChatTransport {
          return new OpenAICompatibleTransport(options);
        }
        ```
      - 这会让 TODO-011 的 wiring 更容易。
      - app 其他部分可以调用函数，而不是直接使用 `new`。
  18. 运行类型检查。
      - 从 `ChatRealm/` 运行：

        ```powershell
        npm run check
        ```
      - 进入下一步前修复所有 TypeScript 错误。
      - 常见修复：

        - 如果 `fetch` 未知，确认 TypeScript `lib` 包含现代环境，或者安装/更新 Node types。
        - 如果 `JsonObject` 拒绝某个值，检查嵌套值是否都是 JSON-compatible。
        - 如果 TypeScript 要求返回值，确认每个 helper 都 return 或 throw。
  19. 可选手动 smoke test。
      - 这个 TODO 不需要完整 CLI wiring。
      - 如果你想手动测试 provider，可以创建不提交的临时脚本，或者等 TODO-011。
      - 不要提交 API keys 或本地 smoke-test 文件。
- 初学者说明：
  - `fetch` 发送 HTTP request。
  - `await` 会暂停，直到网络 response 返回。
  - `JSON.stringify(body)` 把 JavaScript object 转成 HTTP request 里的 JSON 文本。
  - `response.ok` 在 HTTP 2xx 成功状态下为 true。
  - Provider response 是外部数据，所以使用字段前要验证。
  - Tool calls 是模型提出的请求，不是 tool results。
  - Tool execution 会在后续 agent loop 里发生。
- 验收标准：
  - `src/ai/openai-compatible.ts` 存在。
  - 它导出 `OpenAICompatibleTransport` 或返回 `ChatTransport` 的 factory。
  - 它向 `${baseUrl}/chat/completions` 发送请求。
  - 它包含 authorization bearer token。
  - 它把 ChatRealm messages 转成 OpenAI-compatible messages。
  - 它把 ChatRealm tool definitions 转成 OpenAI-compatible function tools。
  - 它返回带 `AssistantMessage` 的 `ChatResponse`。
  - 它支持普通文本 assistant responses。
  - 它支持带已解析 JSON arguments 的 assistant tool calls。
  - 它把 usage 映射成 `Usage | undefined`。
  - 它把 provider finish reasons 映射成 `StopReason`。
  - HTTP failures 和畸形 responses 会产生清晰错误。
  - `npm run check` 成功。
  - 这个 TODO 不实现 agent loop、tool execution、session persistence 或 streaming。
- Reviewer checklist：
  - 确认 provider-specific JSON shapes 只在 `src/ai/openai-compatible.ts`。
  - 确认 `src/ai/types.ts` 保持 provider-neutral。
  - 确认没有 `any`。
  - 确认没有 dynamic imports。
  - 确认 API keys 来自 config 或 options，而不是 hardcoded。
  - 确认 tool calls 只是被解析并返回，没有被执行。

### TODO-006：定义 Tool Contracts 和 Registry

- 状态：pending
- 范围：创建内部 tool interface、JSON schema 元数据、validation boundary 和 registry lookup。
- 可能涉及的文件或区域：`src/tools/types.ts`、`src/tools/registry.ts`、`test/tool-registry.test.ts`
- 依赖：TODO-004

### TODO-007：实现读取和搜索工具

- 状态：pending
- 范围：添加 read-file 和 search 工具，包含 path normalization、cwd confinement、清晰错误和简洁输出。
- 可能涉及的文件或区域：`src/tools/read-file.ts`、`src/tools/search.ts`、`src/tools/registry.ts`
- 依赖：TODO-006

### TODO-008：实现写入和 Shell 工具

- 状态：pending
- 范围：添加 write-file 和 shell command 工具，包含显式安全边界和 result objects。
- 可能涉及的文件或区域：`src/tools/write-file.ts`、`src/tools/shell.ts`、`src/tools/registry.ts`
- 依赖：TODO-006、TODO-007

### TODO-009：构建最小 Agent State

- 状态：pending
- 范围：在内存中存储 messages、tool results、当前 cwd、所选 model 和 run metadata。
- 可能涉及的文件或区域：`src/agent/state.ts`、`src/agent/prompt.ts`
- 依赖：TODO-004、TODO-006

### TODO-010：实现 Agent Loop

- 状态：pending
- 范围：运行 prompt、调用 model、执行请求的 tools、追加 tool results，并持续运行直到最终 assistant answer 或达到 max turns。
- 可能涉及的文件或区域：`src/agent/agent-loop.ts`、`src/agent/agent.ts`、`test/agent-loop.test.ts`
- 依赖：TODO-005、TODO-006、TODO-009

### TODO-011：端到端连接 Print Mode

- 状态：pending
- 范围：连接 CLI args、config、provider、tool registry 和 agent loop，让一个命令可以完成任务。
- 可能涉及的文件或区域：`src/main.ts`、`src/agent/agent.ts`
- 依赖：TODO-002、TODO-003、TODO-005、TODO-010

### TODO-012：添加 JSON Session 持久化

- 状态：pending
- 范围：在本地 session 目录下保存和加载 conversation state，以支持后续运行。
- 可能涉及的文件或区域：`src/session/store.ts`、`src/agent/state.ts`、`src/main.ts`
- 依赖：TODO-009、TODO-011

### TODO-013：添加错误处理和面向用户的输出

- 状态：pending
- 范围：将 provider errors、tool errors、JSON parse errors 和 CLI usage errors 规范化为简洁的终端输出。
- 可能涉及的文件或区域：`src/utils/errors.ts`、`src/main.ts`、`src/agent/agent-loop.ts`
- 依赖：TODO-011

### TODO-014：添加聚焦 MVP 测试

- 状态：pending
- 范围：覆盖 CLI parsing、registry lookup、fake-provider agent loop、max-turn handling 和 tool error propagation。
- 可能涉及的文件或区域：`test/cli-args.test.ts`、`test/tool-registry.test.ts`、`test/agent-loop.test.ts`
- 依赖：TODO-002、TODO-006、TODO-010、TODO-013

### TODO-015：编写 MVP 使用文档

- 状态：pending
- 范围：记录 setup、environment variables、example commands、current limitations 和后续 architecture milestones。
- 可能涉及的文件或区域：`README.md`
- 依赖：TODO-011、TODO-014

## TODO 项之间的依赖关系

- TODO-001 必须最先完成。
- TODO-002 和 TODO-003 准备可执行配置。
- TODO-004 和 TODO-005 创建 AI 边界。
- TODO-006 到 TODO-008 创建工具边界。
- TODO-009 和 TODO-010 创建核心 agent 行为。
- TODO-011 产出第一个可用 MVP。
- TODO-012 到 TODO-015 强化并文档化 MVP。

## 下一个可执行项

- TODO-003：添加配置加载

## 假设

- MVP 将作为当前 workspace 下独立的 `ChatRealm` 学习项目构建。
- TypeScript 是首选技术栈，因为 `pi` 基于 TypeScript，架构经验可以直接迁移。
- 第一个可用 agent 应优先实现 print mode，而不是 TUI，因为它能以少很多的 UI 复杂度暴露真实 agent loop。
- 工具执行应是本地且显式的；remote sandboxes、approval systems 和 plugin loading 延后。

## 风险

- 不同 provider 的 tool-call response formats 不同；MVP 应从一个 OpenAI 兼容 API 开始。
- Shell 和 write-file tools 如果过早开放可能不安全；在广泛使用前应先实现 path confinement 和清晰 command output。
- 完整 TUI 可能分散对 agent architecture 的学习；应等核心 loop 被理解后再做。
