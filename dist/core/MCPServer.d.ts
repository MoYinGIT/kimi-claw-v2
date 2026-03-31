/**
 * MCP (Model Context Protocol) Server
 * Exposes KIMI CLAW tools as MCP endpoints
 */
import { ToolRegistry } from './ToolRegistry.js';
import { PermissionManager } from './PermissionManager.js';
/**
 * MCP Tool definition
 */
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, unknown>;
        required?: string[];
    };
}
/**
 * MCP Request
 */
export interface MCPRequest {
    jsonrpc: '2.0';
    id: string | number;
    method: string;
    params?: unknown;
}
/**
 * MCP Response
 */
export interface MCPResponse {
    jsonrpc: '2.0';
    id: string | number;
    result?: unknown;
    error?: {
        code: number;
        message: string;
        data?: unknown;
    };
}
/**
 * MCP Server Configuration
 */
export interface MCPServerConfig {
    name: string;
    version: string;
    allowedTools?: string[];
    requireAuth?: boolean;
    authToken?: string;
}
/**
 * Default MCP server config
 */
export declare const DEFAULT_MCP_CONFIG: MCPServerConfig;
/**
 * MCP Server - Expose tools via MCP protocol
 */
export declare class MCPServer {
    private toolRegistry;
    private toolExecutor;
    private permissionManager;
    private config;
    private handlers;
    constructor(toolRegistry: ToolRegistry, permissionManager: PermissionManager, config?: Partial<MCPServerConfig>);
    /**
     * Register MCP method handlers
     */
    private registerHandlers;
    /**
     * Get list of available tools
     */
    private getAvailableTools;
    /**
     * Execute a tool via MCP
     */
    private executeTool;
    /**
     * Handle incoming MCP request
     */
    handleRequest(request: MCPRequest): Promise<MCPResponse>;
    /**
     * Create error response
     */
    private createError;
    /**
     * Process batch requests
     */
    handleBatch(requests: MCPRequest[]): Promise<MCPResponse[]>;
    /**
     * Get server capabilities
     */
    getCapabilities(): {
        tools: {
            listChanged: boolean;
        };
        logging: Record<string, never>;
    };
    /**
     * Update configuration
     */
    updateConfig(config: Partial<MCPServerConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): MCPServerConfig;
}
/**
 * MCP Client - Connect to external MCP servers
 */
export declare class MCPClient {
    private serverUrl;
    private authToken?;
    private tools;
    constructor(serverUrl: string, authToken?: string);
    /**
     * Connect and fetch tool list
     */
    connect(): Promise<MCPTool[]>;
    /**
     * Call a tool on the remote server
     */
    callTool(name: string, args: unknown): Promise<unknown>;
    /**
     * Send request to MCP server
     */
    private sendRequest;
    /**
     * Get cached tool list
     */
    getTools(): MCPTool[];
}
export declare function createMCPServer(toolRegistry: ToolRegistry, permissionManager: PermissionManager, config?: Partial<MCPServerConfig>): MCPServer;
export declare function createMCPClient(serverUrl: string, authToken?: string): MCPClient;
//# sourceMappingURL=MCPServer.d.ts.map