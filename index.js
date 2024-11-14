const fs = require('fs').promises;
const fetch = require('node-fetch');
const chalk = require('chalk');

// API 基本 URL 配置
const apiBaseUrl = "https://gateway-run.bls.dev/api/v1";
const ipServiceUrl = "https://tight-block-2413.txlabs.workers.dev";

// 显示自定义 Logo
function displayHeader() {
    console.log(chalk.yellow('╔════════════════════════════════════════╗'));
    console.log(chalk.yellow('║      🚀   Bless-Bot         🚀         ║'));
    console.log(chalk.yellow('║  👤    脚本编写：子清                  ║'));
    console.log(chalk.yellow('║  📢  电报频道：https://t.me/ksqxszq    ║'));
    console.log(chalk.yellow('╚════════════════════════════════════════╝'));
    console.log();  // 添加额外空行以分隔内容
}

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

// 加载 fetch 函数
async function loadFetch() {
    return fetch;
}

// 注册节点
async function registerNode(nodeId, hardwareId) {
    const authToken = await readAuthToken();
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
async function startSession(nodeId) {
    const authToken = await readAuthToken();
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
async function stopSession(nodeId) {
    const authToken = await readAuthToken();
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

// Ping 节点
async function pingNode(nodeId) {
    const authToken = await readAuthToken();
    const pingUrl = `${apiBaseUrl}/nodes/${nodeId}/ping`;
    console.log(`[${new Date().toISOString()}] 正在 ping 节点 ${nodeId}...`);
    
    const response = await fetch(pingUrl, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${authToken}`
        }
    });
    const data = await response.json();
    
    const lastPing = data.pings[data.pings.length - 1].timestamp;
    const logMessage = `[${new Date().toISOString()}] Ping 响应，节点 ID：${chalk.green(data.nodeId)}，最后 Ping 时间：${chalk.yellow(lastPing)}`;
    console.log(logMessage);
    
    return data;
}

// 获取当前 IP 地址
async function fetchIpAddress() {
    const response = await fetch(ipServiceUrl);
    const data = await response.json();
    console.log(`[${new Date().toISOString()}] 获取到的 IP 地址：`, data);
    return data.ip;
}

// 主运行函数
async function runAll() {
    try {
        await displayHeader();  // 显示自定义 Logo

        const { nodeId, hardwareId } = await readNodeAndHardwareId();
        console.log(`[${new Date().toISOString()}] 读取到节点 ID：${nodeId}，硬件 ID：${hardwareId}`);

        const registrationResponse = await registerNode(nodeId, hardwareId);
        console.log(`[${new Date().toISOString()}] 节点注册完成，响应：`, registrationResponse);

        const startSessionResponse = await startSession(nodeId);
        console.log(`[${new Date().toISOString()}] 会话已启动，响应：`, startSessionResponse);

        console.log(`[${new Date().toISOString()}] 发送初始 ping 请求...`);
        const initialPingResponse = await pingNode(nodeId);

        // 定时 ping 节点
        setInterval(async () => {
            console.log(`[${new Date().toISOString()}] 发送 ping 请求...`);
            const pingResponse = await pingNode(nodeId);
        }, 60000); // 每隔 60 秒 ping 一次

    } catch (error) {
        console.error(`[${new Date().toISOString()}] 发生错误：`, error);
    }
}

// 执行主函数
runAll();
