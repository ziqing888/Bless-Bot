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

// 读取多个文件的内容
async function readMultipleFiles() {
    const { nodeId, hardwareId } = await readNodeAndHardwareId();
    const authToken = await readAuthToken();
    return { nodeId, hardwareId, authToken };
}

module.exports = { readNodeAndHardwareId, readAuthToken, readMultipleFiles };
