/**
 * Tools Index
 * Export all available tools
 */

export { WebSearchTool } from './WebSearchTool.js';
export { FileReadTool } from './FileReadTool.js';
export { FileWriteTool } from './FileWriteTool.js';
export { AgentTool } from './AgentTool.js';
export { BashTool } from './BashTool.js';
export { MessageTool } from './MessageTool.js';

// Tool registry setup helper
import { globalToolRegistry } from '../core/ToolRegistry.js';
import { ToolCategory } from '../core/Tool.js';
import { WebSearchTool } from './WebSearchTool.js';
import { FileReadTool } from './FileReadTool.js';
import { FileWriteTool } from './FileWriteTool.js';
import { AgentTool } from './AgentTool.js';
import { BashTool } from './BashTool.js';
import { MessageTool } from './MessageTool.js';

/**
 * Register all default tools
 */
export function registerDefaultTools(): void {
  globalToolRegistry.register(new WebSearchTool(), ToolCategory.SEARCH, ['web', 'search', 'kimi']);
  globalToolRegistry.register(new FileReadTool(), ToolCategory.FILE, ['file', 'read', 'filesystem']);
  globalToolRegistry.register(new FileWriteTool(), ToolCategory.FILE, ['file', 'write', 'filesystem']);
  globalToolRegistry.register(new AgentTool(), ToolCategory.AGENT, ['agent', 'subagent', 'spawn']);
  globalToolRegistry.register(new BashTool(), ToolCategory.EXEC, ['bash', 'shell', 'exec', 'command']);
  globalToolRegistry.register(new MessageTool(), ToolCategory.MESSAGE, ['message', 'send', 'discord', 'telegram']);
}
