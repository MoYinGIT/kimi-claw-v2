/**
 * Tool Executor
 * Handles permission checks, execution, and result processing
 */
export class ToolExecutor {
    registry;
    executionHistory = [];
    constructor(registry) {
        this.registry = registry;
    }
    /**
     * Check permission for a tool execution
     */
    checkPermission(tool, input, config) {
        const name = tool.metadata.name;
        const rules = config.rules;
        // Check always deny list
        if (this.matchesPattern(name, rules.alwaysDeny)) {
            return { decision: 'denied', reason: 'Tool is in always-deny list' };
        }
        // Check always allow list
        if (this.matchesPattern(name, rules.alwaysAllow)) {
            return { decision: 'allowed' };
        }
        // Check always ask list
        if (this.matchesPattern(name, rules.alwaysAsk)) {
            return {
                decision: 'ask',
                reason: tool.describeAction(input)
            };
        }
        // Default based on permission level
        const level = tool.permissionRequirement.level;
        switch (level) {
            case 'none':
            case 'low':
                return { decision: 'allowed' };
            case 'medium':
            case 'high':
            case 'critical':
                return {
                    decision: 'ask',
                    reason: tool.describeAction(input)
                };
            default:
                return { decision: 'ask' };
        }
    }
    /**
     * Execute a tool with full lifecycle management
     */
    async execute(toolName, input, context, userConfirm) {
        const tool = this.registry.get(toolName);
        if (!tool) {
            return {
                toolName,
                input,
                output: {
                    success: false,
                    error: `Tool '${toolName}' not found`
                },
                permissionDecision: 'denied',
                executionTime: 0,
                timestamp: new Date()
            };
        }
        // Check permissions
        const permissionCheck = this.checkPermission(tool, input, context.permissions);
        if (permissionCheck.decision === 'denied') {
            return {
                toolName,
                input,
                output: {
                    success: false,
                    error: `Permission denied: ${permissionCheck.reason}`
                },
                permissionDecision: 'denied',
                executionTime: 0,
                timestamp: new Date()
            };
        }
        if (permissionCheck.decision === 'ask') {
            // Return permission prompt if not confirmed
            if (userConfirm === undefined) {
                return {
                    type: 'permission_request',
                    toolName,
                    action: permissionCheck.reason || `Execute ${toolName}`,
                    permissionLevel: tool.permissionRequirement.level,
                    reason: tool.permissionRequirement.reason
                };
            }
            // User denied
            if (!userConfirm) {
                return {
                    toolName,
                    input,
                    output: {
                        success: false,
                        error: 'User denied permission'
                    },
                    permissionDecision: 'denied',
                    executionTime: 0,
                    timestamp: new Date()
                };
            }
        }
        // Execute the tool
        const startTime = Date.now();
        let output;
        try {
            output = await tool.execute(input);
        }
        catch (error) {
            output = {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
        const executionTime = Date.now() - startTime;
        const result = {
            toolName,
            input: tool.sanitizeInput(input),
            output,
            permissionDecision: permissionCheck.decision === 'ask' && userConfirm ? 'asked' : 'allowed',
            executionTime,
            timestamp: new Date()
        };
        // Record execution
        this.executionHistory.push(result);
        return result;
    }
    /**
     * Get execution history
     */
    getHistory() {
        return [...this.executionHistory];
    }
    /**
     * Clear execution history
     */
    clearHistory() {
        this.executionHistory = [];
    }
    /**
     * Check if a tool name matches any pattern in the list
     * Supports wildcards: * matches any sequence
     */
    matchesPattern(name, patterns) {
        return patterns.some(pattern => {
            if (pattern === name)
                return true;
            if (pattern.includes('*')) {
                const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
                return regex.test(name);
            }
            return false;
        });
    }
}
//# sourceMappingURL=ToolExecutor.js.map