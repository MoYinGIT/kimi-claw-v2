/**
 * Permission Configuration System (Simplified - No external deps)
 * Manages user permission rules and settings
 */
/**
 * Permission configuration structure
 */
export interface PermissionConfig {
    version: string;
    lastModified?: string;
    rules: {
        alwaysAllow: string[];
        alwaysDeny: string[];
        alwaysAsk: string[];
    };
    toolOverrides: Record<string, {
        allow?: boolean;
        ask?: boolean;
        deny?: boolean;
        reason?: string;
    }>;
    settings: {
        defaultPermissionLevel: 'ask' | 'allow' | 'deny';
        logAllExecutions: boolean;
        maxExecutionHistory: number;
        showPermissionPrompts: boolean;
    };
}
/**
 * Default permission configuration
 */
export declare const DEFAULT_PERMISSION_CONFIG: PermissionConfig;
/**
 * Permission Configuration Manager
 */
export declare class PermissionManager {
    private config;
    private configPath;
    private readonly configDir;
    constructor(configDir?: string);
    /**
     * Validate configuration object
     */
    private validateConfig;
    /**
     * Initialize configuration directory and files
     */
    initialize(): void;
    /**
     * Load configuration from disk
     */
    private loadConfig;
    /**
     * Deep clone an object
     */
    private deepClone;
    /**
     * Save configuration to disk
     */
    private saveConfig;
    /**
     * Get current configuration
     */
    getConfig(): PermissionConfig;
    /**
     * Update configuration
     */
    updateConfig(updates: Partial<PermissionConfig>): void;
    /**
     * Add a tool to alwaysAllow list
     */
    allowTool(toolName: string): void;
    /**
     * Add a tool to alwaysDeny list
     */
    denyTool(toolName: string): void;
    /**
     * Add a tool to alwaysAsk list
     */
    askTool(toolName: string): void;
    /**
     * Check if a tool is allowed
     */
    isAllowed(toolName: string): boolean;
    /**
     * Check if a tool is denied
     */
    isDenied(toolName: string): boolean;
    /**
     * Check if a tool requires asking
     */
    isAskRequired(toolName: string): boolean;
    /**
     * Get the effective permission for a tool
     */
    getToolPermission(toolName: string): 'allow' | 'deny' | 'ask';
    /**
     * Reset to default configuration
     */
    resetToDefaults(): void;
    /**
     * Export configuration as JSON string
     */
    exportConfig(): string;
    /**
     * Import configuration from JSON string
     */
    importConfig(jsonString: string): void;
    /**
     * Get configuration file path
     */
    getConfigPath(): string;
}
export declare const globalPermissionManager: PermissionManager;
//# sourceMappingURL=PermissionManager.d.ts.map