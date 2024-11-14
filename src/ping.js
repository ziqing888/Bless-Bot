const { pingNode } = require('./api');

// 启动 ping 请求
async function pingNodeWithInterval(nodeId, authToken) {
    setInterval(async () => {
        console.log(`[${new Date().toISOString()}] 发送 ping 请求...`);
        await pingNode(nodeId, authToken);
    }, 60000); // 每隔 60 秒 ping 一次
}

// ping 节点
async function pingNode(nodeId, authToken) {
    const pingUrl = `https://gateway-run.bls.dev/api/v1/nodes/${nodeId}/ping`;
    const response = await fetch(pingUrl, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${authToken}`
        }
    });
    const data = await response.json();
    const lastPing = data.pings[data.pings.length - 1].timestamp;
    const logMessage = `[${new Date().toISOString()}] Ping 响应，节点 ID：${data.nodeId}，最后 Ping 时间：${lastPing}`;
    console.log(logMessage);
}

module.exports = { pingNodeWithInterval };
