/**
 * Tool Registry
 * Central registry for all available tools
 */
import { Tool, ToolCategory } from './Tool.js';
export { RegisteredTool, ToolCategory } from './Tool.js';
export declare class ToolRegistry {
    private tools;
    private categories;
    /**
     * Register a new tool
     */
    register(tool: Tool, category: ToolCategory, tags?: string[]): void;
    /**
     * Unregister a tool
     */
    unregister(name: string): boolean;
    /**
     * Get a tool by name
     */
    get(name: string): Tool | undefined;
    /**
     * Check if a tool exists
     */
    has(name: string): boolean;
    /**
     * Get all registered tool names
     */
    getAllTools(): string[];
    /**
     * Get tools by category
     */
    getByCategory(category: ToolCategory): string[];
    /**
     * Search tools by tag
     */
    searchByTag(tag: string): string[];
    /**
     * Execute a tool by name
     * Main entry point for tool execution
     */
    execute(name: string, input: unknown): Promise<{
        success: boolean;
        data?: unknown;
        error?: string;
    }>;
    /**
     * Get tool metadata for all tools
     * Used for building system prompts
     */
    getToolDescriptions(): Array<{
        name: string;
        description: string;
        category: ToolCategory;
        permission: string;
    }>;
    /**
     * Clear all registrations
     */
    clear(): void;
}
export declare const globalToolRegistry: ToolRegistry;
//# sourceMappingURL=ToolRegistry.d.ts.map