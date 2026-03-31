/**
 * Tool Interface Definition
 * Inspired by Claude Code's Tool System
 *
 * Core abstraction for all capabilities in KIMI CLAW
 */
export class Tool {
    /**
     * Check if tool is enabled (feature flag check)
     * Override for feature-gated tools
     */
    isEnabled() {
        return true;
    }
    /**
     * Check if tool is read-only (no side effects)
     * Used for permission optimization
     */
    isReadOnly() {
        return this.permissionRequirement.destructive !== true;
    }
    /**
     * Get human-readable description of what this tool does
     * Used for permission prompts
     */
    describeAction(input) {
        return `Execute ${this.metadata.name}`;
    }
    /**
     * Transform input for logging (remove sensitive data)
     */
    sanitizeInput(input) {
        return input;
    }
    /**
     * Transform output for display
     */
    formatOutput(output) {
        if (!output.success) {
            return `Error: ${output.error || 'Unknown error'}`;
        }
        return JSON.stringify(output.data, null, 2);
    }
}
/**
 * Tool Categories
 */
export var ToolCategory;
(function (ToolCategory) {
    ToolCategory["SEARCH"] = "search";
    ToolCategory["FETCH"] = "fetch";
    ToolCategory["FILE"] = "file";
    ToolCategory["AGENT"] = "agent";
    ToolCategory["EXEC"] = "exec";
    ToolCategory["MESSAGE"] = "message";
    ToolCategory["ANALYSIS"] = "analysis";
    ToolCategory["UTILITY"] = "utility";
})(ToolCategory || (ToolCategory = {}));
//# sourceMappingURL=Tool.js.map