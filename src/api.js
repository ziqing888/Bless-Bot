const fetch = require('node-fetch');
const config = require('../config/config.json');

// 加载 fetch 函数
async function loadFetch() {
  return fetch;
}

// 注册节点
async function registerNode(nodeId, hardwareId, authToken) {
  const registerUrl = `${config.apiBaseUrl}/nodes/${nodeId}`;
  const ipAddress = await fetchIpAddress();
  console.log(`[${new Date().toISOString()}] 正在注册节点，IP 地址：${ipAddress}，硬件 ID：${hardwareId}`);
  
  const response = await fetch(registerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`
    },
    body: JSON.stringify({ ipAddress, hardwareId })
  });

  return await handleApiResponse(response);
}

// 启动会话
async function startSession(nodeId, authToken) {
  const startSessionUrl = `${config.apiBaseUrl}/nodes/${nodeId}/start-session`;
  console.log(`[${new Date().toISOString()}] 正在为节点 ${nodeId} 启动会话，请稍等...`);

  const response = await fetch(startSessionUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${authToken}` }
  });

  return await handleApiResponse(response);
}

// 停止会话
async function stopSession(nodeId, authToken) {
  const stopSessionUrl = `${config.apiBaseUrl}/nodes/${nodeId}/stop-session`;
  console.log(`[${new Date().toISOString()}] 正在停止节点 ${nodeId} 会话...`);

  const response = await fetch(stopSessionUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${authToken}` }
  });

  return await handleApiResponse(response);
}

// Ping 节点
async function pingNode(nodeId, authToken) {
  const pingUrl = `${config.apiBaseUrl}/nodes/${nodeId}/ping`;
  console.log(`[${new Date().toISOString()}] 正在 ping 节点 ${nodeId}...`);

  const response = await fetch(pingUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${authToken}` }
  });

  return await handleApiResponse(response);
}

// 获取当前 IP 地址
async function fetchIpAddress() {
  const response = await fetch(config.ipServiceUrl);
  const data = await response.json();
  console.log(`[${new Date().toISOString()}] 获取到的 IP 地址：`, data);
  return data.ip;
}

// 处理 API 响应
async function handleApiResponse(response) {
  let data;
  try {
    data = await response.json();
  } catch (error) {
    const text = await response.text();
    console.error(`[${new Date().toISOString()}] 解析 JSON 失败。响应文本：`, text);
    throw error;
  }

  console.log(`[${new Date().toISOString()}] API 响应：`, data);
  return data;
}

module.exports = { registerNode, startSession, stopSession, pingNode, fetchIpAddress };
