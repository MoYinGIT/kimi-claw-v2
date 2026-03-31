/**
 * Tool Executor
 * Handles permission checks, execution, and result processing
 */
import { Tool, ToolOutput } from './Tool.js';
import { ToolRegistry } from './ToolRegistry.js';
import { PermissionConfig } from './PermissionManager.js';
export interface ExecutionContext {
    sessionId: string;
    userId: string;
    timestamp: Date;
    permissions: PermissionConfig;
}
export interface ExecutionResult {
    toolName: string;
    input: unknown;
    output: ToolOutput;
    permissionDecision: 'allowed' | 'denied' | 'asked';
    executionTime: number;
    timestamp: Date;
}
export type PermissionPrompt = {
    type: 'permission_request';
    toolName: string;
    action: string;
    permissionLevel: string;
    reason?: string;
};
export declare class ToolExecutor {
    private registry;
    private executionHistory;
    constructor(registry: ToolRegistry);
    /**
     * Check permission for a tool execution
     */
    checkPermission(tool: Tool, input: unknown, config: PermissionConfig): {
        decision: 'allowed' | 'denied' | 'ask';
        reason?: string;
    };
    /**
     * Execute a tool with full lifecycle management
     */
    execute(toolName: string, input: unknown, context: ExecutionContext, userConfirm?: boolean): Promise<ExecutionResult | PermissionPrompt>;
    /**
     * Get execution history
     */
    getHistory(): ExecutionResult[];
    /**
     * Clear execution history
     */
    clearHistory(): void;
    /**
     * Check if a tool name matches any pattern in the list
     * Supports wildcards: * matches any sequence
     */
    private matchesPattern;
}
//# sourceMappingURL=ToolExecutor.d.ts.map