# Feature Implementation Record: conversation-memory

## Metadata
- feature: Conversation memory management (session tree persistence + compaction + branch summary)
- project_root: D:/My/Project/pi
- architecture_index: _ARCHITECTURE/ARCHITECTURE.en.md
- analysis_scope: How pi stores conversation history as a session tree, flattens it to LLM messages, and compacts/summarizes it when the context grows.
- output_date: 2026-07-01
- confidence: high

## Entry Points
- symbol: buildSessionContext
  file: packages/agent/src/harness/session/session.ts
  lines: 21-76
  role: Flattens a root-to-leaf tree path into a linear AgentMessage[]; injects compaction summary and drops pre-cut history.
- symbol: shouldCompact
  file: packages/agent/src/harness/compaction/compaction.ts
  lines: 196-199
  role: Decides whether to compact based on token threshold.
- symbol: prepareCompaction
  file: packages/agent/src/harness/compaction/compaction.ts
  lines: 541-606
  role: Computes cut point, messages to summarize, split-turn prefix, and file ops.

## Core Flow
1. step: Append each message/event as a SessionTreeEntry linked by parentId; write one JSON line.
   file: packages/agent/src/harness/session/jsonl-storage.ts
   lines: 250-259
   symbols: JsonlSessionStorage.appendEntry
   summary: Incremental JSONL append; updates in-memory index and currentLeafId.
   evidence: appendFile(`${JSON.stringify(entry)}\n`)
2. step: Estimate current context tokens from last successful assistant usage plus trailing estimate.
   file: packages/agent/src/harness/compaction/compaction.ts
   lines: 165-193
   symbols: estimateContextTokens, getAssistantUsage, calculateContextTokens
   summary: Trust provider usage; fall back to char/4 estimate when no usage exists.
   evidence: getAssistantUsage skips aborted/error (122-130)
3. step: Check threshold.
   file: packages/agent/src/harness/compaction/compaction.ts
   lines: 196-199
   symbols: shouldCompact
   summary: contextTokens > contextWindow - reserveTokens (default reserve 16384).
   evidence: DEFAULT_COMPACTION_SETTINGS lines 112-116
4. step: Prepare compaction (incremental from previous compaction; safe cut point).
   file: packages/agent/src/harness/compaction/compaction.ts
   lines: 541-606
   symbols: prepareCompaction, findCutPoint, findValidCutPoints, extractFileOperations
   summary: boundaryStart = previous firstKeptEntryId; keep ~keepRecentTokens (20000); never cut inside toolResult; split-turn prefix summarized separately.
   evidence: findValidCutPoints excludes toolResult (261-298)
5. step: Generate summary via LLM.
   file: packages/agent/src/harness/compaction/compaction.ts
   lines: 455-518
   symbols: generateSummary, SUMMARIZATION_SYSTEM_PROMPT, UPDATE_SUMMARIZATION_PROMPT, serializeConversation
   summary: Wrap conversation in <conversation>; include <previous-summary> for incremental update; maxTokens = min(0.8*reserveTokens, model.maxTokens).
   evidence: basePrompt = previousSummary ? UPDATE... : SUMMARIZATION... (470)
6. step: Persist CompactionEntry.
   file: packages/agent/src/harness/session/session.ts
   lines: 159-177
   symbols: Session.appendCompaction
   summary: Append compaction entry (summary, firstKeptEntryId, tokensBefore, details/fileOps).
   evidence: satisfies CompactionEntry
7. step: Rebuild linear context = compaction summary message + entries from firstKeptEntryId onward.
   file: packages/agent/src/harness/session/session.ts
   lines: 57-68
   symbols: buildSessionContext, createCompactionSummaryMessage
   summary: Pre-cut history dropped; represented by the summary message.
   evidence: foundFirstKept flag gate (60-64)
8. step: Convert internal messages (including summaries) to provider Message[].
   file: packages/agent/src/harness/messages.ts
   lines: 120-164
   symbols: convertToLlm
   summary: compactionSummary/branchSummary wrapped as user text messages; excludeFromContext bashExecution dropped.
   evidence: COMPACTION_SUMMARY_PREFIX/SUFFIX (147-154)

## Key Symbols
- symbol: buildSessionContext
  kind: function
  file: packages/agent/src/harness/session/session.ts
  lines: 21-76
  role: Tree path -> linear messages with compaction handling.
  used_by: AgentSession context rebuild; prepareCompaction (tokensBefore)
  calls_into: createCompactionSummaryMessage, createBranchSummaryMessage, createCustomMessage
- symbol: DEFAULT_COMPACTION_SETTINGS
  kind: constant
  file: packages/agent/src/harness/compaction/compaction.ts
  lines: 112-116
  role: enabled=true, reserveTokens=16384, keepRecentTokens=20000
  used_by: shouldCompact, prepareCompaction
  calls_into: n/a
- symbol: estimateTokens
  kind: function
  file: packages/agent/src/harness/compaction/compaction.ts
  lines: 202-260
  role: Per-message conservative token estimate (chars/4; image=4800).
  used_by: estimateContextTokens, findCutPoint
  calls_into: safeJsonStringify
- symbol: findValidCutPoints
  kind: function
  file: packages/agent/src/harness/compaction/compaction.ts
  lines: 261-298
  role: Legal cut boundaries; excludes toolResult to keep tool batches intact.
  used_by: findCutPoint
  calls_into: n/a
- symbol: generateSummary
  kind: function
  file: packages/agent/src/harness/compaction/compaction.ts
  lines: 455-518
  role: LLM summarization with incremental update support.
  used_by: compact
  calls_into: completeSimple, serializeConversation, convertToLlm
- symbol: convertToLlm
  kind: function
  file: packages/agent/src/harness/messages.ts
  lines: 120-164
  role: AgentMessage[] -> provider Message[]; materializes summaries as user messages.
  used_by: agent-loop streamAssistantResponse; generateSummary
  calls_into: bashExecutionToText

## State and Data Changes
- location: packages/agent/src/harness/session/jsonl-storage.ts:250-259
  mutation: Append entry to JSONL file; push to entries[]; set byId; update currentLeafId.
  purpose: Durable incremental persistence of the session tree.
  triggered_by: appendMessage / appendCompaction / moveTo
- location: packages/agent/src/harness/session/session.ts:57-68
  mutation: messages[] built as [compactionSummary, ...keptEntries].
  purpose: Shrink context after compaction.
  triggered_by: buildSessionContext when a CompactionEntry exists on path
- location: packages/agent/src/harness/compaction/compaction.ts:549-564
  mutation: previousSummary / boundaryStart derived from prior compaction.
  purpose: Incremental compaction (summarize only new content since last compaction).
  triggered_by: prepareCompaction

## Decision Points
- condition: contextTokens > contextWindow - reserveTokens
  location: packages/agent/src/harness/compaction/compaction.ts:196-199
  effect_if_true: Compaction is eligible.
  effect_if_false: No compaction.
- condition: last path entry is already a compaction (or path empty)
  location: packages/agent/src/harness/compaction/compaction.ts:545-547
  effect_if_true: prepareCompaction returns undefined (idempotent guard).
  effect_if_false: Proceed to compute cut point.
- condition: cutPoint.isSplitTurn
  location: packages/agent/src/harness/compaction/compaction.ts:576-594
  effect_if_true: Turn prefix summarized separately (turnPrefixMessages).
  effect_if_false: historyEnd = firstKeptEntryIndex.
- condition: entry role === toolResult
  location: packages/agent/src/harness/compaction/compaction.ts:277-278
  effect_if_true: Not a valid cut point (skip).
  effect_if_false: user/assistant/etc. added as cut point.
- condition: bashExecution message has excludeFromContext
  location: packages/agent/src/harness/messages.ts:125-127
  effect_if_true: Dropped from LLM context.
  effect_if_false: Rendered as user text message.

## Side Effects
- effect: LLM call to summarize history.
  location: packages/agent/src/harness/compaction/compaction.ts:495-499
  when: During compaction (generateSummary).
- effect: New JSONL line appended to session file on disk.
  location: packages/agent/src/harness/session/jsonl-storage.ts:250-259
  when: Every entry append.
- effect: leafId changed + BranchSummaryEntry appended.
  location: packages/agent/src/harness/session/session.ts:232-251 (moveTo)
  when: Navigating to a different tree branch.

## Related Files
- file: packages/agent/src/harness/session/session.ts
  relevance: primary
  reason: Tree flattening and session write API.
- file: packages/agent/src/harness/compaction/compaction.ts
  relevance: primary
  reason: All compaction decision/prepare/summarize logic.
- file: packages/agent/src/harness/messages.ts
  relevance: primary
  reason: Summary -> LLM message materialization.
- file: packages/agent/src/harness/session/jsonl-storage.ts
  relevance: secondary
  reason: JSONL persistence and tree navigation.
- file: packages/agent/src/harness/compaction/branch-summarization.ts
  relevance: secondary
  reason: Branch-switch summarization.
- file: packages/coding-agent/src/core/agent-session.ts
  relevance: secondary
  reason: coding-agent-side compaction trigger timing and tree navigation.
- file: packages/agent/src/harness/types.ts
  relevance: context-only
  reason: SessionTreeEntry data structures.
- file: packages/coding-agent/src/config.ts
  relevance: context-only
  reason: getSessionsDir storage location.

## Open Questions
- question: Exact call order that rebuilds agent.state.messages after compact() on the coding-agent side.
  status: partially-answered
  note: buildSessionContext rebuild logic confirmed; the coding-agent trigger block in agent-session.ts (~1785-1845 per prior search) not line-by-line verified in this pass.
- question: Session file naming/versioning migration (v1->v2->v3) details.
  status: unresolved
  note: Header version=3 confirmed; migration path not traced.

## Inferences
- statement: After compact(), coding-agent re-derives agent.state.messages via buildSessionContext.
  basis: buildSessionContext is the only tree->messages flattener and handles compaction; standard rebuild pattern.

## Retrieval Hints
- If asked "when does compaction trigger", start from shouldCompact + DEFAULT_COMPACTION_SETTINGS (compaction.ts:112-199).
- If asked "how is the summary produced", start from generateSummary (compaction.ts:455-518).
- If asked "why isn't old history in context", start from buildSessionContext compaction branch (session.ts:57-68).
- If asked "how are summaries sent to the model", start from convertToLlm (messages.ts:120-164).
- If asked "where are sessions stored", start from getSessionsDir (config.ts:515) + jsonl-storage.ts.
- If asked "why cut points avoid tool results", start from findValidCutPoints (compaction.ts:261-298).
