# 以太坊 Fallback 交易分析工具

这是一个用于扫描以太坊区块链并分析交易中 fallback 调用的工具。该工具可以帮助研究人员和开发者识别和分析区块链上的 fallback 交易模式。

## 功能特点

- 扫描指定时间范围内的以太坊区块
- 分析交易中的 fallback 调用
- 支持按交互类型过滤结果
- 将分析结果导出为 CSV 格式
- 记录已扫描区块，避免重复工作

## 安装

```bash
# 克隆仓库
git clone <仓库地址>

# 安装依赖
npm install

# 创建 .env 文件并添加以太坊节点 URL
echo "NODE_URL=https://your-ethereum-node-url" > .env
```

## 使用方法

### 扫描最近几天的区块

```bash
# 扫描最近7天的区块
node scanBlocks.js --days 7

# 扫描最近30天的区块
node scanBlocks.js --days 30
```

### 扫描单个区块

```bash
# 扫描指定区块
node scanBlocks.js --block 21906762
```

### 使用交互类型过滤

```bash
# 启用交互类型过滤
node scanBlocks.js --days 7 --filter true --types "Contract→Contract,EOA→Contract"
```

### 强制重新扫描

```bash
# 强制重新扫描已处理过的区块
node scanBlocks.js --days 7 --force-rescan
```

## 分析单个交易

```bash
# 分析指定交易
node analyzeTx.js <交易哈希>
```

## 输出结果

分析结果将保存在 `fallback_transactions.csv` 文件中，包含以下信息：
- 交易哈希
- 区块号和时间戳
- 发送方和接收方地址
- 交易价值
- 交互类型
- 合约类型信息

## 许可证

[添加许可证信息]
