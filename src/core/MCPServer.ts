/**
 * MCP (Model Context Protocol) Server
 * Exposes KIMI CLAW tools as MCP endpoints
 */

import { ToolRegistry } from './ToolRegistry.js';
import { ToolExecutor, ExecutionContext } from './ToolExecutor.js';
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
  allowedTools?: string[];  // Whitelist, empty = all
  requireAuth?: boolean;
  authToken?: string;
}

/**
 * Default MCP server config
 */
export const DEFAULT_MCP_CONFIG: MCPServerConfig = {
  name: 'kimi-claw-mcp',
  version: '2.0.0',
  allowedTools: [],
  requireAuth: false
};

/**
 * MCP Server - Expose tools via MCP protocol
 */
export class MCPServer {
  private toolRegistry: ToolRegistry;
  private toolExecutor: ToolExecutor;
  private permissionManager: PermissionManager;
  private config: MCPServerConfig;
  private handlers: Map<string, (params: unknown) => Promise<unknown>> = new Map();

  constructor(
    toolRegistry: ToolRegistry,
    permissionManager: PermissionManager,
    config: Partial<MCPServerConfig> = {}
  ) {
    this.toolRegistry = toolRegistry;
    this.toolExecutor = new ToolExecutor(toolRegistry);
    this.permissionManager = permissionManager;
    this.config = { ...DEFAULT_MCP_CONFIG, ...config };
    
    this.registerHandlers();
  }

  /**
   * Register MCP method handlers
   */
  private registerHandlers(): void {
    // List available tools
    this.handlers.set('tools/list', async () => {
      const tools = this.getAvailableTools();
      return { tools };
    });

    // Call a tool
    this.handlers.set('tools/call', async (params: unknown) => {
      const { name, arguments: args } = params as { name: string; arguments: unknown };
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
  private getAvailableTools(): MCPTool[] {
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
          type: 'object' as const,
          properties: {},  // Would be populated from Tool metadata
          required: []
        }
      }));
  }

  /**
   * Execute a tool via MCP
   */
  private async executeTool(name: string, args: unknown): Promise<unknown> {
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
    const context: ExecutionContext = {
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

    const execResult = result as import('./ToolExecutor.js').ExecutionResult;
    
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
  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
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
    } catch (error) {
      return this.createError(
        request.id,
        -32603,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Create error response
   */
  private createError(id: string | number, code: number, message: string): MCPResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: { code, message }
    };
  }

  /**
   * Process batch requests
   */
  async handleBatch(requests: MCPRequest[]): Promise<MCPResponse[]> {
    return Promise.all(requests.map(req => this.handleRequest(req)));
  }

  /**
   * Get server capabilities
   */
  getCapabilities(): {
    tools: { listChanged: boolean };
    logging: Record<string, never>;
  } {
    return {
      tools: { listChanged: false },
      logging: {}
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MCPServerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): MCPServerConfig {
    return { ...this.config };
  }
}

/**
 * MCP Client - Connect to external MCP servers
 */
export class MCPClient {
  private serverUrl: string;
  private authToken?: string;
  private tools: MCPTool[] = [];

  constructor(serverUrl: string, authToken?: string) {
    this.serverUrl = serverUrl;
    this.authToken = authToken;
  }

  /**
   * Connect and fetch tool list
   */
  async connect(): Promise<MCPTool[]> {
    const response = await this.sendRequest('tools/list', {});
    this.tools = (response.result as { tools: MCPTool[] }).tools;
    return this.tools;
  }

  /**
   * Call a tool on the remote server
   */
  async callTool(name: string, args: unknown): Promise<unknown> {
    const response = await this.sendRequest('tools/call', {
      name,
      arguments: args
    });
    return response.result;
  }

  /**
   * Send request to MCP server
   */
  private async sendRequest(method: string, params: unknown): Promise<MCPResponse> {
    const request: MCPRequest = {
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
  getTools(): MCPTool[] {
    return [...this.tools];
  }
}

// Export factory functions
export function createMCPServer(
  toolRegistry: ToolRegistry,
  permissionManager: PermissionManager,
  config?: Partial<MCPServerConfig>
): MCPServer {
  return new MCPServer(toolRegistry, permissionManager, config);
}

export function createMCPClient(serverUrl: string, authToken?: string): MCPClient {
  return new MCPClient(serverUrl, authToken);
}
