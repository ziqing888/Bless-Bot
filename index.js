const fs = require('fs').promises;
const { HttpsProxyAgent } = require('https-proxy-agent');
const readline = require('readline');

function displayHeader() {
  const chalk = require('chalk');
  console.log(chalk.yellow('╔════════════════════════════════════════╗'));
  console.log(chalk.yellow('║      🚀   Bless-Bot         🚀         ║'));
  console.log(chalk.yellow('║  👤    脚本编写：子清                  ║'));
  console.log(chalk.yellow('║  📢  电报频道：https://t.me/ksqxszq    ║'));
  console.log(chalk.yellow('╚════════════════════════════════════════╝'));
  console.log(); 
}

async function loadFetch() {
    const fetch = await import('node-fetch').then(module => module.default);
    return fetch;
}

async function readProxy() {
    const data = await fs.readFile('proxy.txt', 'utf-8');
    const proxies = data.trim().split('\n').filter(proxy => proxy);
    const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];
    console.log(`[${new Date().toISOString()}] 使用代理: ${randomProxy}`);
    return randomProxy;
}

const apiBaseUrl = "https://gateway-run.bls.dev/api/v1";
const ipServiceUrl = "https://tight-block-2413.txlabs.workers.dev";

async function readNodeAndHardwareId() {
    const data = await fs.readFile('id.txt', 'utf-8');
    const [nodeId, hardwareId] = data.trim().split(':');
    return { nodeId, hardwareId };
}

async function readAuthToken() {
    const data = await fs.readFile('user.txt', 'utf-8');
    return data.trim();
}

async function promptUseProxy() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question('是否使用代理? (y/n): ', answer => {
            rl.close();
            resolve(answer.toLowerCase() === 'y');
        });
    });
}


async function registerNode(nodeId, hardwareId, useProxy) {
    const fetch = await loadFetch();
    const authToken = await readAuthToken();
    let agent;

    if (useProxy) {
        const proxy = await readProxy();
        agent = new HttpsProxyAgent(proxy);
    }

    const registerUrl = `${apiBaseUrl}/nodes/${nodeId}`;
    const ipAddress = await fetchIpAddress(fetch, agent);
    console.log(`[${new Date().toISOString()}] 正在注册节点，IP地址: ${ipAddress}, 硬件ID: ${hardwareId}`);
    const response = await fetch(registerUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
            ipAddress,
            hardwareId
        }),
        agent
    });

    let data;
    try {
        data = await response.json();
    } catch (error) {
        const text = await response.text();
        console.error(`[${new Date().toISOString()}] 无法解析JSON. 响应文本:`, text);
        throw error;
    }

    console.log(`[${new Date().toISOString()}] 注册响应:`, data);
    return data;
}

async function startSession(nodeId, useProxy) {
    const fetch = await loadFetch();
    const authToken = await readAuthToken();
    let agent;

    if (useProxy) {
        const proxy = await readProxy();
        agent = new HttpsProxyAgent(proxy);
    }

    const startSessionUrl = `${apiBaseUrl}/nodes/${nodeId}/start-session`;
    console.log(`[${new Date().toISOString()}] 正在为节点 ${nodeId} 启动会话，请稍候...`);
    const response = await fetch(startSessionUrl, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${authToken}`
        },
        agent
    });
    const data = await response.json();
    console.log(`[${new Date().toISOString()}] 会话启动响应:`, data);
    return data;
}

async function stopSession(nodeId, useProxy) {
    const fetch = await loadFetch();
    const authToken = await readAuthToken();
    let agent;

    if (useProxy) {
        const proxy = await readProxy();
        agent = new HttpsProxyAgent(proxy);
    }

    const stopSessionUrl = `${apiBaseUrl}/nodes/${nodeId}/stop-session`;
    console.log(`[${new Date().toISOString()}] 正在停止节点 ${nodeId} 会话`);
    const response = await fetch(stopSessionUrl, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${authToken}`
        },
        agent
    });
    const data = await response.json();
    console.log(`[${new Date().toISOString()}] 停止会话响应:`, data);
    return data;
}

async function pingNode(nodeId, useProxy) {
    const fetch = await loadFetch();
    const chalk = require('chalk');
    const authToken = await readAuthToken();
    let agent;

    if (useProxy) {
        const proxy = await readProxy();
        agent = new HttpsProxyAgent(proxy);
    }

    const pingUrl = `${apiBaseUrl}/nodes/${nodeId}/ping`;
    console.log(`[${new Date().toISOString()}] 正在ping节点 ${nodeId}`);
    const response = await fetch(pingUrl, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${authToken}`
        },
        agent
    });
    const data = await response.json();
    
    const lastPing = data.pings[data.pings.length - 1].timestamp;
    const logMessage = `[${new Date().toISOString()}] ping响应, ID: ${chalk.green(data._id)}, 节点ID: ${chalk.green(data.nodeId)}, 最后ping时间: ${chalk.yellow(lastPing)}`;
    console.log(logMessage);
    
    return data;
}

async function fetchIpAddress(fetch, agent) {
    const response = await fetch(ipServiceUrl, { agent });
    const data = await response.json();
    console.log(`[${new Date().toISOString()}] 获取IP响应:`, data);
    return data.ip;
}

async function run() {
    try {
        displayHeader();  

        const useProxy = await promptUseProxy(); 
        const { nodeId, hardwareId } = await readNodeAndHardwareId(); /

        console.log(`[${new Date().toISOString()}] 读取节点ID: ${nodeId}, 硬件ID: ${hardwareId}`);

        const registrationResponse = await registerNode(nodeId, hardwareId, useProxy); 
        console.log(`[${new Date().toISOString()}] 节点注册完成。响应:`, registrationResponse);

        const startSessionResponse = await startSession(nodeId, useProxy); 
        console.log(`[${new Date().toISOString()}] 会话启动。响应:`, startSessionResponse);

        console.log(`[${new Date().toISOString()}] 正在发送初始ping...`);
        const initialPingResponse = await pingNode(nodeId, useProxy);

        setInterval(async () => {
            console.log(`[${new Date().toISOString()}] 定时发送ping...`);
            const pingResponse = await pingNode(nodeId, useProxy);
        }, 60000);  // 

    } catch (error) {
        console.error(`[${new Date().toISOString()}] 程序执行失败: ${error.message}`);
    }
}

run();
