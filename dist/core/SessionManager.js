/**
 * Session Persistence Manager
 * Handles JSONL-based session storage with /continue and /fork support
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
/**
 * Session Persistence Manager
 */
export class SessionManager {
    sessionsDir;
    indexPath;
    currentSessionId = null;
    constructor(sessionsDir) {
        this.sessionsDir = sessionsDir || join(homedir(), '.kimi-claw', 'sessions');
        this.indexPath = join(this.sessionsDir, 'index.json');
        this.initialize();
    }
    /**
     * Initialize sessions directory
     */
    initialize() {
        if (!existsSync(this.sessionsDir)) {
            mkdirSync(this.sessionsDir, { recursive: true });
        }
        if (!existsSync(this.indexPath)) {
            writeFileSync(this.indexPath, JSON.stringify({ sessions: [] }, null, 2));
        }
    }
    /**
     * Generate session ID
     */
    generateSessionId() {
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
        const random = Math.random().toString(36).substring(2, 6);
        return `${dateStr}-${random}`;
    }
    /**
     * Get session file path
     */
    getSessionFilePath(sessionId) {
        return join(this.sessionsDir, `${sessionId}.jsonl`);
    }
    /**
     * Read session index
     */
    readIndex() {
        try {
            const content = readFileSync(this.indexPath, 'utf-8');
            return JSON.parse(content);
        }
        catch {
            return { sessions: [] };
        }
    }
    /**
     * Write session index
     */
    writeIndex(index) {
        writeFileSync(this.indexPath, JSON.stringify(index, null, 2));
    }
    /**
     * Create a new session
     */
    createSession(options) {
        const sessionId = this.generateSessionId();
        const now = new Date().toISOString();
        const session = {
            metadata: {
                id: sessionId,
                createdAt: now,
                updatedAt: now,
                title: options?.title || `Session ${sessionId}`,
                description: options?.description,
                isArchived: false,
                messageCount: 0
            },
            messages: []
        };
        // Create empty JSONL file
        writeFileSync(this.getSessionFilePath(sessionId), '');
        // Update index
        const index = this.readIndex();
        index.sessions.unshift({
            id: sessionId,
            title: session.metadata.title || 'Untitled Session',
            createdAt: now,
            updatedAt: now,
            messageCount: 0,
            filePath: this.getSessionFilePath(sessionId),
            isArchived: false
        });
        this.writeIndex(index);
        this.currentSessionId = sessionId;
        return session;
    }
    /**
     * Load a session
     */
    loadSession(sessionId) {
        const filePath = this.getSessionFilePath(sessionId);
        if (!existsSync(filePath)) {
            return null;
        }
        try {
            const content = readFileSync(filePath, 'utf-8');
            const lines = content.split('\n').filter(line => line.trim());
            const messages = [];
            for (const line of lines) {
                try {
                    const msg = JSON.parse(line);
                    messages.push(msg);
                }
                catch {
                    // Skip invalid lines
                }
            }
            // Get metadata from index
            const index = this.readIndex();
            const indexEntry = index.sessions.find(s => s.id === sessionId);
            const session = {
                metadata: {
                    id: sessionId,
                    createdAt: indexEntry?.createdAt || new Date().toISOString(),
                    updatedAt: indexEntry?.updatedAt || new Date().toISOString(),
                    title: indexEntry?.title || `Session ${sessionId}`,
                    isArchived: indexEntry?.isArchived || false,
                    messageCount: messages.length
                },
                messages
            };
            this.currentSessionId = sessionId;
            return session;
        }
        catch (error) {
            console.error(`[Session Manager] Failed to load session ${sessionId}:`, error);
            return null;
        }
    }
    /**
     * Append message to current session
     */
    appendMessage(message) {
        if (!this.currentSessionId) {
            this.createSession();
        }
        const sessionId = this.currentSessionId;
        const fullMessage = {
            ...message,
            timestamp: new Date().toISOString()
        };
        // Append to JSONL file
        const filePath = this.getSessionFilePath(sessionId);
        const line = JSON.stringify(fullMessage) + '\n';
        appendFileSync(filePath, line);
        // Update index
        const index = this.readIndex();
        const entry = index.sessions.find(s => s.id === sessionId);
        if (entry) {
            entry.messageCount++;
            entry.updatedAt = fullMessage.timestamp;
            this.writeIndex(index);
        }
    }
    /**
     * Fork a session at a specific message index
     * /fork command implementation
     */
    forkSession(sessionId, messageIndex, options) {
        const parentSession = this.loadSession(sessionId);
        if (!parentSession) {
            return null;
        }
        // Create new session
        const newSessionId = this.generateSessionId();
        const now = new Date().toISOString();
        // Copy messages up to fork point
        const forkedMessages = parentSession.messages.slice(0, messageIndex + 1);
        const newSession = {
            metadata: {
                id: newSessionId,
                createdAt: now,
                updatedAt: now,
                title: options?.title || `Fork of ${parentSession.metadata.title}`,
                description: options?.description || `Forked from message ${messageIndex + 1}`,
                parentSessionId: sessionId,
                forkedFromMessage: messageIndex,
                isArchived: false,
                messageCount: forkedMessages.length
            },
            messages: forkedMessages
        };
        // Write forked messages to new JSONL file
        const filePath = this.getSessionFilePath(newSessionId);
        const lines = forkedMessages.map(m => JSON.stringify(m)).join('\n') + '\n';
        writeFileSync(filePath, lines);
        // Update index
        const index = this.readIndex();
        index.sessions.unshift({
            id: newSessionId,
            title: newSession.metadata.title || `Fork of ${parentSession.metadata.title || 'Untitled'}`,
            createdAt: now,
            updatedAt: now,
            messageCount: forkedMessages.length,
            filePath,
            isArchived: false
        });
        this.writeIndex(index);
        this.currentSessionId = newSessionId;
        return newSession;
    }
    /**
     * Continue a previous session
     * /continue command implementation
     */
    continueSession(sessionId) {
        const session = this.loadSession(sessionId);
        if (!session) {
            return null;
        }
        // Update current session
        this.currentSessionId = sessionId;
        // Add continuation marker
        this.appendMessage({
            role: 'system',
            content: `[Session continued at ${new Date().toISOString()}]`
        });
        return session;
    }
    /**
     * List all sessions
     */
    listSessions(options) {
        const index = this.readIndex();
        let sessions = index.sessions;
        if (!options?.includeArchived) {
            sessions = sessions.filter(s => !s.isArchived);
        }
        if (options?.limit) {
            sessions = sessions.slice(0, options.limit);
        }
        return sessions;
    }
    /**
     * Archive a session
     */
    archiveSession(sessionId) {
        const index = this.readIndex();
        const entry = index.sessions.find(s => s.id === sessionId);
        if (!entry) {
            return false;
        }
        entry.isArchived = true;
        this.writeIndex(index);
        return true;
    }
    /**
     * Delete a session
     */
    deleteSession(sessionId) {
        const filePath = this.getSessionFilePath(sessionId);
        if (!existsSync(filePath)) {
            return false;
        }
        try {
            // Remove from index
            const index = this.readIndex();
            index.sessions = index.sessions.filter(s => s.id !== sessionId);
            this.writeIndex(index);
            // Delete file (in production, might want to move to trash instead)
            // For now, just mark as archived
            return this.archiveSession(sessionId);
        }
        catch {
            return false;
        }
    }
    /**
     * Get current session ID
     */
    getCurrentSessionId() {
        return this.currentSessionId;
    }
    /**
     * Set current session ID
     */
    setCurrentSessionId(sessionId) {
        this.currentSessionId = sessionId;
    }
    /**
     * Export session as formatted text
     */
    exportSession(sessionId, format = 'markdown') {
        const session = this.loadSession(sessionId);
        if (!session) {
            return '';
        }
        if (format === 'json') {
            return JSON.stringify(session, null, 2);
        }
        // Markdown format
        const lines = [
            `# ${session.metadata.title}`,
            '',
            `**Created**: ${session.metadata.createdAt}`,
            `**Messages**: ${session.messages.length}`,
            ''
        ];
        for (const msg of session.messages) {
            const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
            lines.push(`## ${role} (${msg.timestamp})`);
            lines.push('');
            lines.push(msg.content);
            lines.push('');
        }
        return lines.join('\n');
    }
    /**
     * Get session statistics
     */
    getStats() {
        const index = this.readIndex();
        const sessions = index.sessions;
        return {
            totalSessions: sessions.length,
            totalMessages: sessions.reduce((sum, s) => sum + s.messageCount, 0),
            archivedSessions: sessions.filter(s => s.isArchived).length,
            activeSessions: sessions.filter(s => !s.isArchived).length
        };
    }
}
// Export singleton
export const globalSessionManager = new SessionManager();
//# sourceMappingURL=SessionManager.js.map