# 提示词组装 实现分析

## 1. 分析范围

- **只分析**:pi 如何组装发给 LLM 的提示词——system prompt 的分段拼接、动态注入(工具/项目指令/skills/日期/cwd)、以及最终 `Context = { systemPrompt, messages, tools }` 的构造。
- **不覆盖**:对话历史如何存储与压缩(见 [conversation-memory.md](./conversation-memory.md))、prompt 模板(斜杠命令)的完整加载(仅简述)。
- **项目总体索引入口**:[ARCHITECTURE.en.md](../ARCHITECTURE.en.md)。

## 2. 功能概览

system prompt 由 [buildSystemPrompt()](../../packages/coding-agent/src/core/system-prompt.ts) 一次性拼接而成,分为 **7 段**(自定义/默认导言 → 工具 → 准则 → 追加段 → 项目上下文 → skills → 日期与 cwd)。每当工具集变化,coding-agent 侧的 `_rebuildSystemPrompt()` 会从 `ResourceLoader` 重新收集 skills、项目指令文件、工具说明后重建,并写回 `agent.state.systemPrompt`。最终在 agent 循环里与(经压缩/转换后的)消息数组、工具定义一起组成 `Context`,由 `streamFunction` 发给模型。

## 3. 关键源码入口

- [system-prompt.ts](../../packages/coding-agent/src/core/system-prompt.ts) — `buildSystemPrompt()`,7 段拼接的唯一实现。
- [agent-session.ts](../../packages/coding-agent/src/core/agent-session.ts) — `_rebuildSystemPrompt()`(878-911):收集材料并写回 `agent.state.systemPrompt`(796)。
- [resource-loader.ts](../../packages/coding-agent/src/core/resource-loader.ts) — 加载 CLAUDE.md/AGENTS.md 项目指令、skills、appendSystemPrompt。
- [skills.ts](../../packages/coding-agent/src/core/skills.ts) — `formatSkillsForPrompt()`(335-361),生成 `<available_skills>` XML。
- [agent-loop.ts](../../packages/agent/src/agent-loop.ts) — `streamAssistantResponse()`(275-308),组装 `Context` 并发出。
- [messages.ts](../../packages/agent/src/harness/messages.ts) — `convertToLlm()`,历史消息转换。
- [prompt-templates.ts](../../packages/agent/src/harness/prompt-templates.ts) — 斜杠命令模板加载与参数替换(旁路机制)。

## 4. 主流程详解

### 4.1 起点:buildSystemPrompt 的两条分支

[buildSystemPrompt() system-prompt.ts:28-175](../../packages/coding-agent/src/core/system-prompt.ts) 先规范化 cwd(反斜杠转正斜杠)、算出当前日期([system-prompt.ts:39-46](../../packages/coding-agent/src/core/system-prompt.ts)),然后分两支:

- **自定义分支**([system-prompt.ts:53-81](../../packages/coding-agent/src/core/system-prompt.ts)):若传入 `customPrompt`,用它替换默认导言,后面照样拼接 append 段、项目上下文、skills、日期/cwd。
- **默认分支**([system-prompt.ts:83-175](../../packages/coding-agent/src/core/system-prompt.ts)):使用硬编码导言(见 4.3),额外注入 pi 文档路径提示。

### 4.2 中间:7 段拼接顺序

| # | 段落 | 来源 | 位置 |
|---|------|------|------|
| 1 | 导言(默认硬编码 或 `customPrompt`) | `customPrompt` 或内置文本 | 53-81 / 132-149 |
| 2 | Available tools | `selectedTools` ∩ 有 snippet 的工具 | 88-93 |
| 3 | Guidelines | 按工具生成 + `promptGuidelines` + 固定项 | 95-130 |
| 4 | append 段 | `appendSystemPrompt` | 48, 151-153 |
| 5 | `<project_context>` | CLAUDE.md/AGENTS.md 内容 | 155-163 |
| 6 | `<available_skills>` | skills(需 read 工具且非空) | 165-168 |
| 7 | Current date / Current working directory | 运行时 | 170-172 |

### 4.3 核心:默认导言与各段细节

**默认导言**([system-prompt.ts:132-149](../../packages/coding-agent/src/core/system-prompt.ts))固定为 "You are an expert coding assistant operating inside pi...",内含 `Available tools` 列表、`Guidelines`,以及一段 **pi 文档路径提示**(README/docs/examples 路径,仅当用户询问 pi 自身/SDK/扩展/主题/skills/TUI 时才读)。

- **工具段**([system-prompt.ts:88-93](../../packages/coding-agent/src/core/system-prompt.ts)):`selectedTools` 默认 `[read, bash, edit, write]`,但**只有提供了一行 snippet 的工具才会出现**在列表里(`visibleTools = tools.filter(有 snippet)`);无则显示 `(none)`。
- **准则段**([system-prompt.ts:95-130](../../packages/coding-agent/src/core/system-prompt.ts)):按可用工具动态生成文件探索准则(如同时有 grep/find/ls 则提示"优先用它们而非 bash,更快且尊重 .gitignore"),再并入调用方传入的 `promptGuidelines`,最后固定追加 "Be concise in your responses" 与 "Show file paths clearly"(用 `Set` 去重)。

### 4.4 动态注入点

- **项目指令文件**([system-prompt.ts:155-163](../../packages/coding-agent/src/core/system-prompt.ts)):`contextFiles` 每个文件用 `<project_instructions path="...">…</project_instructions>` 包裹,整体放进 `<project_context>`。文件由 [resource-loader.ts:57-113](../../packages/coding-agent/src/core/resource-loader.ts) 按候选名 `AGENTS.md / AGENTS.MD / CLAUDE.md / CLAUDE.MD` 查找,顺序为**全局 agentDir → cwd → 逐级祖先目录**。
- **skills**([system-prompt.ts:165-168](../../packages/coding-agent/src/core/system-prompt.ts)):仅当有 read 工具且 skills 非空时,调 [formatSkillsForPrompt() skills.ts:335-361](../../packages/coding-agent/src/core/skills.ts) 生成 `<available_skills>`,每个 skill 输出 name/description/location,并提示模型"用 read 工具在任务匹配时加载对应文件"——**只给索引不给全文**。禁用模型调用(`disableModelInvocation`)的 skill 不列出。
- **cwd + 日期**([system-prompt.ts:170-172](../../packages/coding-agent/src/core/system-prompt.ts)):始终追加在末尾。

### 4.5 收尾:重建并交给 agent

[_rebuildSystemPrompt() agent-session.ts:878-911](../../packages/coding-agent/src/core/agent-session.ts) 从 `ResourceLoader` 取 `getSystemPrompt()`(作 customPrompt)、`getSkills()`、`getAgentsFiles()`,连同工具 snippet/guidelines 组成 `BuildSystemPromptOptions`,调用 `buildSystemPrompt` 并把结果写入 `agent.state.systemPrompt`([agent-session.ts:796-797](../../packages/coding-agent/src/core/agent-session.ts))。之后每轮在 [streamAssistantResponse() agent-loop.ts:275-308](../../packages/agent/src/agent-loop.ts) 里:先 `transformContext`(可选)→ `convertToLlm` 把 `AgentMessage[]` 转为 `Message[]` → 组装 `Context = { systemPrompt: context.systemPrompt, messages: llmMessages, tools: context.tools }` → `streamFunction(model, llmContext, options)` 发出([agent-loop.ts:304](../../packages/agent/src/agent-loop.ts))。

## 5. 关键实现细节

- **工具"可见"取决于 snippet**:一个工具即便在 `selectedTools` 里,没有 `promptSnippet` 也不会出现在 Available tools 段——工具说明与工具启用是解耦的。
- **准则去重**:用 `guidelinesSet` 保证同一条准则不重复注入。
- **skills 走"按需加载"**:提示词只放 skill 索引(name/description/location),正文让模型用 read 工具自行读取,节省 token。
- **未注入的信息**:默认导言里**不含 git 状态、平台(OS)、shell** 等环境信息;能体现环境的只有日期和 cwd。这与部分同类工具(会注入 git status/平台)不同,是 pi 的一个显著特征。
- **cwd 规范化**:反斜杠统一转正斜杠([system-prompt.ts:40](../../packages/coding-agent/src/core/system-prompt.ts)),保证跨平台(尤其 Windows)提示词一致。

## 6. 相关文件关系

**主路径**:
- [system-prompt.ts](../../packages/coding-agent/src/core/system-prompt.ts) — 7 段拼接(主)。
- [agent-session.ts](../../packages/coding-agent/src/core/agent-session.ts) — 重建与写回(主)。
- [agent-loop.ts](../../packages/agent/src/agent-loop.ts) — Context 组装与发出(主)。

**支撑但非主路径**:
- [resource-loader.ts](../../packages/coding-agent/src/core/resource-loader.ts) — 加载项目指令/skills/append。
- [skills.ts](../../packages/coding-agent/src/core/skills.ts) — skills 的 XML 格式化。
- [messages.ts](../../packages/agent/src/harness/messages.ts) — 历史消息转换(与记忆系统交汇)。
- [prompt-templates.ts](../../packages/agent/src/harness/prompt-templates.ts) — 斜杠命令模板(旁路,面向用户消息而非 system prompt)。

## 7. 时序总结

1. 工具集/资源变化触发 `_rebuildSystemPrompt`。
2. 从 `ResourceLoader` 收集 customPrompt、skills、项目指令、工具 snippet/guidelines。
3. `buildSystemPrompt` 规范化 cwd、计算日期。
4. 拼接导言(默认或 custom)+ 工具段 + 准则段。
5. 追加 append 段。
6. 追加 `<project_context>`(CLAUDE.md/AGENTS.md)。
7. 追加 `<available_skills>`(若有 read 工具)。
8. 追加 Current date / Current working directory。
9. 结果写回 `agent.state.systemPrompt`。
10. 每轮 `streamAssistantResponse` 里 `convertToLlm` 转换历史消息。
11. 组装 `Context = { systemPrompt, messages, tools }`。
12. `streamFunction(model, context, options)` 发送给 LLM。

## 8. 边界情况与注意点

- **customPrompt 分支不注入 pi 文档提示**:只有默认分支才带 README/docs/examples 提示([system-prompt.ts:142-149](../../packages/coding-agent/src/core/system-prompt.ts))。
- **无 snippet = 不出现在工具列表**:排查"模型不知道某工具"时先看是否缺 `promptSnippet`。
- **skills 依赖 read 工具**:read 不在工具集时,即使有 skills 也不注入。
- **项目指令的多源合并**:全局与项目、以及各级祖先目录的 CLAUDE.md/AGENTS.md 都会被收集,注意可能同时注入多份。
- **推断**:`ResourceLoader.getSystemPrompt()` 返回的 customPrompt 具体来源(哪个配置文件/字段)本文未逐行核实,标记为 `推断:`需查 resource-loader.ts 的初始化。

## 9. 关键证据

- [system-prompt.ts:28-175](../../packages/coding-agent/src/core/system-prompt.ts) — `buildSystemPrompt` 全实现。
- [system-prompt.ts:53-81](../../packages/coding-agent/src/core/system-prompt.ts) — customPrompt 分支。
- [system-prompt.ts:88-93](../../packages/coding-agent/src/core/system-prompt.ts) — 工具段(visibleTools 需 snippet)。
- [system-prompt.ts:95-130](../../packages/coding-agent/src/core/system-prompt.ts) — 准则段(动态 + 固定 + 去重)。
- [system-prompt.ts:132-149](../../packages/coding-agent/src/core/system-prompt.ts) — 默认导言 + pi 文档提示。
- [system-prompt.ts:155-172](../../packages/coding-agent/src/core/system-prompt.ts) — 项目上下文 + skills + 日期/cwd。
- [skills.ts:335-361](../../packages/coding-agent/src/core/skills.ts) — `formatSkillsForPrompt`。
- [resource-loader.ts:57-113](../../packages/coding-agent/src/core/resource-loader.ts) — CLAUDE.md/AGENTS.md 查找。
- [agent-session.ts:878-911](../../packages/coding-agent/src/core/agent-session.ts) — `_rebuildSystemPrompt`;796-797 写回。
- [agent-loop.ts:275-308](../../packages/agent/src/agent-loop.ts) — Context 组装;304 发出。
