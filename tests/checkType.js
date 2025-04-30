/**
 * 以太坊地址类型检测器 (Web3.js v4.x版本)
 * 使用方法: node addressChecker_v4.js <以太坊地址> [RPC节点URL]
 */

// Web3.js v4.x导入方式
const { Web3 } = require('web3');

// 默认RPC节点
const DEFAULT_RPC = 'https://eth.llamarpc.com';

async function checkAddressType(address, rpcUrl = DEFAULT_RPC) {
  console.log(`\n===== 以太坊地址类型检测 =====`);
  console.log(`检测地址: ${address}`);
  console.log(`使用RPC节点: ${rpcUrl}`);
  console.log(`----------------------------`);

  try {
    // 初始化Web3 (v4.x方式)
    const web3 = new Web3(rpcUrl);
    console.log(`[1/5] Web3连接初始化成功 (v4.x)`);

    // 检查地址格式
    const isValidAddress = web3.utils.isAddress(address);
    console.log(`[2/5] 地址格式检查: ${isValidAddress ? '✓ 有效' : '✗ 无效'}`);
    
    if (!isValidAddress) {
      console.log(`❌ 错误: 无效的以太坊地址格式`);
      return;
    }

    // 获取地址代码
    console.log(`[3/5] 正在获取地址代码...`);
    const code = await web3.eth.getCode(address);
    console.log(`代码内容: ${code.length > 100 ? code.substring(0, 97) + '...' : code}`);
    console.log(`代码长度: ${code.length} 字符`);

    // 获取地址余额
    const balance = await web3.eth.getBalance(address);
    const ethBalance = web3.utils.fromWei(balance, 'ether');
    console.log(`[4/5] 地址余额: ${ethBalance} ETH`);

    // 判断地址类型
    console.log(`[5/5] 地址类型判断:`);
    
    if (code === '0x' || code === '0x0') {
      console.log(`  ✓ 代码检测: 无代码 (0x)`);
      console.log(`\n🔍 最终判断: 外部拥有账户 (EOA)`);
    } else {
      console.log(`  ✓ 代码检测: 有代码 (长度 ${code.length} 字符)`);
      console.log(`\n🔍 最终判断: 合约账户 (CA)`);
    }

    // 尝试获取交易数量
    try {
      const txCount = await web3.eth.getTransactionCount(address);
      console.log(`\n📊 附加信息: 交易数量: ${txCount}`);
    } catch (error) {
      console.log(`\n📊 附加信息: 无法获取交易数量`);
    }

  } catch (error) {
    console.error(`\n❌ 检测过程中出错:`);
    console.error(error.message);
  }
}

// 从命令行获取参数
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('请提供要检测的以太坊地址');
  console.log('使用方法: node addressChecker_v4.js <以太坊地址> [RPC节点URL]');
  process.exit(1);
}

const address = args[0];
const rpcUrl = args[1] || DEFAULT_RPC;

// 执行检测
checkAddressType(address, rpcUrl).catch(console.error);