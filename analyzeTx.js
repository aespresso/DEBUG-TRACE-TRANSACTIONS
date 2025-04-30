// analyzeTx.js - 分析单个交易的fallback调用
const { Web3 } = require('web3');
const fs = require('fs');
require('dotenv').config();

// 导入模块
const config = require('./modules/config');
const { detectFallback } = require('./modules/detectors/fallbackDetector');
const { getAddressType } = require('./modules/detectors/addressTypeDetector');
const { writeTransactionToCSV } = require('./modules/outputUtils');

// 初始化Web3
const web3 = new Web3(config.nodeUrl);

/**
 * 获取地址元数据
 * @param {string} address - 以太坊地址
 * @returns {Promise<Object>} 地址元数据
 */
async function getAddressMetadata(address) {
  try {
    // 使用web3直接判断地址类型
    const addressType = await getAddressType(address, web3);
    
    // 这里可以添加获取合约名称的逻辑，例如从Etherscan API获取
    // 简化版本中，我们只返回地址类型
    return {
      contract_name: '',  // 简化版本不获取合约名称
      type: addressType   // 直接使用判断的类型
    };
  } catch (error) {
    console.error(`获取地址元数据失败: ${error.message}`);
    
    // 出错时返回默认元数据
    return {
      contract_name: '',
      type: 'EOA'  // 默认为EOA
    };
  }
}

/**
 * 准备fallback调用数据
 * @param {string} txHash - 交易哈希
 * @param {number} blockNum - 区块号
 * @param {Object} tx - 交易对象
 * @param {Array} calls - fallback调用数组
 * @returns {Promise<Array>} 处理后的调用数据数组
 */
async function prepareFallbackCallsData(txHash, blockNum, tx, calls) {
  console.log(`发现fallback调用: ${txHash} (区块 ${blockNum})`);
  
  // 获取区块信息以获取时间戳
  const block = await web3.eth.getBlock(blockNum);
  const timestamp = block.timestamp;
  // 将时间戳转换为可读的日期时间格式
  // 确保时间戳是数字类型
  const dateTime = new Date(Number(timestamp) * 1000).toISOString();
  
  const callsData = [];
  
  // 为每个fallback调用创建单独的记录
  for (let i = 0; i < calls.length; i++) {
    const call = calls[i];
    
    // 获取发送方和接收方的类型和元数据
    const fromMetadata = await getAddressMetadata(call.action.from);
    const toMetadata = await getAddressMetadata(call.action.to);
    
    // 获取正确的类型
    const fromType = fromMetadata.type;
    const toType = toMetadata.type;
    
    // 构建交互类型
    const interactionType = `${fromType}→${toType}`;
    
    // 计算ETH值 - 确保转换为字符串或数字
    // 修复 BigInt 转换问题
    const valueBI = BigInt(call.action.value || '0x0');
    const ethValue = Number(valueBI) / 1e18;
    
    // 准备记录数据
    const recordData = {
      txHash,
      blockNum,
      timestamp: Number(timestamp),  // 确保是数字类型
      dateTime,
      from: call.action.from,
      to: call.action.to,
      ethValue,
      fallbackCallIndex: i + 1,
      totalFallbackCalls: calls.length,
      interactionType,
      fromType,
      fromContractName: fromMetadata.contract_name,
      toType,
      toContractName: toMetadata.contract_name,
    };
    
    callsData.push(recordData);
  }
  
  return callsData;
}

/**
 * 分析单个交易
 * @param {string} txHash - 交易哈希
 * @param {Object} options - 分析选项
 * @returns {Promise<Object>} 分析结果
 */
async function analyzeTx(txHash, options = {}) {
  try {
    // 初始化Web3（如果未提供）
    const localWeb3 = options.web3 || web3;
    
    // 获取交易信息
    const tx = await localWeb3.eth.getTransaction(txHash);
    if (!tx) {
      console.error(`未找到交易: ${txHash}`);
      return { success: false, error: '未找到交易' };
    }
    
    // 获取交易所在区块
    const blockNum = tx.blockNumber;
    
    // 检测是否包含fallback调用
    const interactionTypes = options.enableInteractionFilter ? options.interactionTypes : null;
    const result = await detectFallback(txHash, localWeb3, interactionTypes);
    
    // 如果启用了交互类型过滤，使用过滤后的调用
    const hasFallback = options.enableInteractionFilter ? result.hasFilteredFallback : result.hasFallback;
    const callsToProcess = options.enableInteractionFilter ? result.filteredCalls : result.calls;
    
    // 如果有fallback调用，准备数据但不写入文件
    let callsData = [];
    if (hasFallback) {
      callsData = await prepareFallbackCallsData(txHash, blockNum, tx, callsToProcess);
    }
    
    return {
      success: true,
      txHash,
      blockNum,
      hasFallback,
      fallbackCalls: callsToProcess,
      callsCount: callsToProcess.length,
      callsData: callsData
    };
  } catch (error) {
    console.error(`分析交易 ${txHash} 时出错:`, error.message);
    return { success: false, error: error.message };
  }
}

// 如果直接运行此脚本，则分析命令行参数中提供的交易
if (require.main === module) {
  const txHash = process.argv[2];
  
  if (!txHash) {
    console.error('请提供交易哈希作为参数');
    console.log('用法: node analyzeTx.js <交易哈希>');
    process.exit(1);
  }
  
  // 执行分析并输出结果
  analyzeTx(txHash)
    .then(result => {
      if (result.success) {
        console.log(`交易 ${result.txHash} 分析完成`);
        if (result.hasFallback) {
          console.log(`发现 ${result.callsCount} 个fallback调用`);
          console.log('调用数据:');
          
          // 使用自定义的 BigInt 处理方式进行序列化
          const replacer = (key, value) => {
            // 检查值是否为 BigInt 类型
            if (typeof value === 'bigint') {
              return value.toString();
            }
            return value;
          };
          
          console.log(JSON.stringify(result.callsData, replacer, 2));
        } else {
          console.log('未发现fallback调用');
        }
      } else {
        console.error(`分析失败: ${result.error}`);
      }
    });
}

module.exports = { 
  analyzeTx,
  getAddressMetadata,
  prepareFallbackCallsData
};