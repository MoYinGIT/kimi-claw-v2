/**
 * Integration Tests for KIMI CLAW v2
 */

import { 
  KIMI_CLAW, 
  PermissionManager, 
  globalPermissionManager,
  DEFAULT_PERMISSION_CONFIG,
  globalToolRegistry,
  registerDefaultTools
} from '../src/index.js';

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function test(name: string, fn: () => void | Promise<void>): void {
  try {
    const result = fn();
    if (result instanceof Promise) {
      result.then(() => {
        console.log(`✅ ${name}`);
        testsPassed++;
      }).catch((err) => {
        console.log(`❌ ${name}: ${err.message}`);
        testsFailed++;
      });
    } else {
      console.log(`✅ ${name}`);
      testsPassed++;
    }
  } catch (err) {
    console.log(`❌ ${name}: ${err instanceof Error ? err.message : String(err)}`);
    testsFailed++;
  }
}

function assertEquals(actual: unknown, expected: unknown, message?: string): void {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertTrue(value: boolean, message?: string): void {
  if (!value) {
    throw new Error(message || 'Expected true, got false');
  }
}

function assertFalse(value: boolean, message?: string): void {
  if (value) {
    throw new Error(message || 'Expected false, got true');
  }
}

// ==================== TESTS ====================

console.log('\n🧪 KIMI CLAW v2 Integration Tests\n');

// Test 1: Tool Registration
test('ToolRegistry - should register default tools', () => {
  globalToolRegistry.clear();
  registerDefaultTools();
  const tools = globalToolRegistry.getAllTools();
  assertEquals(tools.length, 6, 'Should have 6 default tools');
  assertTrue(tools.includes('WebSearchTool'), 'Should include WebSearchTool');
  assertTrue(tools.includes('BashTool'), 'Should include BashTool');
});

// Test 2: Tool Lookup
test('ToolRegistry - should retrieve tool by name', () => {
  const tool = globalToolRegistry.get('WebSearchTool');
  assertTrue(tool !== undefined, 'Should find WebSearchTool');
  assertEquals(tool?.metadata.name, 'WebSearchTool', 'Tool name should match');
});

// Test 3: Tool Category
test('ToolRegistry - should categorize tools', () => {
  const searchTools = globalToolRegistry.getByCategory('search');
  assertTrue(searchTools.includes('WebSearchTool'), 'WebSearchTool should be in search category');
});

// Test 4: Permission Manager - Initialization
test('PermissionManager - should initialize with defaults', () => {
  const pm = new PermissionManager('/tmp/test-kimi-claw');
  pm.initialize();
  const config = pm.getConfig();
  assertEquals(config.version, '1.0.0', 'Should have default version');
  assertTrue(config.rules.alwaysAllow.includes('WebSearchTool'), 'Should have WebSearchTool in allow list');
});

// Test 5: Permission Check - Allowed
test('PermissionManager - should allow listed tools', () => {
  const pm = new PermissionManager('/tmp/test-kimi-claw');
  assertTrue(pm.isAllowed('WebSearchTool'), 'WebSearchTool should be allowed');
  assertFalse(pm.isAskRequired('WebSearchTool'), 'WebSearchTool should not require ask');
});

// Test 6: Permission Check - Ask Required
test('PermissionManager - should require ask for dangerous tools', () => {
  const pm = new PermissionManager('/tmp/test-kimi-claw');
  assertTrue(pm.isAskRequired('BashTool'), 'BashTool should require ask');
  assertFalse(pm.isAllowed('BashTool'), 'BashTool should not be auto-allowed');
});

// Test 7: Permission Modification
test('PermissionManager - should modify permissions', () => {
  const pm = new PermissionManager('/tmp/test-kimi-claw-2');
  pm.initialize();
  
  // Initially not allowed
  assertFalse(pm.isAllowed('TestTool'), 'TestTool should not be allowed initially');
  
  // Allow it
  pm.allowTool('TestTool');
  assertTrue(pm.isAllowed('TestTool'), 'TestTool should be allowed after modification');
  assertFalse(pm.isAskRequired('TestTool'), 'TestTool should not require ask after allowing');
});

// Test 8: Tool Validation - Valid Input
test('WebSearchTool - should validate correct input', () => {
  const tool = globalToolRegistry.get('WebSearchTool');
  assertTrue(tool !== undefined, 'Should find tool');
  
  const validation = tool!.validate({ query: 'test' });
  assertTrue(validation.valid, 'Should validate correct input');
});

// Test 9: Tool Validation - Invalid Input
test('WebSearchTool - should reject invalid input', () => {
  const tool = globalToolRegistry.get('WebSearchTool');
  const validation = tool!.validate({});
  assertFalse(validation.valid, 'Should reject empty input');
  assertTrue(validation.errors!.length > 0, 'Should provide error messages');
});

// Test 10: Tool Execution (Mock)
test('WebSearchTool - should execute with mock result', async () => {
  const tool = globalToolRegistry.get('WebSearchTool');
  const result = await tool!.execute({ query: 'test' });
  assertTrue(result.success, 'Should return success');
  assertTrue(result.data !== undefined, 'Should return data');
});

// Test 11: BashTool - Dangerous Command Detection
test('BashTool - should detect dangerous commands', () => {
  const tool = globalToolRegistry.get('BashTool');
  const validation = tool!.validate({ command: 'rm -rf /' });
  assertFalse(validation.valid, 'Should reject rm -rf /');
});

// Test 12: KIMI_CLAW Integration
test('KIMI_CLAW - should initialize correctly', () => {
  globalToolRegistry.clear();
  registerDefaultTools();
  
  const kimi = new KIMI_CLAW({
    permissions: {
      alwaysAllow: ['WebSearchTool'],
      alwaysDeny: [],
      alwaysAsk: ['BashTool']
    }
  });
  
  assertTrue(kimi.getSessionId().startsWith('session-'), 'Should have session ID');
  
  const tools = kimi.listTools();
  assertEquals(tools.length, 6, 'Should list all tools');
});

// Test 13: Execution History
test('KIMI_CLAW - should track execution history', async () => {
  globalToolRegistry.clear();
  registerDefaultTools();
  
  const kimi = new KIMI_CLAW({
    permissions: {
      alwaysAllow: ['WebSearchTool'],
      alwaysDeny: [],
      alwaysAsk: []
    }
  });
  
  // Execute a tool
  await kimi.execute('WebSearchTool', { query: 'test' });
  
  const history = kimi.getHistory();
  assertEquals(history.length, 1, 'Should have one history entry');
  assertEquals(history[0].toolName, 'WebSearchTool', 'Should record correct tool name');
});

// Test 14: Permission Prompt Flow
test('KIMI_CLAW - should return permission prompt for ask tools', async () => {
  globalToolRegistry.clear();
  registerDefaultTools();
  
  const kimi = new KIMI_CLAW({
    permissions: {
      alwaysAllow: [],
      alwaysDeny: [],
      alwaysAsk: ['BashTool']
    }
  });
  
  const result = await kimi.execute('BashTool', { command: 'ls' });
  
  assertTrue('type' in result && result.type === 'permission_request', 'Should return permission prompt');
});

// Test 15: Tool Describe Action
test('Tools - should describe their actions', () => {
  const tool = globalToolRegistry.get('WebSearchTool');
  const description = tool!.describeAction({ query: 'Claude Code' });
  assertTrue(description.includes('Claude Code'), 'Should include query in description');
});

// ==================== SUMMARY ====================

setTimeout(() => {
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('='.repeat(50) + '\n');
  
  process.exit(testsFailed > 0 ? 1 : 0);
}, 100);
