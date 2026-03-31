/**
 * Tool Registry
 * Central registry for all available tools
 */
export { ToolCategory } from './Tool.js';
export class ToolRegistry {
    tools = new Map();
    categories = new Map();
    /**
     * Register a new tool
     */
    register(tool, category, tags = []) {
        const name = tool.metadata.name;
        if (this.tools.has(name)) {
            throw new Error(`Tool '${name}' is already registered`);
        }
        this.tools.set(name, { tool, category, tags });
        // Update category index
        if (!this.categories.has(category)) {
            this.categories.set(category, new Set());
        }
        this.categories.get(category).add(name);
    }
    /**
     * Unregister a tool
     */
    unregister(name) {
        const entry = this.tools.get(name);
        if (!entry)
            return false;
        this.tools.delete(name);
        this.categories.get(entry.category)?.delete(name);
        return true;
    }
    /**
     * Get a tool by name
     */
    get(name) {
        return this.tools.get(name)?.tool;
    }
    /**
     * Check if a tool exists
     */
    has(name) {
        return this.tools.has(name);
    }
    /**
     * Get all registered tool names
     */
    getAllTools() {
        return Array.from(this.tools.keys());
    }
    /**
     * Get tools by category
     */
    getByCategory(category) {
        return Array.from(this.categories.get(category) || []);
    }
    /**
     * Search tools by tag
     */
    searchByTag(tag) {
        const results = [];
        for (const [name, entry] of this.tools) {
            if (entry.tags.includes(tag)) {
                results.push(name);
            }
        }
        return results;
    }
    /**
     * Execute a tool by name
     * Main entry point for tool execution
     */
    async execute(name, input) {
        const entry = this.tools.get(name);
        if (!entry) {
            return {
                success: false,
                error: `Tool '${name}' not found`
            };
        }
        const tool = entry.tool;
        // Check if tool is enabled
        if (!tool.isEnabled()) {
            return {
                success: false,
                error: `Tool '${name}' is disabled`
            };
        }
        // Validate input
        const validation = tool.validate(input);
        if (!validation.valid) {
            return {
                success: false,
                error: `Validation failed: ${validation.errors?.join(', ')}`
            };
        }
        // Execute tool
        try {
            const result = await tool.execute(input);
            return {
                success: result.success,
                data: result.data,
                error: result.error
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * Get tool metadata for all tools
     * Used for building system prompts
     */
    getToolDescriptions() {
        const descriptions = [];
        for (const [name, entry] of this.tools) {
            descriptions.push({
                name,
                description: entry.tool.metadata.description,
                category: entry.category,
                permission: entry.tool.permissionRequirement.level
            });
        }
        return descriptions;
    }
    /**
     * Clear all registrations
     */
    clear() {
        this.tools.clear();
        this.categories.clear();
    }
}
// Global singleton instance
export const globalToolRegistry = new ToolRegistry();
//# sourceMappingURL=ToolRegistry.js.map