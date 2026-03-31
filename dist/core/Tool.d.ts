/**
 * Tool Interface Definition
 * Inspired by Claude Code's Tool System
 *
 * Core abstraction for all capabilities in KIMI CLAW
 */
export interface ToolMetadata {
    name: string;
    description: string;
    version: string;
    author?: string;
}
export interface ToolInput {
    [key: string]: unknown;
}
export interface ToolOutput {
    success: boolean;
    data?: unknown;
    error?: string;
    metadata?: {
        executionTime?: number;
        tokensUsed?: number;
    };
}
export interface ToolProgress {
    status: 'pending' | 'running' | 'completed' | 'failed';
    message?: string;
    percent?: number;
}
export interface PermissionRequirement {
    level: 'none' | 'low' | 'medium' | 'high' | 'critical';
    reason?: string;
    destructive?: boolean;
}
export declare abstract class Tool<Input extends ToolInput = ToolInput, Output extends ToolOutput = ToolOutput> {
    abstract readonly metadata: ToolMetadata;
    abstract readonly permissionRequirement: PermissionRequirement;
    /**
     * Validate input parameters before execution
     * @param input Tool input parameters
     * @returns Validation result
     */
    abstract validate(input: Input): {
        valid: boolean;
        errors?: string[];
    };
    /**
     * Execute the tool
     * @param input Tool input parameters
     * @returns Tool execution result
     */
    abstract execute(input: Input): Promise<Output>;
    /**
     * Check if tool is enabled (feature flag check)
     * Override for feature-gated tools
     */
    isEnabled(): boolean;
    /**
     * Check if tool is read-only (no side effects)
     * Used for permission optimization
     */
    isReadOnly(): boolean;
    /**
     * Get human-readable description of what this tool does
     * Used for permission prompts
     */
    describeAction(input: Input): string;
    /**
     * Transform input for logging (remove sensitive data)
     */
    sanitizeInput(input: Input): Input;
    /**
     * Transform output for display
     */
    formatOutput(output: Output): string;
}
/**
 * Tool Registry Entry
 */
export interface RegisteredTool {
    tool: Tool;
    category: string;
    tags: string[];
}
/**
 * Tool Categories
 */
export declare enum ToolCategory {
    SEARCH = "search",
    FETCH = "fetch",
    FILE = "file",
    AGENT = "agent",
    EXEC = "exec",
    MESSAGE = "message",
    ANALYSIS = "analysis",
    UTILITY = "utility"
}
//# sourceMappingURL=Tool.d.ts.map