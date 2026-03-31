/**
 * Context Compression - Smart context window management
 * Reduces token usage while preserving critical information
 */
/**
 * Default compression config
 */
export const DEFAULT_COMPRESSION_CONFIG = {
    strategy: 'sliding_window',
    targetRatio: 0.5,
    preserveRecent: 3,
    preserveToolCalls: true
};
/**
 * Context Compressor
 */
export class ContextCompressor {
    config;
    constructor(config = {}) {
        this.config = { ...DEFAULT_COMPRESSION_CONFIG, ...config };
    }
    /**
     * Compress agent steps to fit within token budget
     */
    compress(steps, maxTokens) {
        const originalTokens = this.estimateStepsTokens(steps);
        if (originalTokens <= maxTokens) {
            return {
                originalTokens,
                compressedTokens: originalTokens,
                compressionRatio: 1.0,
                steps: [...steps],
                droppedSteps: 0
            };
        }
        switch (this.config.strategy) {
            case 'sliding_window':
                return this.slidingWindowCompress(steps, maxTokens);
            case 'selective':
                return this.selectiveCompress(steps, maxTokens);
            case 'summarize':
                return this.summarizeCompress(steps, maxTokens);
            case 'hierarchical':
                return this.hierarchicalCompress(steps, maxTokens);
            default:
                return this.slidingWindowCompress(steps, maxTokens);
        }
    }
    /**
     * Sliding window: Keep only most recent messages
     */
    slidingWindowCompress(steps, maxTokens) {
        const preserved = [];
        let currentTokens = 0;
        // Start from most recent
        for (let i = steps.length - 1; i >= 0; i--) {
            const step = steps[i];
            const stepTokens = this.estimateStepTokens(step);
            if (currentTokens + stepTokens <= maxTokens || preserved.length < this.config.preserveRecent) {
                preserved.unshift(step);
                currentTokens += stepTokens;
            }
            else {
                break;
            }
        }
        const originalTokens = this.estimateStepsTokens(steps);
        const droppedSteps = steps.length - preserved.length;
        return {
            originalTokens,
            compressedTokens: currentTokens,
            compressionRatio: currentTokens / originalTokens,
            steps: preserved,
            summary: droppedSteps > 0
                ? `[${droppedSteps} earlier steps omitted for brevity]`
                : undefined,
            droppedSteps
        };
    }
    /**
     * Selective: Keep important steps, drop others
     */
    selectiveCompress(steps, maxTokens) {
        const scored = steps.map((step, index) => ({
            step,
            index,
            score: this.scoreImportance(step, index, steps.length)
        }));
        // Sort by score descending
        scored.sort((a, b) => b.score - a.score);
        // Select steps until token limit
        const selected = [];
        let currentTokens = 0;
        const selectedIndices = new Set();
        // First, preserve recent messages
        for (let i = Math.max(0, steps.length - this.config.preserveRecent); i < steps.length; i++) {
            if (!selectedIndices.has(i)) {
                const step = steps[i];
                const stepTokens = this.estimateStepTokens(step);
                selected.push(step);
                currentTokens += stepTokens;
                selectedIndices.add(i);
            }
        }
        // Then add highest scored remaining steps
        for (const { step, index } of scored) {
            if (selectedIndices.has(index))
                continue;
            const stepTokens = this.estimateStepTokens(step);
            if (currentTokens + stepTokens <= maxTokens) {
                selected.push(step);
                currentTokens += stepTokens;
                selectedIndices.add(index);
            }
        }
        // Sort back to original order
        selected.sort((a, b) => {
            const indexA = steps.indexOf(a);
            const indexB = steps.indexOf(b);
            return indexA - indexB;
        });
        const originalTokens = this.estimateStepsTokens(steps);
        const droppedSteps = steps.length - selected.length;
        return {
            originalTokens,
            compressedTokens: currentTokens,
            compressionRatio: currentTokens / originalTokens,
            steps: selected,
            summary: droppedSteps > 0
                ? `[${droppedSteps} less critical steps omitted]`
                : undefined,
            droppedSteps
        };
    }
    /**
     * Summarize: Create summary of old messages
     */
    summarizeCompress(steps, maxTokens) {
        // Always preserve recent messages
        const preservedCount = this.config.preserveRecent;
        const recentSteps = steps.slice(-preservedCount);
        const oldSteps = steps.slice(0, -preservedCount);
        // Generate summary of old steps (in real implementation, this would call LLM)
        const summary = this.generateSummary(oldSteps);
        const summaryStep = {
            stepNumber: 0,
            timestamp: new Date().toISOString(),
            type: 'thought',
            content: `[Summary of previous ${oldSteps.length} steps]: ${summary}`
        };
        const compressedSteps = oldSteps.length > 0
            ? [summaryStep, ...recentSteps]
            : recentSteps;
        const originalTokens = this.estimateStepsTokens(steps);
        const compressedTokens = this.estimateStepsTokens(compressedSteps);
        return {
            originalTokens,
            compressedTokens,
            compressionRatio: compressedTokens / originalTokens,
            steps: compressedSteps,
            summary,
            droppedSteps: oldSteps.length
        };
    }
    /**
     * Hierarchical: Multi-level summary
     */
    hierarchicalCompress(steps, maxTokens) {
        // Divide into chunks and summarize each
        const chunkSize = 5;
        const chunks = [];
        for (let i = 0; i < steps.length; i += chunkSize) {
            chunks.push(steps.slice(i, i + chunkSize));
        }
        const summarySteps = [];
        for (let i = 0; i < chunks.length - 1; i++) {
            const chunk = chunks[i];
            const summary = this.generateSummary(chunk);
            summarySteps.push({
                stepNumber: i * chunkSize + 1,
                timestamp: chunk[0].timestamp,
                type: 'thought',
                content: `[Steps ${i * chunkSize + 1}-${Math.min((i + 1) * chunkSize, steps.length)}]: ${summary}`
            });
        }
        // Always include last chunk fully
        const lastChunk = chunks[chunks.length - 1];
        const compressedSteps = [...summarySteps, ...lastChunk];
        const originalTokens = this.estimateStepsTokens(steps);
        const compressedTokens = this.estimateStepsTokens(compressedSteps);
        return {
            originalTokens,
            compressedTokens,
            compressionRatio: compressedTokens / originalTokens,
            steps: compressedSteps,
            summary: `Compressed ${chunks.length - 1} chunks into summaries`,
            droppedSteps: steps.length - compressedSteps.length
        };
    }
    /**
     * Score importance of a step
     */
    scoreImportance(step, index, total) {
        let score = 0;
        // Recency bonus
        score += (index / total) * 30;
        // Type-based scoring
        switch (step.type) {
            case 'final_answer':
                score += 100;
                break;
            case 'tool_result':
                score += this.config.preserveToolCalls ? 80 : 40;
                break;
            case 'tool_call':
                score += this.config.preserveToolCalls ? 70 : 30;
                break;
            case 'error':
                score += 60; // Errors are important for debugging
                break;
            case 'thought':
                score += 20;
                break;
        }
        // Content length (longer often means more important)
        score += Math.min(step.content.length / 100, 20);
        return score;
    }
    /**
     * Generate summary of steps
     * In real implementation, this would call LLM API
     */
    generateSummary(steps) {
        const actions = [];
        for (const step of steps) {
            switch (step.type) {
                case 'tool_call':
                    actions.push(`used ${step.metadata?.toolName}`);
                    break;
                case 'tool_result':
                    actions.push('got results');
                    break;
                case 'error':
                    actions.push('encountered error');
                    break;
            }
        }
        if (actions.length === 0) {
            return 'Thought process and analysis';
        }
        return actions.join(', ');
    }
    /**
     * Estimate tokens for a single step
     */
    estimateStepTokens(step) {
        let text = step.content;
        if (step.metadata?.toolInput) {
            text += JSON.stringify(step.metadata.toolInput);
        }
        if (step.metadata?.toolOutput) {
            text += JSON.stringify(step.metadata.toolOutput);
        }
        return this.estimateTokens(text);
    }
    /**
     * Estimate tokens for multiple steps
     */
    estimateStepsTokens(steps) {
        return steps.reduce((sum, step) => sum + this.estimateStepTokens(step), 0);
    }
    /**
     * Estimate tokens (rough approximation)
     */
    estimateTokens(text) {
        return Math.ceil(text.length / 4);
    }
    /**
     * Update config
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Get current config
     */
    getConfig() {
        return { ...this.config };
    }
}
/**
 * Smart context manager with automatic compression
 */
export class SmartContextManager {
    compressor;
    maxTokens;
    compressionThreshold;
    constructor(maxTokens, compressionThreshold = 0.8, compressionConfig) {
        this.maxTokens = maxTokens;
        this.compressionThreshold = compressionThreshold;
        this.compressor = new ContextCompressor(compressionConfig);
    }
    /**
     * Manage context - compress if needed
     */
    manage(steps) {
        const currentTokens = this.estimateStepsTokens(steps);
        const threshold = this.maxTokens * this.compressionThreshold;
        if (currentTokens > threshold) {
            return this.compressor.compress(steps, this.maxTokens);
        }
        return {
            originalTokens: currentTokens,
            compressedTokens: currentTokens,
            compressionRatio: 1.0,
            steps: [...steps],
            droppedSteps: 0
        };
    }
    /**
     * Force compression
     */
    forceCompress(steps, targetTokens) {
        const target = targetTokens || this.maxTokens * 0.5;
        return this.compressor.compress(steps, target);
    }
    /**
     * Estimate tokens
     */
    estimateStepsTokens(steps) {
        return steps.reduce((sum, step) => {
            let text = step.content;
            if (step.metadata?.toolInput) {
                text += JSON.stringify(step.metadata.toolInput);
            }
            return sum + Math.ceil(text.length / 4);
        }, 0);
    }
}
//# sourceMappingURL=ContextCompressor.js.map