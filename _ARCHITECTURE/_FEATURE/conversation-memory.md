# 对话记忆管理 实现分析

## 1. 分析范围

- **只分析**:pi 如何在单个会话内管理对话记忆,包含三块——会话树的持久化与"拍平"、上下文压缩(compaction)、分支摘要(branch summary)。
- **不覆盖**:提示词(system prompt)如何组装(见 [prompt-assembly.md](./prompt-assembly.md))、TUI 会话选择器交互、认证。
- **项目总体索引入口**:[ARCHITECTURE.en.md](../ARCHITECTURE.en.md)。

## 2. 功能概览

pi 的对话记忆核心不是线性 `messages[]`,而是一棵**带 `parentId` 的会话树(DAG)**,以 JSONL 增量落盘。运行时把"从根到当前叶子"的路径**拍平**成线性消息数组喂给模型。当上下文接近模型窗口上限时,自动触发**压缩**:调用 LLM 把较早的历史总结成一段结构化摘要,只保留最近约 20K tokens 的原文,从而在不丢关键信息的前提下缩短上下文。用户在会话树中切换分支时,被放弃分支的进度会被总结为**分支摘要**保留下来。

核心流程摘要:
```
追加消息 → appendEntry 落盘(JSONL 一行)
         → 用最后一条 assistant 的 usage 估算 contextTokens
         → shouldCompact? → prepareCompaction(找切割点)
                          → generateSummary(调 LLM 生成摘要)
                          → appendCompaction(写入 CompactionEntry)
                          → buildSessionContext 重建为"摘要 + 近期消息"
```

## 3. 关键源码入口

- [session.ts](../../packages/agent/src/harness/session/session.ts) — `buildSessionContext()`(树→线性消息)、`Session` 类(`appendMessage` / `appendCompaction` / `moveTo`)。
- [compaction.ts](../../packages/agent/src/harness/compaction/compaction.ts) — `shouldCompact()` / `estimateContextTokens()` / `prepareCompaction()` / `generateSummary()` / `compact()`,以及默认阈值 `DEFAULT_COMPACTION_SETTINGS`。
- [branch-summarization.ts](../../packages/agent/src/harness/compaction/branch-summarization.ts) — `collectEntriesForBranchSummary()` / `generateBranchSummary()`。
- [messages.ts](../../packages/agent/src/harness/messages.ts) — `convertToLlm()`,把内部消息(含摘要)翻译成标准 LLM 消息。
- [jsonl-storage.ts](../../packages/agent/src/harness/session/jsonl-storage.ts) — JSONL 读写与树导航。
- [types.ts](../../packages/agent/src/harness/types.ts) — `SessionTreeEntry` 等数据结构。
- [agent-session.ts](../../packages/coding-agent/src/core/agent-session.ts) — coding-agent 侧集成:压缩触发、树导航。
- [config.ts](../../packages/coding-agent/src/config.ts) — `getSessionsDir()` 会话存储路径。

## 4. 主流程详解

### 4.1 起点:消息落盘与会话树

每次对话产生的消息、模型切换、压缩、分支摘要都是一个 `SessionTreeEntry`,通过 `parentId` 串成树([types.ts:404-414](../../packages/agent/src/harness/types.ts))。`appendEntry()` 每次只**追加一行 JSON**到会话文件([jsonl-storage.ts:250-259](../../packages/agent/src/harness/session/jsonl-storage.ts)),不重写整个文件;同时更新内存索引和当前 `leafId`。会话文件存于 `~/.pi/agent/sessions/`,按 cwd 分组([getSessionsDir() config.ts:515](../../packages/coding-agent/src/config.ts)),第一行是 `SessionHeader`(version=3、id、cwd、parentSession)。

### 4.2 中间调度:树 → 线性消息

[buildSessionContext() session.ts:21-76](../../packages/agent/src/harness/session/session.ts) 把"根到叶子"的路径拍平:
1. 先遍历一遍路径,追踪 `thinkingLevel`、`model`,并记录**最后一个** `CompactionEntry`([session.ts:26-36](../../packages/agent/src/harness/session/session.ts))。
2. 若存在压缩:先 push 一条**压缩摘要消息**,然后只从 `firstKeptEntryId` 开始追加压缩点**之前**的 entry(用 `foundFirstKept` 标志位控制,`firstKeptEntryId` 之前的历史被丢弃、由摘要代表),再追加压缩点**之后**的全部 entry([session.ts:57-68](../../packages/agent/src/harness/session/session.ts))。
3. 若无压缩:原样追加所有消息([session.ts:69-73](../../packages/agent/src/harness/session/session.ts))。

### 4.3 核心实现:压缩

**是否压缩** — [shouldCompact() compaction.ts:196-199](../../packages/agent/src/harness/compaction/compaction.ts):`enabled && contextTokens > contextWindow - reserveTokens`。默认 `reserveTokens=16384`、`keepRecentTokens=20000`([DEFAULT_COMPACTION_SETTINGS compaction.ts:112-116](../../packages/agent/src/harness/compaction/compaction.ts))。

**token 估算** — 优先用真实 usage:[estimateContextTokens() compaction.ts:165-193](../../packages/agent/src/harness/compaction/compaction.ts) 找最后一条**成功**的 assistant 消息的 `usage`(`getAssistantUsage` 会跳过 `aborted`/`error`,见 [compaction.ts:122-130](../../packages/agent/src/harness/compaction/compaction.ts)),用 `calculateContextTokens` 取值,再加上其后新增消息的估算尾巴;若完全没有 usage 则整体估算。单条估算 [estimateTokens() compaction.ts:202-260](../../packages/agent/src/harness/compaction/compaction.ts) 用 `字符数/4`,图片按 4800 tokens 计。

**准备压缩** — [prepareCompaction() compaction.ts:541-606](../../packages/agent/src/harness/compaction/compaction.ts):
- 若路径为空、或最后一个 entry 已是压缩,直接返回 `undefined`(不重复压缩)。
- 找到上一次压缩点,取其 `summary` 作为 `previousSummary`,并把 `boundaryStart` 设到上次 `firstKeptEntryId`——**只压缩上次压缩之后新增的内容**(增量)。
- [findCutPoint()](../../packages/agent/src/harness/compaction/compaction.ts) 从尾部往前累计 token 到 `keepRecentTokens` 预算,选一个**安全切割点**:切割只允许发生在 user/assistant/bashExecution/custom/摘要类消息边界,**绝不切在 `toolResult` 中间**([findValidCutPoints compaction.ts:261-298](../../packages/agent/src/harness/compaction/compaction.ts)),以免破坏一个 tool 调用批次。
- 若必须切开一个 turn(`isSplitTurn`),该 turn 的前缀会被单独收集为 `turnPrefixMessages` 另行总结。
- 遍历将被压缩的消息,提取其中的文件读/写/编辑列表(`fileOps`),供摘要保留。

**生成摘要** — [generateSummary() compaction.ts:455-518](../../packages/agent/src/harness/compaction/compaction.ts):把待压缩消息 `serializeConversation` 后包进 `<conversation>`,若有旧摘要则附上 `<previous-summary>` 并改用 `UPDATE_SUMMARIZATION_PROMPT`(增量更新)。用 `completeSimple` 调 LLM,`maxTokens = min(0.8 * reserveTokens, model.maxTokens)`。系统提示 `SUMMARIZATION_SYSTEM_PROMPT` 规定摘要结构:`## Goal / ## Constraints & Preferences / ## Progress(Done/In Progress/Blocked)/ ## Key Decisions / ## Next Steps / ## Critical Context`,并要求保留确切的文件路径、函数名、报错信息。

**落盘与重建** — `compact()`([compaction.ts:626+](../../packages/agent/src/harness/compaction/compaction.ts))产出结果后,通过 `Session.appendCompaction()` 写入一个 `CompactionEntry`(含 summary、firstKeptEntryId、tokensBefore、fileOps),之后 `buildSessionContext` 重建出精简上下文。

### 4.4 收尾与副作用:摘要如何回到模型

摘要不是直接拼进 system prompt,而是作为一条特殊消息注入历史。[convertToLlm() messages.ts:120-164](../../packages/agent/src/harness/messages.ts) 把 `compactionSummary` 用 `COMPACTION_SUMMARY_PREFIX/SUFFIX` 包成一条 `user` 文本消息、把 `branchSummary` 同理包裹、把 `excludeFromContext` 的 bashExecution 剔除。这也是记忆系统与提示词系统的交汇点:**压缩产物就是在这里变成模型可见的普通消息**。

### 4.5 分支摘要

用户在会话树中从一个叶子跳到另一分支时,[collectEntriesForBranchSummary() branch-summarization.ts](../../packages/agent/src/harness/compaction/branch-summarization.ts) 计算两条路径的最近公共祖先,收集"被放弃分支"的 entry;[generateBranchSummary()](../../packages/agent/src/harness/compaction/branch-summarization.ts) 用同一套 LLM 摘要机制总结,再由 `Session.moveTo()` 改变 `leafId` 并追加一个 `BranchSummaryEntry`,避免丢失已完成的工作。

## 5. 关键实现细节

- **增量压缩**:`prepareCompaction` 以"上次压缩的 firstKeptEntryId"为起点,只总结新增内容,并把旧摘要作为 `<previous-summary>` 传入更新——避免每次都从头总结。
- **切割点安全约束**:`findValidCutPoints` 禁止在 `toolResult` 处切,保证 tool 调用与其结果不被拆散,否则会破坏 turn 结构、导致 provider 报错。
- **usage 优先、估算兜底**:优先信任 provider 回报的真实 token 数;只有拿不到(如首轮、或上条消息是错误/中断)时才用 `字符/4` 估算,保证即使 API 出错也能触发压缩。
- **幂等保护**:最后一个 entry 已是压缩时 `prepareCompaction` 返回 `undefined`,不做无意义的二次压缩。
- **图片计入上下文**:`estimateTokens` 对 image 块固定按 4800 tokens 计。
- **状态位**:`isSplitTurn` 决定是否需要额外总结 turn 前缀;`foundFirstKept` 控制拍平时从哪里开始保留原文。

## 6. 相关文件关系

**主路径**:
- [session.ts](../../packages/agent/src/harness/session/session.ts) — 树拍平 + 会话写入 API(主)。
- [compaction.ts](../../packages/agent/src/harness/compaction/compaction.ts) — 压缩决策/准备/生成/执行(主)。
- [messages.ts](../../packages/agent/src/harness/messages.ts) — 摘要→LLM 消息转换(主)。

**支撑但非主路径**:
- [jsonl-storage.ts](../../packages/agent/src/harness/session/jsonl-storage.ts) / [jsonl-repo.ts](../../packages/agent/src/harness/session/jsonl-repo.ts) — 持久化与 fork。
- [branch-summarization.ts](../../packages/agent/src/harness/compaction/branch-summarization.ts) — 分支切换时的摘要。
- [agent-session.ts](../../packages/coding-agent/src/core/agent-session.ts) — coding-agent 侧触发时机与导航。
- [types.ts](../../packages/agent/src/harness/types.ts) / [config.ts](../../packages/coding-agent/src/config.ts) — 数据结构与路径。

## 7. 时序总结

1. 用户/助手消息通过 `appendEntry` 追加为会话树 entry,JSONL 增量落盘。
2. 每轮结束用最后一条成功 assistant 的 `usage` + 尾部估算得到 `contextTokens`。
3. `shouldCompact(contextTokens, contextWindow, settings)` 判断是否超过 `窗口 - 16384`。
4. 需压缩 → `prepareCompaction` 以上次压缩点为起点,`findCutPoint` 找保留最近 ~20K 的安全切割点。
5. `generateSummary` 调 LLM 生成结构化摘要(有旧摘要则增量更新)。
6. `appendCompaction` 写入 `CompactionEntry`(summary + firstKeptEntryId + fileOps)。
7. `buildSessionContext` 重建:压缩摘要消息 + `firstKeptEntryId` 之后的近期消息。
8. `convertToLlm` 把摘要包成 `user` 消息,连同近期消息发给模型,进入下一轮。
9. (可选)用户切换分支 → `collectEntriesForBranchSummary` + `generateBranchSummary` + `moveTo` 保留被放弃分支进度。

## 8. 边界情况与注意点

- **无 agent 可写的跨会话长期记忆文件**:pi 不存在类似 `memory.md` 的全局长期记忆。跨会话连续性靠 fork 时 `parentSession` 链接与摘要,而 CLAUDE.md/AGENTS.md 属于**只读项目指令**(由提示词侧注入,见 [prompt-assembly.md](./prompt-assembly.md)),不属于对话记忆系统。
- **压缩是有损的**:`firstKeptEntryId` 之前的原文被丢弃,只留摘要;摘要质量取决于所用模型。
- **切割约束的代价**:为保 turn 完整,实际保留的 token 可能略多于 `keepRecentTokens`。
- **推断**:`compact()` 之后 `agent.state.messages` 的重建由 coding-agent 侧([agent-session.ts](../../packages/coding-agent/src/core/agent-session.ts))在压缩流程后调用 `buildSessionContext` 完成——本文只逐行确认了 `buildSessionContext` 的重建逻辑,coding-agent 侧的具体调用顺序标记为 `推断:`需进一步核对 agent-session.ts 的压缩处理块。

## 9. 关键证据

- [session.ts:21-76](../../packages/agent/src/harness/session/session.ts) — `buildSessionContext`,压缩重建逻辑在 57-68。
- [compaction.ts:112-116](../../packages/agent/src/harness/compaction/compaction.ts) — `DEFAULT_COMPACTION_SETTINGS`(16384 / 20000)。
- [compaction.ts:196-199](../../packages/agent/src/harness/compaction/compaction.ts) — `shouldCompact`。
- [compaction.ts:165-193](../../packages/agent/src/harness/compaction/compaction.ts) — `estimateContextTokens`。
- [compaction.ts:202-260](../../packages/agent/src/harness/compaction/compaction.ts) — `estimateTokens`(image=4800)。
- [compaction.ts:261-298](../../packages/agent/src/harness/compaction/compaction.ts) — `findValidCutPoints`(toolResult 不可切)。
- [compaction.ts:541-606](../../packages/agent/src/harness/compaction/compaction.ts) — `prepareCompaction`(增量、split-turn)。
- [compaction.ts:455-518](../../packages/agent/src/harness/compaction/compaction.ts) — `generateSummary`(摘要结构、maxTokens)。
- [messages.ts:120-164](../../packages/agent/src/harness/messages.ts) — `convertToLlm`(摘要→user 消息)。
- [jsonl-storage.ts:250-259](../../packages/agent/src/harness/session/jsonl-storage.ts) — `appendEntry`。
- [config.ts:515](../../packages/coding-agent/src/config.ts) — `getSessionsDir`。
