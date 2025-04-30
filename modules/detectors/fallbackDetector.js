// modules/detectors/fallbackDetector.js - Fallback检测器模块
const { callRpcMethod } = require('../rpcUtils');
const { getInteractionType, getAddressType } = require('./addressTypeDetector');

/**
 * 检测交易trace中是否包含fallback函数调用
 * @param {string} txHash - 交易哈希
 * @param {Object} web3 - Web3实例
 * @param {Array<string>} interactionTypes - 要过滤的交互类型数组，如 ['contract→contract', 'wallet→contract']
 * @returns {Promise<{hasFallback: boolean, calls: Array, filteredCalls: Array}>} 检测结果
 */
async function detectFallback(txHash, web3, interactionTypes = null) {
  try {
    // 调用trace_transaction API
    const traces = await callRpcMethod('trace_transaction', [txHash], web3);
    
    // 如果没有获取到trace数据
    if (!traces || !Array.isArray(traces)) {
      return { hasFallback: false, calls: [], filteredCalls: [] };
    }
    
    // 查找fallback调用 (input为0x的call类型调用)
    const fallbackCalls = traces.filter(trace => 
      trace.action && 
      trace.action.callType === 'call' && 
      trace.action.input === '0x'
    );
    
    // 如果没有指定交互类型过滤，则返回所有fallback调用
    if (!interactionTypes || interactionTypes.length === 0) {
      return { 
        hasFallback: fallbackCalls.length > 0, 
        calls: fallbackCalls,
        filteredCalls: fallbackCalls
      };
    }
    
    // 过滤指定交互类型的fallback调用
    const filteredCalls = [];
    
    for (const call of fallbackCalls) {
      const from = call.action.from;
      const to = call.action.to;
      
      // 获取交互类型
      const interactionType = await getInteractionType(from, to, web3);
      const fromType = await getAddressType(from, web3);
      const toType = await getAddressType(to, web3);
      
      // 检查是否匹配指定的交互类型
      if (interactionTypes.includes(interactionType)) {
        // 添加类型信息到调用对象
        call.interactionType = interactionType;
        call.fromType = fromType;
        call.toType = toType;
        filteredCalls.push(call);
      }
    }
    
    return { 
      hasFallback: fallbackCalls.length > 0,
      calls: fallbackCalls,
      filteredCalls: filteredCalls,
      hasFilteredFallback: filteredCalls.length > 0
    };
    
  } catch (error) {
    console.error(`分析交易 ${txHash} 时出错:`, error.message);
    return { hasFallback: false, calls: [], filteredCalls: [] };
  }
}

module.exports = {
  detectFallback
}; 