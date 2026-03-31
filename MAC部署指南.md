# KIMI CLAW v2 - Mac 本地部署指南

**目标**: 在 Mac 笔记本上部署 KIMI CLAW v2  
**适用系统**: macOS 12+ (Monterey 或更新版本)  
**预计时间**: 10-15 分钟

---

## 📋 前置要求

### 1. 检查 Node.js 版本

打开终端 (Terminal)，运行：

```bash
node --version
```

**要求**: Node.js >= 18.0.0

**如果未安装或版本过低**：

```bash
# 使用 Homebrew 安装/升级 Node.js
brew install node

# 或升级
brew upgrade node
```

如果没有 Homebrew，先安装：
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. 检查 Git

```bash
git --version
```

**如果未安装**：
```bash
brew install git
```

---

## 🚀 部署步骤

### 步骤 1: 创建项目目录

```bash
# 创建项目文件夹
mkdir -p ~/Projects

# 进入项目目录
cd ~/Projects
```

### 步骤 2: 克隆代码

```bash
# 克隆仓库
git clone https://github.com/moyin/kimi-claw-v2.git

# 进入项目目录
cd kimi-claw-v2
```

### 步骤 3: 安装依赖

```bash
# 安装项目依赖
npm install
```

预计耗时：1-2 分钟

### 步骤 4: 编译构建

```bash
# 编译 TypeScript
npm run build
```

如果看到 `dist/` 目录生成，说明编译成功：
```bash
ls dist/
# 应该看到: core/  tools/  index.js  index.d.ts
```

### 步骤 5: 运行测试

```bash
# 运行集成测试
npm test
```

**期望输出**:
```
✅ Tool registration works
✅ Permission system works
✅ Session management works
✅ CLAUDE.md loading works
✅ Agent loop works
✅ Context compression works
...
```

---

## ⚙️ 初始配置

### 1. 创建配置目录

```bash
# 创建配置目录
mkdir -p ~/.kimi-claw/sessions
```

### 2. 创建权限配置文件

```bash
# 创建权限配置文件
cat > ~/.kimi-claw/permissions.json << 'EOF'
{
  "version": "1.0.0",
  "rules": {
    "alwaysAllow": ["WebSearchTool", "FileReadTool"],
    "alwaysAsk": ["BashTool", "AgentTool", "FileWriteTool"],
    "alwaysDeny": []
  },
  "settings": {
    "defaultPermissionLevel": "ask",
    "logAllExecutions": true
  }
}
EOF
```

### 3. 创建测试脚本

```bash
# 创建测试脚本
cat > ~/Projects/test-kimi.mjs << 'EOF'
import { KIMI_CLAW } from './kimi-claw-v2/dist/index.js';

async function main() {
  console.log('🚀 启动 KIMI CLAW v2...\n');
  
  // 初始化
  const kimi = new KIMI_CLAW({
    enableAgentLoop: true,
    autoLoadCLAUDE: true
  });
  
  console.log('✅ 初始化成功!');
  console.log('📋 可用工具:', kimi.listTools().map(t => t.name).join(', '));
  console.log('💾 会话ID:', kimi.getSessionId());
  
  // 测试单个工具
  console.log('\n🔍 测试 WebSearchTool...');
  const result = await kimi.execute('WebSearchTool', {
    query: 'Node.js TypeScript tutorial'
  });
  
  if (result.output.success) {
    console.log('✅ 工具执行成功!');
    console.log('📊 结果:', JSON.stringify(result.output.data, null, 2).substring(0, 200));
  } else {
    console.log('❌ 错误:', result.output.error);
  }
  
  console.log('\n🎉 测试完成!');
}

main().catch(console.error);
EOF
```

运行测试脚本：
```bash
cd ~/Projects
node test-kimi.mjs
```

---

## 🎯 使用示例

### 示例 1: 基础工具调用

创建文件 `~/Projects/example-basic.mjs`：

```javascript
import { KIMI_CLAW } from './kimi-claw-v2/dist/index.js';

const kimi = new KIMI_CLAW();

// 执行工具
const result = await kimi.execute('FileReadTool', {
  path: './kimi-claw-v2/README.md'
});

console.log(result.output.data);
```

运行：
```bash
cd ~/Projects
node example-basic.mjs
```

### 示例 2: Agent 模式

创建文件 `~/Projects/example-agent.mjs`：

```javascript
import { KIMI_CLAW } from './kimi-claw-v2/dist/index.js';

const kimi = new KIMI_CLAW({ enableAgentLoop: true });

// 设置事件监听
kimi.setAgentHandlers({
  onStep: (step) => {
    console.log(`[${step.type}] ${step.content.substring(0, 50)}...`);
  },
  onComplete: (state) => {
    console.log(`\n✅ 完成! 共 ${state.steps.length} 步`);
  }
});

// 运行 Agent
const state = await kimi.runAgent(
  '搜索最新的 AI 新闻并总结前3条'
);

console.log('\n📝 最终结果:', state.steps[state.steps.length - 1]?.content);
```

### 示例 3: MCP 服务端

创建文件 `~/Projects/example-mcp.mjs`：

```javascript
import { KIMI_CLAW } from './kimi-claw-v2/dist/index.js';

const kimi = new KIMI_CLAW({ enableMCP: true });

// 模拟 MCP 请求
const response = await kimi.handleMCPRequest({
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list'
});

console.log('可用工具:', JSON.stringify(response.result, null, 2));
```

### 示例 4: 多 Agent 协作

创建文件 `~/Projects/example-multiagent.mjs`：

```javascript
import { KIMI_CLAW } from './kimi-claw-v2/dist/index.js';

const kimi = new KIMI_CLAW({ enableMultiAgent: true });

// 注册两个 Agent
kimi.registerAgent({
  id: 'researcher',
  name: 'Researcher',
  role: 'researcher',
  capabilities: ['search']
});

kimi.registerAgent({
  id: 'writer',
  name: 'Writer',
  role: 'writer',
  capabilities: ['write']
});

// 分配任务
const task1 = kimi.assignTask({
  agentId: 'researcher',
  task: '搜索 TypeScript 最佳实践',
  priority: 'high'
});

const task2 = kimi.assignTask({
  agentId: 'writer',
  task: '整理搜索结果为文档',
  priority: 'medium'
});

// 并行执行
const results = await kimi.executeTasks(
  [task1.taskId, task2.taskId],
  'parallel'
);

console.log('任务结果:', results);
```

---

## 📂 项目文件结构

部署完成后，你的目录结构应该是：

```
~/Projects/
├── kimi-claw-v2/              # 主项目
│   ├── src/                   # 源代码
│   ├── dist/                  # 编译输出
│   ├── test/                  # 测试
│   ├── README.md              # 英文文档
│   ├── 使用说明书.md          # 中文文档
│   ├── CHANGELOG.md           # 更新日志
│   ├── package.json           # 包配置
│   └── ...
├── test-kimi.mjs              # 测试脚本
├── example-basic.mjs          # 基础示例
├── example-agent.mjs          # Agent 示例
├── example-mcp.mjs            # MCP 示例
└── example-multiagent.mjs     # 多 Agent 示例
```

---

## 🔧 常见问题 (Mac)

### 问题 1: 权限错误 "Permission denied"

**解决**: 修改脚本权限
```bash
chmod +x ~/Projects/test-kimi.mjs
```

### 问题 2: Node.js 版本不兼容

**解决**: 使用 nvm 切换版本
```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重启终端后
nvm install 20
nvm use 20
```

### 问题 3: TypeScript 编译错误

**解决**: 清理并重新构建
```bash
cd ~/Projects/kimi-claw-v2
rm -rf dist/
npm run build
```

### 问题 4: 模块导入错误

**解决**: 确保使用 `.mjs` 扩展名或添加 `package.json`：

```bash
cd ~/Projects
echo '{ "type": "module" }' > package.json
```

### 问题 5: Homebrew 安装失败

**解决**: 手动下载 Node.js
```bash
# 从官网下载安装包
open https://nodejs.org/en/download/

# 下载 macOS 安装包并安装
```

---

## 🔄 更新代码

当有新版本时，更新步骤：

```bash
cd ~/Projects/kimi-claw-v2

# 拉取最新代码
git pull origin main

# 重新安装依赖
npm install

# 重新构建
npm run build

# 运行测试
npm test
```

---

## 🛠️ 开发模式 (可选)

如果你想修改代码：

```bash
cd ~/Projects/kimi-claw-v2

# 启动监视模式（自动编译）
npm run dev

# 修改 src/ 下的代码，会自动重新编译
```

---

## 📊 验证部署成功

运行以下命令验证：

```bash
cd ~/Projects

# 1. 检查版本
node -e "import('./kimi-claw-v2/dist/index.js').then(m => console.log('✅ KIMI CLAW v2 加载成功'))"

# 2. 检查工具列表
node -e "
import { KIMI_CLAW } from './kimi-claw-v2/dist/index.js';
const kimi = new KIMI_CLAW();
console.log('📋 可用工具:', kimi.listTools().length, '个');
console.log(kimi.listTools().map(t => t.name).join('\n'));
"

# 3. 检查配置目录
ls -la ~/.kimi-claw/
```

**成功标志**:
- ✅ 显示 "KIMI CLAW v2 加载成功"
- ✅ 显示 6 个工具名称
- ✅ `~/.kimi-claw/` 目录存在

---

## 🎉 开始使用

现在你可以：

1. **基础使用**: `node example-basic.mjs`
2. **Agent 模式**: `node example-agent.mjs`
3. **MCP 协议**: `node example-mcp.mjs`
4. **多 Agent**: `node example-multiagent.mjs`

详细用法参考：
- 中文说明书: `kimi-claw-v2/使用说明书.md`
- 英文 README: `kimi-claw-v2/README.md`

---

## 📞 获取帮助

遇到问题：

1. 查看说明书中的 **故障排查** 章节
2. 检查 `~/.kimi-claw/` 配置是否正确
3. 重新运行 `npm test` 验证安装

---

**部署完成！** 🎊

KIMI CLAW v2 现在已部署在你的 Mac 上，可以开始使用了。
