// modules/detectors/addressTypeDetector.js - 地址类型检测器模块

/**
 * 检测地址是否为合约
 * @param {string} address - 以太坊地址
 * @param {Object} web3 - Web3实例
 * @returns {Promise<boolean>} 是否为合约
 */
async function isContract(address, web3) {
  try {
    // 获取地址的代码
    const code = await web3.eth.getCode(address);
    // 与check.js保持一致的判断逻辑
    return code !== '0x' && code !== '0x0';
  } catch (error) {
    console.error(`检测地址类型时出错: ${error.message}`);
    return false;
  }
}

/**
 * 检测地址类型
 * @param {string} address - 以太坊地址
 * @param {Object} web3 - Web3实例
 * @returns {Promise<string>} 地址类型 ('Contract' 或 'EOA')
 */
async function getAddressType(address, web3) {
  const isContractAddress = await isContract(address, web3);
  return isContractAddress ? 'Contract' : 'EOA';
}

/**
 * 检测交互类型
 * @param {string} from - 发送方地址
 * @param {string} to - 接收方地址
 * @param {Object} web3 - Web3实例
 * @returns {Promise<string>} 交互类型
 */
async function getInteractionType(from, to, web3) {
  const fromType = await getAddressType(from, web3);
  const toType = await getAddressType(to, web3);
  
  return `${fromType}→${toType}`;
}

module.exports = {
  isContract,
  getAddressType,
  getInteractionType
}; 