const chalk = require('chalk');
const { pingNode } = require('./api');

// 定时 ping 节点
async function pingNodeWithInterval(nodeId, authToken) {
  console.log(`[${new Date().toISOString()}] 发送初始 ping 请求...`);
  await pingNode(nodeId, authToken);

  // 每隔 60 秒 ping 一次
  setInterval(async () => {
    console.log(`[${new Date().toISOString()}] 发送 ping 请求...`);
    await pingNode(nodeId, authToken);
  }, 60000); // 每隔 60 秒 ping 一次
}

module.exports = { pingNodeWithInterval };
