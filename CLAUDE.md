---
title: KIMI CLAW v2
description: Agent system inspired by Claude Code architecture
version: 2.0.0
author: 明夷 (MoYin Claw)
tags: ai, agent, typescript, mcp
---

# KIMI CLAW v2 - 项目上下文

## 架构概览

KIMI CLAW v2 是一个受 Claude Code 启发的 **完整Agent系统**，支持多轮推理、MCP协议、多Agent协作。

### 核心组件

| 组件 | 文件 | 职责 |
|:---|:---|:---|
| **AgentLoop** | `core/AgentLoop.ts` | 多轮推理引擎 |
| **ContextCompressor** | `core/ContextCompressor.ts` | 上下文压缩 |
| **MCPServer** | `core/MCPServer.ts` | MCP协议服务端 ⭐ |
| **MultiAgentCoordinator** | `core/MultiAgentCoordinator.ts` | 多Agent协调器 ⭐ |
| Tool | `core/Tool.ts` | 工具抽象基类 |
| ToolRegistry | `core/ToolRegistry.ts` | 工具注册中心 |
| ToolExecutor | `core/ToolExecutor.ts` | 工具执行引擎 |
| PermissionManager | `core/PermissionManager.ts` | 权限配置管理 |
| CLAUDELoader | `core/CLAUDELoader.ts` | CLAUDE.md 加载 |
| SessionManager | `core/SessionManager.ts` | 会话持久化 |

### 完整架构图

```
┌─────────────────────────────────────────────────────────┐
│                    KIMI CLAW v2                        │
├─────────────────────────────────────────────────────────┤
│  Agent Loop → 思考 → 工具调用 → 观察 → 循环/完成      │
├─────────────────────────────────────────────────────────┤
│  MCP Server ←→ External MCP Clients                    │
├─────────────────────────────────────────────────────────┤
│  Multi-Agent Coordinator                               │
│  ├─ Agent A (Researcher)                               │
│  ├─ Agent B (Coder)                                    │
│  └─ Agent C (Reviewer)                                 │
├─────────────────────────────────────────────────────────┤
│  Tool Registry (WebSearch, FileRead, Bash, ...)        │
├─────────────────────────────────────────────────────────┤
│  Session Persistence (JSONL) + CLAUDE.md Loader        │
└─────────────────────────────────────────────────────────┘
```

## 快速使用

### 1. 基础工具调用
```typescript
const kimi = new KIMI_CLAW();
const result = await kimi.execute('WebSearchTool', { query: 'AI news' });
```

### 2. Agent模式（多轮推理）
```typescript
const kimi = new KIMI_CLAW({ enableAgentLoop: true });
const state = await kimi.runAgent('搜索并总结AI新闻');
```

### 3. MCP协议支持 ⭐
```typescript
const kimi = new KIMI_CLAW({ enableMCP: true });

// 处理MCP请求
const response = await kimi.handleMCPRequest({
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list'
});
```

### 4. 多Agent协作 ⭐
```typescript
const kimi = new KIMI_CLAW({ enableMultiAgent: true });

// 注册多个Agent
kimi.registerAgent({
  id: 'researcher',
  name: 'Research Agent',
  role: 'research',
  capabilities: ['search', 'summarize']
});

kimi.registerAgent({
  id: 'coder',
  name: 'Code Agent', 
  role: 'coding',
  capabilities: ['read', 'write', 'execute']
});

// 分配任务
const task1 = kimi.assignTask({
  agentId: 'researcher',
  task: 'Search for latest AI frameworks',
  priority: 'high'
});

const task2 = kimi.assignTask({
  agentId: 'coder',
  task: 'Implement example code',
  priority: 'medium'
});

// 并行执行
const results = await kimi.executeTasks(
  [task1.taskId, task2.taskId], 
  'parallel'
);
```

### 5. 协作策略
```typescript
// 顺序执行
await kimi.executeTasks(taskIds, 'sequential');

// 并行执行
await kimi.executeTasks(taskIds, 'parallel');

// 管道模式（A输出→B输入）
await kimi.executeTasks(taskIds, 'pipeline');

// 层级模式（Manager分配Worker）
await kimi.executeTasks(taskIds, 'hierarchical');
```

## 项目里程碑

| 阶段 | 目标日期 | 状态 | 关键特性 |
|:---|:---:|:---:|:---|
| Phase 1: P0核心 | 2026-04-03 | ✅ | Tool系统、权限管理 |
| Phase 2: P1功能 | 2026-04-07 | ✅ | CLAUDE.md、会话持久化 |
| Phase 3: P2进阶 | 2026-04-14 | ✅ | Agent Loop、上下文压缩 |
| **Phase 4: P3生态** | **2026-04-21** | **✅** | **MCP协议、多Agent协作** |
| Phase 5: P4发布 | 2026-04-30 | ⏳ | 文档完善、正式发布 |

## 核心特性

### ✅ 全部实现
- [x] Tool抽象与注册系统
- [x] 五级权限管理
- [x] CLAUDE.md自动加载
- [x] JSONL会话持久化 (`/continue`, `/fork`)
- [x] Agent Loop多轮推理
- [x] 智能上下文压缩（4种策略）
- [x] **MCP协议支持** ⭐
- [x] **多Agent协作** ⭐
- [x] 4种协作策略（顺序/并行/管道/层级）

## 参考资源

- Phase 1 报告: `memory/kimi-claw-v2-phase1-complete.md`
- Phase 2 报告: `memory/kimi-claw-v2-phase2-report.md`
- Phase 3 报告: `memory/kimi-claw-v2-phase3-report.md`
- Phase 4 报告: `memory/kimi-claw-v2-phase4-report.md`
- 项目管理: `memory/project-mingyi-v2.md`

---

> 「道生一，一生二，二生三，三生万物」—《道德经》
> 
> KIMI CLAW v2 已完成从"工具"到"Agent"再到"Agent生态"的完整进化。
