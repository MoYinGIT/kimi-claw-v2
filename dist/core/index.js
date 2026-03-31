/**
 * KIMI CLAW v2 - Core Module
 * Agent system inspired by Claude Code architecture
 */
export { Tool, ToolCategory } from './Tool.js';
export { ToolRegistry, globalToolRegistry } from './ToolRegistry.js';
export { ToolExecutor } from './ToolExecutor.js';
export { PermissionManager, globalPermissionManager, DEFAULT_PERMISSION_CONFIG } from './PermissionManager.js';
export { CLAUDELoader, globalCLAUDELoader, loadCLAUDEFile, findCLAUDEFiles, loadCLAUDEHierarchy, formatAsSystemPrompt } from './CLAUDELoader.js';
export { SessionManager, globalSessionManager } from './SessionManager.js';
export { AgentLoop, createAgentLoop, DEFAULT_AGENT_CONFIG } from './AgentLoop.js';
export { ContextCompressor, SmartContextManager, DEFAULT_COMPRESSION_CONFIG } from './ContextCompressor.js';
export { MCPServer, MCPClient, createMCPServer, createMCPClient, DEFAULT_MCP_CONFIG } from './MCPServer.js';
export { MultiAgentCoordinator, createMultiAgentCoordinator, DEFAULT_COORDINATOR_CONFIG } from './MultiAgentCoordinator.js';
//# sourceMappingURL=index.js.map