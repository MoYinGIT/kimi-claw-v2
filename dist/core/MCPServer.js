/**
 * MCP (Model Context Protocol) Server
 * Exposes KIMI CLAW tools as MCP endpoints
 */
import { ToolExecutor } from './ToolExecutor.js';
/**
 * Default MCP server config
 */
export const DEFAULT_MCP_CONFIG = {
    name: 'kimi-claw-mcp',
    version: '2.0.0',
    allowedTools: [],
    requireAuth: false
};
/**
 * MCP Server - Expose tools via MCP protocol
 */
export class MCPServer {
    toolRegistry;
    toolExecutor;
    permissionManager;
    config;
    handlers = new Map();
    constructor(toolRegistry, permissionManager, config = {}) {
        this.toolRegistry = toolRegistry;
        this.toolExecutor = new ToolExecutor(toolRegistry);
        this.permissionManager = permissionManager;
        this.config = { ...DEFAULT_MCP_CONFIG, ...config };
        this.registerHandlers();
    }
    /**
     * Register MCP method handlers
     */
    registerHandlers() {
        // List available tools
        this.handlers.set('tools/list', async () => {
            const tools = this.getAvailableTools();
            return { tools };
        });
        // Call a tool
        this.handlers.set('tools/call', async (params) => {
            const { name, arguments: args } = params;
            return this.executeTool(name, args);
        });
        // Get server info
        this.handlers.set('server/info', async () => {
            return {
                name: this.config.name,
                version: this.config.version,
                tools: this.getAvailableTools().length
            };
        });
        // Health check
        this.handlers.set('server/health', async () => {
            return { status: 'healthy', timestamp: new Date().toISOString() };
        });
    }
    /**
     * Get list of available tools
     */
    getAvailableTools() {
        const allTools = this.toolRegistry.getToolDescriptions();
        return allTools
            .filter(tool => {
            // Check whitelist
            if (this.config.allowedTools && this.config.allowedTools.length > 0) {
                return this.config.allowedTools.includes(tool.name);
            }
            return true;
        })
            .map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: {
                type: 'object',
                properties: {}, // Would be populated from Tool metadata
                required: []
            }
        }));
    }
    /**
     * Execute a tool via MCP
     */
    async executeTool(name, args) {
        // Check if tool is allowed
        const allowedTools = this.config?.allowedTools;
        if (allowedTools && allowedTools.length > 0 &&
            !allowedTools.includes(name)) {
            throw new Error(`Tool "${name}" is not allowed`);
        }
        // Check permission
        if (!this.permissionManager.isAllowed(name)) {
            if (this.permissionManager.isDenied(name)) {
                throw new Error(`Tool "${name}" is denied`);
            }
            // Would require user confirmation in real implementation
        }
        // Create execution context
        const context = {
            sessionId: `mcp-${Date.now()}`,
            userId: 'mcp-client',
            timestamp: new Date(),
            permissions: this.permissionManager.getConfig()
        };
        // Execute tool
        const result = await this.toolExecutor.execute(name, args, context, true);
        if ('type' in result && result.type === 'permission_request') {
            throw new Error(`Permission required for tool "${name}"`);
        }
        const execResult = result;
        return {
            content: execResult.output.success
                ? [{ type: 'text', text: JSON.stringify(execResult.output.data) }]
                : [{ type: 'text', text: `Error: ${execResult.output.error}` }],
            isError: !execResult.output.success
        };
    }
    /**
     * Handle incoming MCP request
     */
    async handleRequest(request) {
        try {
            // Validate request
            if (request.jsonrpc !== '2.0') {
                return this.createError(request.id, -32600, 'Invalid Request');
            }
            // Check auth if required
            if (this.config.requireAuth && this.config.authToken) {
                // Auth check would be implemented here
            }
            // Route to handler
            const handler = this.handlers.get(request.method);
            if (!handler) {
                return this.createError(request.id, -32601, `Method not found: ${request.method}`);
            }
            // Execute handler
            const result = await handler(request.params);
            return {
                jsonrpc: '2.0',
                id: request.id,
                result
            };
        }
        catch (error) {
            return this.createError(request.id, -32603, error instanceof Error ? error.message : String(error));
        }
    }
    /**
     * Create error response
     */
    createError(id, code, message) {
        return {
            jsonrpc: '2.0',
            id,
            error: { code, message }
        };
    }
    /**
     * Process batch requests
     */
    async handleBatch(requests) {
        return Promise.all(requests.map(req => this.handleRequest(req)));
    }
    /**
     * Get server capabilities
     */
    getCapabilities() {
        return {
            tools: { listChanged: false },
            logging: {}
        };
    }
    /**
     * Update configuration
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
/**
 * MCP Client - Connect to external MCP servers
 */
export class MCPClient {
    serverUrl;
    authToken;
    tools = [];
    constructor(serverUrl, authToken) {
        this.serverUrl = serverUrl;
        this.authToken = authToken;
    }
    /**
     * Connect and fetch tool list
     */
    async connect() {
        const response = await this.sendRequest('tools/list', {});
        this.tools = response.result.tools;
        return this.tools;
    }
    /**
     * Call a tool on the remote server
     */
    async callTool(name, args) {
        const response = await this.sendRequest('tools/call', {
            name,
            arguments: args
        });
        return response.result;
    }
    /**
     * Send request to MCP server
     */
    async sendRequest(method, params) {
        const request = {
            jsonrpc: '2.0',
            id: Date.now(),
            method,
            params
        };
        // In real implementation, this would make HTTP/WebSocket call
        // For now, return mock response
        return {
            jsonrpc: '2.0',
            id: request.id,
            result: {}
        };
    }
    /**
     * Get cached tool list
     */
    getTools() {
        return [...this.tools];
    }
}
// Export factory functions
export function createMCPServer(toolRegistry, permissionManager, config) {
    return new MCPServer(toolRegistry, permissionManager, config);
}
export function createMCPClient(serverUrl, authToken) {
    return new MCPClient(serverUrl, authToken);
}
//# sourceMappingURL=MCPServer.js.map