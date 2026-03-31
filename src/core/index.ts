/**
 * KIMI CLAW v2 - Core Module
 * Agent system inspired by Claude Code architecture
 */

export { Tool, ToolInput, ToolOutput, ToolMetadata, ToolProgress, PermissionRequirement, ToolCategory } from './Tool.js';
export { ToolRegistry, globalToolRegistry, RegisteredTool } from './ToolRegistry.js';
export { ToolExecutor, ExecutionContext, ExecutionResult, PermissionPrompt } from './ToolExecutor.js';
export { 
  PermissionManager, 
  globalPermissionManager, 
  DEFAULT_PERMISSION_CONFIG,
  type PermissionConfig 
} from './PermissionManager.js';
export {
  CLAUDELoader,
  globalCLAUDELoader,
  loadCLAUDEFile,
  findCLAUDEFiles,
  loadCLAUDEHierarchy,
  formatAsSystemPrompt,
  type CLAUDEContent,
  type CLAUDEMetadata,
  type CLAUDESection
} from './CLAUDELoader.js';
export {
  SessionManager,
  globalSessionManager,
  type Session,
  type SessionMessage,
  type SessionMetadata,
  type SessionIndexEntry
} from './SessionManager.js';
export {
  AgentLoop,
  createAgentLoop,
  DEFAULT_AGENT_CONFIG,
  type AgentStep,
  type AgentState,
  type AgentConfig
} from './AgentLoop.js';
export {
  ContextCompressor,
  SmartContextManager,
  DEFAULT_COMPRESSION_CONFIG,
  type CompressionStrategy,
  type CompressionConfig,
  type CompressedContext
} from './ContextCompressor.js';
export {
  MCPServer,
  MCPClient,
  createMCPServer,
  createMCPClient,
  DEFAULT_MCP_CONFIG,
  type MCPTool,
  type MCPRequest,
  type MCPResponse,
  type MCPServerConfig
} from './MCPServer.js';
export {
  MultiAgentCoordinator,
  createMultiAgentCoordinator,
  DEFAULT_COORDINATOR_CONFIG,
  type AgentDefinition,
  type TaskAssignment,
  type TaskResult,
  type AgentMessage,
  type CoordinatorConfig,
  type CollaborationStrategy
} from './MultiAgentCoordinator.js';
