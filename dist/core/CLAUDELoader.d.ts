/**
 * CLAUDE.md Loader
 * Auto-discover and load CLAUDE.md from workspace hierarchy
 */
export interface CLAUDEMetadata {
    title?: string;
    description?: string;
    version?: string;
    author?: string;
    tags?: string[];
}
export interface CLAUDESection {
    level: number;
    title: string;
    content: string;
}
export interface CLAUDEContent {
    path: string;
    metadata: CLAUDEMetadata;
    sections: CLAUDESection[];
    raw: string;
}
/**
 * Load a single CLAUDE.md file
 */
export declare function loadCLAUDEFile(filePath: string): CLAUDEContent | null;
/**
 * Find all CLAUDE.md files in directory hierarchy
 * Returns files from root to current (parent to child order)
 */
export declare function findCLAUDEFiles(startPath: string, rootPath?: string): string[];
/**
 * Load and merge CLAUDE.md files from hierarchy
 * Child files override parent files for same sections
 */
export declare function loadCLAUDEHierarchy(startPath: string, rootPath?: string): CLAUDEContent[];
/**
 * Format CLAUDE content as system prompt addition
 */
export declare function formatAsSystemPrompt(contents: CLAUDEContent[]): string;
/**
 * CLAUDE Loader Manager
 */
export declare class CLAUDELoader {
    private cache;
    private rootPath;
    constructor(rootPath?: string);
    /**
     * Load CLAUDE.md for a specific path
     */
    loadForPath(filePath: string): CLAUDEContent[];
    /**
     * Get system prompt addition for a path
     */
    getSystemPrompt(filePath: string): string;
    /**
     * Clear cache
     */
    clearCache(): void;
    /**
     * Reload all CLAUDE files
     */
    reload(filePath: string): CLAUDEContent[];
}
export declare const globalCLAUDELoader: CLAUDELoader;
//# sourceMappingURL=CLAUDELoader.d.ts.map