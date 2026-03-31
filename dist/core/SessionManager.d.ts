/**
 * Session Persistence Manager
 * Handles JSONL-based session storage with /continue and /fork support
 */
/**
 * Session message entry
 */
export interface SessionMessage {
    timestamp: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    metadata?: {
        toolName?: string;
        toolInput?: unknown;
        toolOutput?: unknown;
        [key: string]: unknown;
    };
}
/**
 * Session metadata
 */
export interface SessionMetadata {
    id: string;
    createdAt: string;
    updatedAt: string;
    title?: string;
    description?: string;
    parentSessionId?: string;
    forkedFromMessage?: number;
    isArchived: boolean;
    messageCount: number;
}
/**
 * Complete session data
 */
export interface Session {
    metadata: SessionMetadata;
    messages: SessionMessage[];
}
/**
 * Session index entry
 */
export interface SessionIndexEntry {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messageCount: number;
    filePath: string;
    isArchived: boolean;
}
/**
 * Session Persistence Manager
 */
export declare class SessionManager {
    private sessionsDir;
    private indexPath;
    private currentSessionId;
    constructor(sessionsDir?: string);
    /**
     * Initialize sessions directory
     */
    private initialize;
    /**
     * Generate session ID
     */
    private generateSessionId;
    /**
     * Get session file path
     */
    private getSessionFilePath;
    /**
     * Read session index
     */
    private readIndex;
    /**
     * Write session index
     */
    private writeIndex;
    /**
     * Create a new session
     */
    createSession(options?: {
        title?: string;
        description?: string;
    }): Session;
    /**
     * Load a session
     */
    loadSession(sessionId: string): Session | null;
    /**
     * Append message to current session
     */
    appendMessage(message: Omit<SessionMessage, 'timestamp'>): void;
    /**
     * Fork a session at a specific message index
     * /fork command implementation
     */
    forkSession(sessionId: string, messageIndex: number, options?: {
        title?: string;
        description?: string;
    }): Session | null;
    /**
     * Continue a previous session
     * /continue command implementation
     */
    continueSession(sessionId: string): Session | null;
    /**
     * List all sessions
     */
    listSessions(options?: {
        includeArchived?: boolean;
        limit?: number;
    }): SessionIndexEntry[];
    /**
     * Archive a session
     */
    archiveSession(sessionId: string): boolean;
    /**
     * Delete a session
     */
    deleteSession(sessionId: string): boolean;
    /**
     * Get current session ID
     */
    getCurrentSessionId(): string | null;
    /**
     * Set current session ID
     */
    setCurrentSessionId(sessionId: string): void;
    /**
     * Export session as formatted text
     */
    exportSession(sessionId: string, format?: 'json' | 'markdown'): string;
    /**
     * Get session statistics
     */
    getStats(): {
        totalSessions: number;
        totalMessages: number;
        archivedSessions: number;
        activeSessions: number;
    };
}
export declare const globalSessionManager: SessionManager;
//# sourceMappingURL=SessionManager.d.ts.map