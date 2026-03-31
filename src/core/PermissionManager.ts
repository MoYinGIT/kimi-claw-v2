/**
 * Permission Configuration System (Simplified - No external deps)
 * Manages user permission rules and settings
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

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
export const DEFAULT_PERMISSION_CONFIG: PermissionConfig = {
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
  private config: PermissionConfig;
  private configPath: string;
  private readonly configDir: string;

  constructor(configDir?: string) {
    this.configDir = configDir || join(homedir(), '.kimi-claw');
    this.configPath = join(this.configDir, 'permissions.json');
    this.config = this.loadConfig();
  }

  /**
   * Validate configuration object
   */
  private validateConfig(obj: unknown): obj is PermissionConfig {
    if (typeof obj !== 'object' || obj === null) return false;
    
    const config = obj as Partial<PermissionConfig>;
    
    // Check required fields
    if (!config.version || typeof config.version !== 'string') return false;
    if (!config.rules || typeof config.rules !== 'object') return false;
    if (!Array.isArray(config.rules.alwaysAllow)) return false;
    if (!Array.isArray(config.rules.alwaysDeny)) return false;
    if (!Array.isArray(config.rules.alwaysAsk)) return false;
    if (!config.settings || typeof config.settings !== 'object') return false;
    
    return true;
  }

  /**
   * Initialize configuration directory and files
   */
  initialize(): void {
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
  private loadConfig(): PermissionConfig {
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
    } catch (error) {
      console.error('[KIMI CLAW] Failed to load permission config:', error);
      return this.deepClone(DEFAULT_PERMISSION_CONFIG);
    }
  }

  /**
   * Deep clone an object
   */
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Save configuration to disk
   */
  private saveConfig(config: PermissionConfig): void {
    const configWithTimestamp = {
      ...config,
      lastModified: new Date().toISOString()
    };
    
    try {
      writeFileSync(
        this.configPath,
        JSON.stringify(configWithTimestamp, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('[KIMI CLAW] Failed to save permission config:', error);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): PermissionConfig {
    return this.deepClone(this.config);
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<PermissionConfig>): void {
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
  allowTool(toolName: string): void {
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
  denyTool(toolName: string): void {
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
  askTool(toolName: string): void {
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
  isAllowed(toolName: string): boolean {
    return this.config.rules.alwaysAllow.includes(toolName) ||
           this.config.toolOverrides[toolName]?.allow === true;
  }

  /**
   * Check if a tool is denied
   */
  isDenied(toolName: string): boolean {
    return this.config.rules.alwaysDeny.includes(toolName) ||
           this.config.toolOverrides[toolName]?.deny === true;
  }

  /**
   * Check if a tool requires asking
   */
  isAskRequired(toolName: string): boolean {
    if (this.config.rules.alwaysAsk.includes(toolName)) return true;
    if (this.config.toolOverrides[toolName]?.ask === true) return true;
    
    // Check default setting
    return this.config.settings.defaultPermissionLevel === 'ask';
  }

  /**
   * Get the effective permission for a tool
   */
  getToolPermission(toolName: string): 'allow' | 'deny' | 'ask' {
    if (this.isDenied(toolName)) return 'deny';
    if (this.isAllowed(toolName)) return 'allow';
    return 'ask';
  }

  /**
   * Reset to default configuration
   */
  resetToDefaults(): void {
    this.config = this.deepClone(DEFAULT_PERMISSION_CONFIG);
    this.saveConfig(this.config);
  }

  /**
   * Export configuration as JSON string
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON string
   */
  importConfig(jsonString: string): void {
    const parsed = JSON.parse(jsonString);
    if (this.validateConfig(parsed)) {
      this.config = parsed;
      this.saveConfig(this.config);
    } else {
      throw new Error('Invalid permission configuration');
    }
  }

  /**
   * Get configuration file path
   */
  getConfigPath(): string {
    return this.configPath;
  }
}

// Export singleton instance
export const globalPermissionManager = new PermissionManager();
