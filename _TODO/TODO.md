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
- 范围：定义 provider-neutral 的 message、tool、tool call、response、usage 和 streaming-ready interfaces。
- 可能涉及的文件或区域：`src/ai/types.ts`
- 依赖：TODO-001

### TODO-005：实现 OpenAI 兼容 Provider

- 状态：pending
- 范围：实现一个 provider adapter，发送 chat 请求并返回带可选 tool calls 的 assistant messages。
- 可能涉及的文件或区域：`src/ai/openai-compatible.ts`、`src/config/config.ts`
- 依赖：TODO-003、TODO-004

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
