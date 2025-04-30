// modules/rpcUtils.js - RPC工具模块

/**
 * 调用RPC方法的通用函数
 * @param {string} method - RPC方法名
 * @param {Array} params - 参数数组
 * @param {Object} web3 - Web3实例
 * @returns {Promise<any>} RPC调用结果
 */
async function callRpcMethod(method, params, web3) {
  return new Promise((resolve, reject) => {
    web3.currentProvider.send({
      jsonrpc: '2.0',
      method,
      params,
      id: 1
    }, (err, response) => {
      if (err) reject(err);
      else resolve(response.result);
    });
  });
}

module.exports = {
  callRpcMethod
}; 