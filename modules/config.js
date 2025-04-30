// modules/config.js - 配置模块
require('dotenv').config();

// 集中管理配置参数
module.exports = {
  nodeUrl: process.env.ERIGON_NODE_URL || 'http://localhost:8545',
  outputFile: 'fallback_transactions.csv',
  blocksPerBatch: 10,
  delayBetweenBatches: 1000,
  defaultScanDays: 1,
  
  // 交互类型过滤选项
  interactionTypes: [
    'Contract→Contract',  // 合约到合约
    'EOA→Contract',
    'Contract→EOA'     // 钱包到合约
  ],
  
  // 是否启用交互类型过滤
  enableInteractionFilter: true,
  
  // Etherscan API配置
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || '', // 从环境变量获取API密钥
    apiUrl: 'https://api.etherscan.io/api',      // Etherscan API地址
    enabled: true,                               // 是否启用Etherscan元数据获取
    cacheEnabled: true,                          // 是否启用缓存
    cacheFile: 'address_metadata_cache.json'     // 缓存文件路径
  }
}; 