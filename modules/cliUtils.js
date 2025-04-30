// modules/cliUtils.js - 命令行工具模块
const config = require('./config');

/**
 * 解析命令行参数
 * @returns {Object} 解析结果
 */
function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  let scanDays = config.defaultScanDays;
  let enableInteractionFilter = config.enableInteractionFilter;
  let interactionTypes = [...config.interactionTypes]; // 复制数组
  let singleBlock = null; // 新增参数，用于单区块扫描
  let forceRescan = false; // 新增参数，强制重新扫描

  for (let i = 0; i < args.length; i++) {
    // 扫描天数
    if (args[i] === '--days' && i + 1 < args.length) {
      scanDays = parseInt(args[i + 1]);
      if (isNaN(scanDays) || scanDays <= 0) {
        console.error('天数必须是正整数');
        process.exit(1);
      }
      console.log(`将扫描最近 ${scanDays} 天的区块`);
      i++; // 跳过下一个参数
    }
    
    // 是否启用交互类型过滤
    else if (args[i] === '--filter' && i + 1 < args.length) {
      const filterValue = args[i + 1].toLowerCase();
      enableInteractionFilter = (filterValue === 'true' || filterValue === '1' || filterValue === 'yes');
      console.log(`交互类型过滤: ${enableInteractionFilter ? '启用' : '禁用'}`);
      i++; // 跳过下一个参数
    }
    
    // 指定交互类型
    else if (args[i] === '--types' && i + 1 < args.length) {
      const typesStr = args[i + 1];
      const types = typesStr.split(',').map(t => t.trim());
      
      if (types.length > 0) {
        interactionTypes = types;
        console.log(`将过滤以下交互类型: ${interactionTypes.join(', ')}`);
      }
      i++; // 跳过下一个参数
    }
    
    // 单区块扫描
    else if (args[i] === '--block' && i + 1 < args.length) {
      singleBlock = parseInt(args[i + 1]);
      if (isNaN(singleBlock) || singleBlock < 0) {
        console.error('区块号必须是非负整数');
        process.exit(1);
      }
      console.log(`将只扫描区块: ${singleBlock}`);
      i++; // 跳过下一个参数
    }
    
    // 强制重新扫描
    else if (args[i] === '--force-rescan') {
      forceRescan = true;
      console.log('已启用强制重新扫描模式，将重新扫描所有区块');
    }
  }
  
  return {
    scanDays,
    enableInteractionFilter,
    interactionTypes,
    singleBlock,
    forceRescan
  };
}

module.exports = {
  parseCommandLineArgs
}; 