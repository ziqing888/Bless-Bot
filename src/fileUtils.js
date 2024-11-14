const fs = require('fs').promises;

// 读取节点 ID 和硬件 ID
async function readNodeAndHardwareId() {
  const data = await fs.readFile('id.txt', 'utf-8');
  const [nodeId, hardwareId] = data.trim().split(':');
  return { nodeId, hardwareId };
}

// 读取认证令牌
async function readAuthToken() {
  const data = await fs.readFile('user.txt', 'utf-8');
  return data.trim();
}

// 批量读取文件
async function readMultipleFiles() {
  const [nodeData, authToken] = await Promise.all([
    fs.readFile('id.txt', 'utf-8'),
    fs.readFile('user.txt', 'utf-8')
  ]);
  const [nodeId, hardwareId] = nodeData.trim().split(':');
  return { nodeId, hardwareId, authToken: authToken.trim() };
}

module.exports = { readNodeAndHardwareId, readAuthToken, readMultipleFiles };
