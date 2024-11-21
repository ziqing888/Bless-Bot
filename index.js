const fs = require('fs').promises;
const { HttpsProxyAgent } = require('https-proxy-agent');
const chalk = require('chalk');
const readline = require('readline');
const config = require('./config');

// API 基础 URL 和 IP 服务地址
const apiBaseUrl = "https://gateway-run.bls.dev/api/v1";
const ipServiceUrls = [
    "https://tight-block-2413.txlabs.workers.dev",
    "https://api64.ipify.org?format=json"
];
let useProxy;

// 颜色和日志工具
const colors = {
    header: chalk.hex('#FFD700'),
    info: chalk.hex('#87CEEB'),
    success: chalk.hex('#32CD32'),
    error: chalk.hex('#FF6347'),
    timestamp: chalk.hex('#4682B4'),
    id: chalk.hex('#FF69B4'),
    ip: chalk.hex('#9370DB'),
};

function logTimestamped(message, style = colors.info) {
    console.log(`${colors.timestamp(`[${new Date().toISOString()}]`)} ${style(message)}`);
}

// 显示标题
function displayHeader() {
    console.log(colors.header('╔════════════════════════════════════════╗'));
    console.log(colors.header('║      🎀  祝福小助手 Bless-Bot 🎀       ║'));
    console.log(colors.header('║     🐱 编写：@qklxsqf                  ║'));
    console.log(colors.header('║  🎉 电报频道：https://t.me/ksqxszq     ║'));
    console.log(colors.header('╚════════════════════════════════════════╝'));
    console.log();
}

// 提示用户是否使用代理
async function promptUseProxy() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => {
        rl.question('是否使用代理？（y/n）：', answer => {
            rl.close();
            resolve(answer.trim().toLowerCase() === 'y');
        });
    });
}

// 加载 fetch 模块
async function loadFetch() {
    const fetch = await import('node-fetch').then(module => module.default);
    return fetch;
}

// 获取 IP 地址（带备用服务）
async function fetchIpAddressWithFallback(fetch, agent) {
    for (const url of ipServiceUrls) {
        try {
            const response = await fetch(url, { agent });
            const data = await response.json();
            logTimestamped(`获取到 IP 地址: ${colors.ip(data.ip)} 来自 ${url}`, colors.success);
            return data.ip;
        } catch (error) {
            logTimestamped(`从服务 ${url} 获取 IP 失败: ${error.message}`, colors.error);
        }
    }
    throw new Error("所有 IP 服务都不可用");
}

// 注册节点
async function registerNode(nodeId, hardwareId, ipAddress, proxy, authToken) {
    const fetch = await loadFetch();
    const agent = proxy ? new HttpsProxyAgent(proxy) : null;
    const registerUrl = `${apiBaseUrl}/nodes/${nodeId}`;

    logTimestamped(`注册节点: ${colors.id(nodeId)}，IP: ${colors.ip(ipAddress)}，硬件 ID: ${hardwareId}`, colors.info);
    try {
        const response = await fetch(registerUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ ipAddress, hardwareId }),
            agent,
        });
        const data = await response.json();
        logTimestamped(`节点注册成功: ${JSON.stringify(data, null, 2)}`, colors.success);
        return data;
    } catch (error) {
        logTimestamped(`节点注册失败: ${error.message}`, colors.error);
        throw error;
    }
}

// 启动会话
async function startSession(nodeId, proxy, authToken) {
    const fetch = await loadFetch();
    const agent = proxy ? new HttpsProxyAgent(proxy) : null;
    const sessionUrl = `${apiBaseUrl}/nodes/${nodeId}/start-session`;

    logTimestamped(`启动会话: ${colors.id(nodeId)}`, colors.info);
    try {
        const response = await fetch(sessionUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
            agent,
        });
        const data = await response.json();
        logTimestamped(`会话启动成功: ${JSON.stringify(data, null, 2)}`, colors.success);
        return data;
    } catch (error) {
        logTimestamped(`启动会话失败: ${error.message}`, colors.error);
        throw error;
    }
}

// Ping 节点
async function pingNode(nodeId, proxy, ipAddress, authToken) {
    const fetch = await loadFetch();
    const agent = proxy ? new HttpsProxyAgent(proxy) : null;
    const pingUrl = `${apiBaseUrl}/nodes/${nodeId}/ping`;

    logTimestamped(`Ping 节点: ${colors.id(nodeId)}`, colors.info);
    try {
        const response = await fetch(pingUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
            agent,
        });
        const data = await response.json();
        logTimestamped(`Ping 成功: ${JSON.stringify(data, null, 2)}`, colors.success);
        return data;
    } catch (error) {
        logTimestamped(`Ping 失败: ${error.message}`, colors.error);
        throw error;
    }
}

// 无限循环处理节点
async function processNode(node, proxy, ipAddress, authToken) {
    const pingErrorCount = {};
    let intervalId = null;

    while (true) {
        try {
            logTimestamped(`处理节点: ${colors.id(node.nodeId)}，硬件 ID: ${node.hardwareId}，IP: ${ipAddress}`, colors.info);

            const registrationResponse = await registerNode(node.nodeId, node.hardwareId, ipAddress, proxy, authToken);
            logTimestamped(`节点注册完成: ${JSON.stringify(registrationResponse, null, 2)}`, colors.success);

            const startSessionResponse = await startSession(node.nodeId, proxy, authToken);
            logTimestamped(`会话启动完成: ${JSON.stringify(startSessionResponse, null, 2)}`, colors.success);

            if (!intervalId) {
                intervalId = setInterval(async () => {
                    try {
                        logTimestamped(`定期 Ping 节点: ${colors.id(node.nodeId)}`, colors.info);
                        await pingNode(node.nodeId, proxy, ipAddress, authToken);
                        pingErrorCount[node.nodeId] = 0;
                    } catch (error) {
                        logTimestamped(`Ping 失败: ${error.message}`, colors.error);
                        pingErrorCount[node.nodeId] = (pingErrorCount[node.nodeId] || 0) + 1;
                        if (pingErrorCount[node.nodeId] >= 3) {
                            clearInterval(intervalId);
                            intervalId = null;
                            logTimestamped(`节点 ${colors.id(node.nodeId)} 连续 Ping 失败 3 次，重新启动处理`, colors.error);
                            await processNode(node, proxy, ipAddress, authToken);
                        }
                    }
                }, 60000);
            }

            break;
        } catch (error) {
            logTimestamped(`节点 ${node.nodeId} 处理失败，重试中: ${error.message}`, colors.error);
            await new Promise(res => setTimeout(res, 5000));
        }
    }
}

// 主函数
async function runAll(initialRun = true) {
    try {
        if (initialRun) {
            displayHeader();
            useProxy = await promptUseProxy();
            logTimestamped(`使用代理: ${useProxy ? '是' : '否'}`, colors.info);
        }

        for (const user of config) {
            for (const node of user.nodes) {
                try {
                    const proxy = useProxy ? node.proxy : null;
                    const ipAddress = useProxy
                        ? await fetchIpAddressWithFallback(await loadFetch(), proxy ? new HttpsProxyAgent(proxy) : null)
                        : null;

                    await processNode(node, proxy, ipAddress, user.usertoken);
                } catch (error) {
                    logTimestamped(`节点 ${node.nodeId} 处理失败，跳过: ${error.message}`, colors.error);
                }
            }
        }
    } catch (error) {
        logTimestamped(`运行失败: ${error.message}`, colors.error);
    }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    logTimestamped(`未捕获的异常: ${error.message}`, colors.error);
    setTimeout(() => runAll(false), 5000);
});

// 启动脚本
runAll();
