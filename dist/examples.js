/**
 * KIMI CLAW v2 - Usage Examples
 */
import { KIMI_CLAW } from './index.js';
// Example 1: Basic usage with default permissions
async function example1() {
    const kimi = new KIMI_CLAW({
        permissions: {
            version: '1.0.0',
            rules: {
                alwaysAllow: ['WebSearchTool', 'FileReadTool'],
                alwaysAsk: ['FileWriteTool', 'BashTool', 'AgentTool'],
                alwaysDeny: []
            },
            toolOverrides: {},
            settings: {
                defaultPermissionLevel: 'ask',
                logAllExecutions: true,
                maxExecutionHistory: 1000,
                showPermissionPrompts: true
            }
        }
    });
    // Execute a tool (will run immediately if in alwaysAllow)
    const result = await kimi.execute('WebSearchTool', {
        query: 'Claude Code architecture',
        limit: 5
    });
    console.log(result);
}
// Example 2: Permission prompt flow
async function example2() {
    const kimi = new KIMI_CLAW({
        permissions: {
            version: '1.0.0',
            rules: {
                alwaysAllow: [],
                alwaysAsk: ['BashTool'],
                alwaysDeny: []
            },
            toolOverrides: {},
            settings: {
                defaultPermissionLevel: 'ask',
                logAllExecutions: true,
                maxExecutionHistory: 1000,
                showPermissionPrompts: true
            }
        }
    });
    // First call returns permission prompt
    const prompt = await kimi.execute('BashTool', {
        command: 'ls -la'
    });
    if ('type' in prompt && prompt.type === 'permission_request') {
        console.log(`Permission required: ${prompt.action}`);
        // After user confirms, call again with confirmation
        const result = await kimi.execute('BashTool', {
            command: 'ls -la'
        }, true); // user confirmed
        console.log(result);
    }
}
// Example 3: List available tools
async function example3() {
    const kimi = new KIMI_CLAW({
        permissions: {
            version: '1.0.0',
            rules: {
                alwaysAllow: [],
                alwaysAsk: [],
                alwaysDeny: []
            },
            toolOverrides: {},
            settings: {
                defaultPermissionLevel: 'ask',
                logAllExecutions: true,
                maxExecutionHistory: 1000,
                showPermissionPrompts: true
            }
        }
    });
    const tools = kimi.listTools();
    console.log('Available tools:');
    for (const tool of tools) {
        console.log(`- ${tool.name}: ${tool.description} [${tool.permission}]`);
    }
}
// Example 4: Multi-tool workflow (future: Agent Loop)
async function example4() {
    const kimi = new KIMI_CLAW({
        permissions: {
            version: '1.0.0',
            rules: {
                alwaysAllow: ['WebSearchTool'],
                alwaysAsk: ['FileWriteTool'],
                alwaysDeny: []
            },
            toolOverrides: {},
            settings: {
                defaultPermissionLevel: 'ask',
                logAllExecutions: true,
                maxExecutionHistory: 1000,
                showPermissionPrompts: true
            }
        }
    });
    // Step 1: Search
    const searchResult = await kimi.execute('WebSearchTool', {
        query: 'TypeScript best practices 2024'
    });
    if ('output' in searchResult && searchResult.output.success) {
        const data = searchResult.output.data;
        const content = data.results.map(r => r.summary).join('\n');
        // Step 2: Write to file (will prompt for permission)
        const writeResult = await kimi.execute('FileWriteTool', {
            path: './research/typescript-practices.md',
            content: `# TypeScript Best Practices\n\n${content}`
        });
        console.log(writeResult);
    }
}
// Example 5: Sub-agent spawning
async function example5() {
    const kimi = new KIMI_CLAW({
        permissions: {
            version: '1.0.0',
            rules: {
                alwaysAllow: [],
                alwaysAsk: ['AgentTool'],
                alwaysDeny: []
            },
            toolOverrides: {},
            settings: {
                defaultPermissionLevel: 'ask',
                logAllExecutions: true,
                maxExecutionHistory: 1000,
                showPermissionPrompts: true
            }
        }
    });
    const result = await kimi.execute('AgentTool', {
        task: 'Analyze the codebase and find all security vulnerabilities',
        mode: 'run',
        timeout: 300
    }, true); // user confirmed
    console.log(result);
}
export { example1, example2, example3, example4, example5 };
//# sourceMappingURL=examples.js.map