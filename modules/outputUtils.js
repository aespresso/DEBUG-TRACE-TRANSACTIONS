// modules/outputUtils.js - 输出工具模块
const fs = require('fs');

/**
 * 初始化CSV输出文件
 * @param {string} outputFile - 输出文件路径
 */
function initOutputFile(outputFile) {
  if (!fs.existsSync(outputFile)) {
    fs.writeFileSync(outputFile, 'TransactionHash,BlockNumber,Timestamp,DateTime,From,To,Value(ETH),FallbackCallIndex,TotalFallbackCalls,InteractionType,FromType,FromContractName,ToType,ToContractName\n');
  }
}

/**
 * 转义CSV字段中的特殊字符
 * @param {string} field - 需要转义的字段
 * @returns {string} 转义后的字段
 */
function escapeCSV(field) {
  if (field === null || field === undefined) return '';
  const str = String(field);
  // 如果字段包含逗号、双引号或换行符，则用双引号包围并将内部的双引号替换为两个双引号
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * 将交易数据写入CSV文件
 * @param {Object} data - 交易数据
 * @param {string} outputFile - 输出文件路径
 */
function writeTransactionToCSV(data, outputFile) {
  const csvLine = `${data.txHash},${data.blockNum},${data.timestamp || ''},${data.dateTime || ''},${data.from},${data.to},${data.ethValue},${data.fallbackCallIndex},${data.totalFallbackCalls},${data.interactionType},${data.fromType},${escapeCSV(data.fromContractName)},${data.toType},${escapeCSV(data.toContractName)}\n`;
  fs.appendFileSync(outputFile, csvLine);
}

module.exports = {
  initOutputFile,
  escapeCSV,
  writeTransactionToCSV
}; 