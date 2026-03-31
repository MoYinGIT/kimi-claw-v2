/**
 * Context Compression - Smart context window management
 * Reduces token usage while preserving critical information
 */
import { AgentStep } from './AgentLoop.js';
/**
 * Compression strategy
 */
export type CompressionStrategy = 'summarize' | 'sliding_window' | 'selective' | 'hierarchical';
/**
 * Compression config
 */
export interface CompressionConfig {
    strategy: CompressionStrategy;
    targetRatio: number;
    preserveRecent: number;
    preserveToolCalls: boolean;
}
/**
 * Default compression config
 */
export declare const DEFAULT_COMPRESSION_CONFIG: CompressionConfig;
/**
 * Compressed context
 */
export interface CompressedContext {
    originalTokens: number;
    compressedTokens: number;
    compressionRatio: number;
    steps: AgentStep[];
    summary?: string;
    droppedSteps: number;
}
/**
 * Context Compressor
 */
export declare class ContextCompressor {
    private config;
    constructor(config?: Partial<CompressionConfig>);
    /**
     * Compress agent steps to fit within token budget
     */
    compress(steps: AgentStep[], maxTokens: number): CompressedContext;
    /**
     * Sliding window: Keep only most recent messages
     */
    private slidingWindowCompress;
    /**
     * Selective: Keep important steps, drop others
     */
    private selectiveCompress;
    /**
     * Summarize: Create summary of old messages
     */
    private summarizeCompress;
    /**
     * Hierarchical: Multi-level summary
     */
    private hierarchicalCompress;
    /**
     * Score importance of a step
     */
    private scoreImportance;
    /**
     * Generate summary of steps
     * In real implementation, this would call LLM API
     */
    private generateSummary;
    /**
     * Estimate tokens for a single step
     */
    private estimateStepTokens;
    /**
     * Estimate tokens for multiple steps
     */
    private estimateStepsTokens;
    /**
     * Estimate tokens (rough approximation)
     */
    private estimateTokens;
    /**
     * Update config
     */
    updateConfig(config: Partial<CompressionConfig>): void;
    /**
     * Get current config
     */
    getConfig(): CompressionConfig;
}
/**
 * Smart context manager with automatic compression
 */
export declare class SmartContextManager {
    private compressor;
    private maxTokens;
    private compressionThreshold;
    constructor(maxTokens: number, compressionThreshold?: number, compressionConfig?: Partial<CompressionConfig>);
    /**
     * Manage context - compress if needed
     */
    manage(steps: AgentStep[]): CompressedContext;
    /**
     * Force compression
     */
    forceCompress(steps: AgentStep[], targetTokens?: number): CompressedContext;
    /**
     * Estimate tokens
     */
    private estimateStepsTokens;
}
//# sourceMappingURL=ContextCompressor.d.ts.map