/**
 * Permission Configuration System (Simplified - No external deps)
 * Manages user permission rules and settings
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
/**
 * Default permission configuration
 */
export const DEFAULT_PERMISSION_CONFIG = {
    version: '1.0.0',
    rules: {
        // Read-only operations - safe to allow
        alwaysAllow: [
            'WebSearchTool',
            'WebFetchTool',
            'FileReadTool',
            'kimi_search',
            'kimi_fetch',
            'kimi_finance',
            'read'
        ],
        // Dangerous operations - never allow without explicit override
        alwaysDeny: [
            'SystemModifyTool',
            'UserDataDeleteTool'
        ],
        // Potentially destructive - ask user
        alwaysAsk: [
            'FileWriteTool',
            'FileEditTool',
            'BashTool',
            'AgentTool',
            'MessageTool',
            'write',
            'edit',
            'exec',
            'sessions_spawn',
            'message'
        ]
    },
    toolOverrides: {},
    settings: {
        defaultPermissionLevel: 'ask',
        logAllExecutions: true,
        maxExecutionHistory: 1000,
        showPermissionPrompts: true
    }
};
/**
 * Permission Configuration Manager
 */
export class PermissionManager {
    config;
    configPath;
    configDir;
    constructor(configDir) {
        this.configDir = configDir || join(homedir(), '.kimi-claw');
        this.configPath = join(this.configDir, 'permissions.json');
        this.config = this.loadConfig();
    }
    /**
     * Validate configuration object
     */
    validateConfig(obj) {
        if (typeof obj !== 'object' || obj === null)
            return false;
        const config = obj;
        // Check required fields
        if (!config.version || typeof config.version !== 'string')
            return false;
        if (!config.rules || typeof config.rules !== 'object')
            return false;
        if (!Array.isArray(config.rules.alwaysAllow))
            return false;
        if (!Array.isArray(config.rules.alwaysDeny))
            return false;
        if (!Array.isArray(config.rules.alwaysAsk))
            return false;
        if (!config.settings || typeof config.settings !== 'object')
            return false;
        return true;
    }
    /**
     * Initialize configuration directory and files
     */
    initialize() {
        // Create config directory if not exists
        if (!existsSync(this.configDir)) {
            mkdirSync(this.configDir, { recursive: true });
        }
        // Create default config if not exists
        if (!existsSync(this.configPath)) {
            this.saveConfig(DEFAULT_PERMISSION_CONFIG);
            console.log(`[KIMI CLAW] Created default permissions config at ${this.configPath}`);
        }
    }
    /**
     * Load configuration from disk
     */
    loadConfig() {
        try {
            if (!existsSync(this.configPath)) {
                return this.deepClone(DEFAULT_PERMISSION_CONFIG);
            }
            const content = readFileSync(this.configPath, 'utf-8');
            const parsed = JSON.parse(content);
            // Validate and merge with defaults
            if (this.validateConfig(parsed)) {
                return {
                    ...DEFAULT_PERMISSION_CONFIG,
                    ...parsed,
                    rules: {
                        ...DEFAULT_PERMISSION_CONFIG.rules,
                        ...parsed.rules
                    },
                    settings: {
                        ...DEFAULT_PERMISSION_CONFIG.settings,
                        ...parsed.settings
                    }
                };
            }
            console.warn('[KIMI CLAW] Invalid permission config, using defaults');
            return this.deepClone(DEFAULT_PERMISSION_CONFIG);
        }
        catch (error) {
            console.error('[KIMI CLAW] Failed to load permission config:', error);
            return this.deepClone(DEFAULT_PERMISSION_CONFIG);
        }
    }
    /**
     * Deep clone an object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    /**
     * Save configuration to disk
     */
    saveConfig(config) {
        const configWithTimestamp = {
            ...config,
            lastModified: new Date().toISOString()
        };
        try {
            writeFileSync(this.configPath, JSON.stringify(configWithTimestamp, null, 2), 'utf-8');
        }
        catch (error) {
            console.error('[KIMI CLAW] Failed to save permission config:', error);
        }
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return this.deepClone(this.config);
    }
    /**
     * Update configuration
     */
    updateConfig(updates) {
        this.config = {
            ...this.config,
            ...updates,
            rules: {
                ...this.config.rules,
                ...updates.rules
            },
            settings: {
                ...this.config.settings,
                ...updates.settings
            }
        };
        this.saveConfig(this.config);
    }
    /**
     * Add a tool to alwaysAllow list
     */
    allowTool(toolName) {
        if (!this.config.rules.alwaysAllow.includes(toolName)) {
            this.config.rules.alwaysAllow.push(toolName);
            // Remove from other lists
            this.config.rules.alwaysAsk = this.config.rules.alwaysAsk.filter(t => t !== toolName);
            this.config.rules.alwaysDeny = this.config.rules.alwaysDeny.filter(t => t !== toolName);
            this.saveConfig(this.config);
        }
    }
    /**
     * Add a tool to alwaysDeny list
     */
    denyTool(toolName) {
        if (!this.config.rules.alwaysDeny.includes(toolName)) {
            this.config.rules.alwaysDeny.push(toolName);
            // Remove from other lists
            this.config.rules.alwaysAllow = this.config.rules.alwaysAllow.filter(t => t !== toolName);
            this.config.rules.alwaysAsk = this.config.rules.alwaysAsk.filter(t => t !== toolName);
            this.saveConfig(this.config);
        }
    }
    /**
     * Add a tool to alwaysAsk list
     */
    askTool(toolName) {
        if (!this.config.rules.alwaysAsk.includes(toolName)) {
            this.config.rules.alwaysAsk.push(toolName);
            // Remove from other lists
            this.config.rules.alwaysAllow = this.config.rules.alwaysAllow.filter(t => t !== toolName);
            this.config.rules.alwaysDeny = this.config.rules.alwaysDeny.filter(t => t !== toolName);
            this.saveConfig(this.config);
        }
    }
    /**
     * Check if a tool is allowed
     */
    isAllowed(toolName) {
        return this.config.rules.alwaysAllow.includes(toolName) ||
            this.config.toolOverrides[toolName]?.allow === true;
    }
    /**
     * Check if a tool is denied
     */
    isDenied(toolName) {
        return this.config.rules.alwaysDeny.includes(toolName) ||
            this.config.toolOverrides[toolName]?.deny === true;
    }
    /**
     * Check if a tool requires asking
     */
    isAskRequired(toolName) {
        if (this.config.rules.alwaysAsk.includes(toolName))
            return true;
        if (this.config.toolOverrides[toolName]?.ask === true)
            return true;
        // Check default setting
        return this.config.settings.defaultPermissionLevel === 'ask';
    }
    /**
     * Get the effective permission for a tool
     */
    getToolPermission(toolName) {
        if (this.isDenied(toolName))
            return 'deny';
        if (this.isAllowed(toolName))
            return 'allow';
        return 'ask';
    }
    /**
     * Reset to default configuration
     */
    resetToDefaults() {
        this.config = this.deepClone(DEFAULT_PERMISSION_CONFIG);
        this.saveConfig(this.config);
    }
    /**
     * Export configuration as JSON string
     */
    exportConfig() {
        return JSON.stringify(this.config, null, 2);
    }
    /**
     * Import configuration from JSON string
     */
    importConfig(jsonString) {
        const parsed = JSON.parse(jsonString);
        if (this.validateConfig(parsed)) {
            this.config = parsed;
            this.saveConfig(this.config);
        }
        else {
            throw new Error('Invalid permission configuration');
        }
    }
    /**
     * Get configuration file path
     */
    getConfigPath() {
        return this.configPath;
    }
}
// Export singleton instance
export const globalPermissionManager = new PermissionManager();
//# sourceMappingURL=PermissionManager.js.map