const fetch = require('node-fetch');

// API 基本 URL 配置
const apiBaseUrl = "https://gateway-run.bls.dev/api/v1";
const ipServiceUrl = "https://tight-block-2413.txlabs.workers.dev";

// 注册节点
async function registerNode(nodeId, hardwareId, authToken) {
    const registerUrl = `${apiBaseUrl}/nodes/${nodeId}`;
    const ipAddress = await fetchIpAddress();
    console.log(`[${new Date().toISOString()}] 正在注册节点，IP 地址：${ipAddress}，硬件 ID：${hardwareId}`);
    
    const response = await fetch(registerUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
            ipAddress,
            hardwareId
        })
    });

    let data;
    try {
        data = await response.json();
    } catch (error) {
        const text = await response.text();
        console.error(`[${new Date().toISOString()}] 解析 JSON 失败。响应文本：`, text);
        throw error;
    }

    console.log(`[${new Date().toISOString()}] 注册响应：`, data);
    return data;
}

// 启动会话
async function startSession(nodeId, authToken) {
    const startSessionUrl = `${apiBaseUrl}/nodes/${nodeId}/start-session`;
    console.log(`[${new Date().toISOString()}] 正在为节点 ${nodeId} 启动会话，请稍等...`);
    
    const response = await fetch(startSessionUrl, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${authToken}`
        }
    });
    const data = await response.json();
    console.log(`[${new Date().toISOString()}] 启动会话响应：`, data);
    return data;
}

// 停止会话
async function stopSession(nodeId, authToken) {
    const stopSessionUrl = `${apiBaseUrl}/nodes/${nodeId}/stop-session`;
    console.log(`[${new Date().toISOString()}] 正在停止节点 ${nodeId} 会话...`);
    
    const response = await fetch(stopSessionUrl, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${authToken}`
        }
    });
    const data = await response.json();
    console.log(`[${new Date().toISOString()}] 停止会话响应：`, data);
    return data;
}

// 获取当前 IP 地址
async function fetchIpAddress() {
    const response = await fetch(ipServiceUrl);
    const data = await response.json();
    console.log(`[${new Date().toISOString()}] 获取到的 IP 地址：`, data);
    return data.ip;
}

module.exports = { registerNode, startSession, stopSession };
