// modules/blockUtils.js - 区块工具模块

/**
 * 获取指定天数前的区块号
 * @param {number} days - 天数
 * @param {Object} web3 - Web3实例
 * @returns {Promise<number>} 指定天数前的区块号
 */
async function getPastBlockByDays(days, web3) {
  try {
    // 获取当前区块
    const currentBlock = await web3.eth.getBlockNumber();
    
    // 获取当前区块的时间戳
    const currentBlockData = await web3.eth.getBlock(currentBlock);
    const currentTimestamp = Number(currentBlockData.timestamp);
    
    // 计算指定天数前的时间戳
    const pastTimestamp = currentTimestamp - (days * 24 * 60 * 60);
    
    // 二分查找接近指定天数前的区块
    const targetBlock = await findBlockByTimestamp(pastTimestamp, 1, Number(currentBlock), web3);
    
    console.log(`${days}天前的区块号约为: ${targetBlock}`);
    return targetBlock;
    
  } catch (error) {
    console.error(`获取${days}天前区块号时出错:`, error);
    throw error;
  }
}

/**
 * 二分查找特定时间戳的区块
 * @param {number} targetTimestamp - 目标时间戳
 * @param {number} left - 左边界
 * @param {number} right - 右边界
 * @param {Object} web3 - Web3实例
 * @returns {Promise<number>} 找到的区块号
 */
async function findBlockByTimestamp(targetTimestamp, left, right, web3) {
  let targetBlock = left;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midBlockData = await web3.eth.getBlock(mid);
    
    if (!midBlockData) {
      right = mid - 1;
      continue;
    }
    
    const midTimestamp = Number(midBlockData.timestamp);
    
    if (midTimestamp < targetTimestamp) {
      targetBlock = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return targetBlock;
}

module.exports = {
  getPastBlockByDays,
  findBlockByTimestamp
}; 