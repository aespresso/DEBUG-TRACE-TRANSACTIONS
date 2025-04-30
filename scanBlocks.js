// scanBlocks.js - 扫描区块并分析交易
const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 导入模块
const config = require('./modules/config');
const { getPastBlockByDays } = require('./modules/blockUtils');
const { initOutputFile, writeTransactionToCSV } = require('./modules/outputUtils');
const { parseCommandLineArgs } = require('./modules/cliUtils');
const { analyzeTx } = require('./analyzeTx');

// 初始化Web3
const web3 = new Web3(config.nodeUrl);

// 已扫描区块记录文件
const scannedBlocksFile = path.join(__dirname, 'scanned_blocks.txt');

/**
 * 加载已扫描区块记录
 * @returns {Set<number>} 已扫描区块集合
 */
function loadScannedBlocks() {
  try {
    if (fs.existsSync(scannedBlocksFile)) {
      const content = fs.readFileSync(scannedBlocksFile, 'utf8');
      const blocks = content.split('\n')
        .map(line => line.trim())
        .filter(line => line && !isNaN(Number(line)))
        .map(line => Number(line));
      console.log(`已加载 ${blocks.length} 个已扫描区块记录`);
      return new Set(blocks);
    }
  } catch (error) {
    console.error('加载已扫描区块记录失败:', error);
  }
  return new Set();
}

/**
 * 记录已扫描区块
 * @param {number} blockNum - 区块号
 */
function recordScannedBlock(blockNum) {
  try {
    fs.appendFileSync(scannedBlocksFile, `${blockNum}\n`);
  } catch (error) {
    console.error(`记录已扫描区块 ${blockNum} 失败:`, error);
  }
}

/**
 * 处理单个区块
 * @param {number} blockNum - 区块号
 * @param {Object} options - 扫描选项
 * @param {Set<number>} scannedBlocks - 已扫描区块集合
 */
async function processBlock(blockNum, options, scannedBlocks) {
  // 检查区块是否已扫描
  if (scannedBlocks.has(blockNum) && !options.forceRescan) {
    console.log(`区块 ${blockNum} 已扫描，跳过`);
    return;
  }

  console.log(`开始处理区块 ${blockNum}...`);
  const block = await web3.eth.getBlock(blockNum, true);
  
  if (!block) {
    console.log(`区块 ${blockNum} 不存在，跳过`);
    return;
  }
  
  // 确保时间戳是数字类型
  const timestamp = Number(block.timestamp);
  const dateTime = new Date(timestamp * 1000).toISOString();
  console.log(`分析区块 ${blockNum}, 时间: ${dateTime}, 包含 ${block.transactions.length} 笔交易`);
  
  // 处理区块中的每笔交易
  for (let i = 0; i < block.transactions.length; i++) {
    const tx = block.transactions[i];
    const txHash = tx.hash;
    
    console.log(`[${i+1}/${block.transactions.length}] 处理交易 ${txHash}...`);
    
    // 调用analyzeTx分析交易
    const analysisOptions = {
      web3,
      enableInteractionFilter: options.enableInteractionFilter,
      interactionTypes: options.interactionTypes,
    };
    
    const result = await analyzeTx(txHash, analysisOptions);
    
    if (result.success) {
      if (result.hasFallback) {
        console.log(`交易 ${txHash} 包含 ${result.callsCount} 个fallback调用`);
        
        // 将分析结果写入CSV
        if (result.callsData && result.callsData.length > 0) {
          for (const callData of result.callsData) {
            writeTransactionToCSV(callData, options.outputFile || config.outputFile);
          }
        }
      } else {
        console.log(`交易 ${txHash} 不包含fallback调用`);
      }
    } else {
      console.error(`分析交易 ${txHash} 失败: ${result.error}`);
    }
  }
  
  console.log(`区块 ${blockNum} 处理完成`);
  
  // 记录已扫描区块
  recordScannedBlock(blockNum);
  scannedBlocks.add(blockNum);
}

/**
 * 扫描区块范围内的所有交易
 * @param {number} startBlock - 起始区块
 * @param {number} endBlock - 结束区块
 * @param {Object} options - 扫描选项
 */
async function scanBlockRange(startBlock, endBlock, options) {
  console.log(`开始扫描区块 ${startBlock} 到 ${endBlock}`);
  
  if (options.enableInteractionFilter) {
    console.log(`启用交互类型过滤: ${options.interactionTypes.join(', ')}`);
  }
  
  // 确保startBlock和endBlock是Number类型
  startBlock = Number(startBlock);
  endBlock = Number(endBlock);
  
  // 初始化输出文件
  initOutputFile(config.outputFile);
  
  // 加载已扫描区块记录
  const scannedBlocks = loadScannedBlocks();
  
  // 按批次处理区块
  for (let currentBlock = startBlock; currentBlock <= endBlock; currentBlock += config.blocksPerBatch) {
    const batchEndBlock = Math.min(currentBlock + config.blocksPerBatch - 1, endBlock);
    console.log(`处理区块批次: ${currentBlock} - ${batchEndBlock}`);
    
    try {
      // 处理批次中的每个区块
      for (let blockNum = currentBlock; blockNum <= batchEndBlock; blockNum++) {
        await processBlock(blockNum, options, scannedBlocks);
      }
      
      // 批次间延迟，避免节点过载
      if (currentBlock + config.blocksPerBatch <= endBlock) {
        console.log(`批次完成，等待 ${config.delayBetweenBatches}ms 后继续...`);
        await new Promise(resolve => setTimeout(resolve, config.delayBetweenBatches));
      }
      
    } catch (error) {
      console.error(`处理区块批次 ${currentBlock}-${batchEndBlock} 时出错:`, error);
      // 继续处理下一批次，而不是中断整个过程
    }
  }
  
  console.log(`扫描完成! 结果已保存到 ${config.outputFile}`);
}

/**
 * 主函数
 */
async function main() {
  try {
    // 解析命令行参数
    const options = parseCommandLineArgs();
    
    // 如果指定了单个区块，则只扫描该区块
    if (options.singleBlock) {
      console.log(`将只扫描指定的单个区块: ${options.singleBlock}`);
      // 初始化输出文件
      initOutputFile(config.outputFile);
      // 加载已扫描区块记录
      const scannedBlocks = loadScannedBlocks();
      await processBlock(options.singleBlock, options, scannedBlocks);
      console.log(`单区块扫描完成! 结果已保存到 ${config.outputFile}`);
      return;
    }
    
    // 获取当前区块
    const currentBlock = await web3.eth.getBlockNumber();
    console.log(`当前区块高度: ${currentBlock}`);
    
    // 获取指定天数前的区块
    const pastBlock = await getPastBlockByDays(options.scanDays, web3);
    
    // 扫描区块范围
    await scanBlockRange(pastBlock, currentBlock, options);
    
  } catch (error) {
    console.error('程序执行出错:', error);
  }
}

// 执行主函数
main();
