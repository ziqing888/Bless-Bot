const fs = require('fs').promises;
const { HttpsProxyAgent } = require('https-proxy-agent');
const chalk = require('chalk');
const readline = require('readline');
const config = require('./config');


const apiBaseUrl = "https://gateway-run.bls.dev/api/v1";
const ipServiceUrls = [
    "https://tight-block-2413.txlabs.workers.dev",
    "https://api64.ipify.org?format=json"
];
let useProxy;


const colors = {
    reset: chalk.reset,
    bright: chalk.bold,
    dim: chalk.dim,
    dynamic: (hex) => chalk.hex(hex),
    success: chalk.greenBright,
    error: chalk.redBright,
    warning: chalk.yellowBright,
    info: chalk.cyanBright,
    header: chalk.hex('#FFD700'),
    timestamp: chalk.hex('#4682B4'),
    id: chalk.hex('#FF69B4'),
    ip: chalk.hex('#9370DB'),
};


function logStyled(message, style = colors.info, prefix = '', suffix = '') {
    console.log(`${colors.timestamp(`[${new Date().toISOString()}]`)} ${prefix}${style(message)}${suffix}`);
}


function logSeparator(title = '') {
    console.log(colors.dim('────────────────────────────────────────────'));
    if (title) {
        console.log(colors.bright(`🔷 ${title}`));
    }
}


function displayHeader() {
    console.log(colors.header('╔════════════════════════════════════════╗'));
    console.log(colors.header('║      🎀  祝福小助手 Bless-Bot 🎀       ║'));
    console.log(colors.header('║     🐱 编写：@qklxsqf                  ║'));
    console.log(colors.header('║  🎉 电报频道：https://t.me/ksqxszq     ║'));
    console.log(colors.header('╚════════════════════════════════════════╝'));
    console.log();
}


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
            logStyled(`获取到 IP 地址: ${data.ip}`, colors.ip, `🔗 来自服务: ${url} `, ' ✅');
            return data.ip;
        } catch (error) {
            logStyled(`从服务 ${url} 获取 IP 失败: ${error.message}`, colors.error, '', ' ❌');
        }
    }
    throw new Error("所有 IP 服务都不可用");
}

// 注册节点
async function registerNode(nodeId, hardwareId, ipAddress, proxy, authToken) {
    const fetch = await loadFetch();
    const agent = proxy ? new HttpsProxyAgent(proxy) : null;
    const registerUrl = `${apiBaseUrl}/nodes/${nodeId}`;

    logStyled(`注册节点: ${nodeId}`, colors.id, `🔧 IP: ${colors.ip(ipAddress)} `, ' ⏳');
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
        logStyled(`节点注册成功: ${JSON.stringify(data, null, 2)}`, colors.success, '', ' ✅');
        return data;
    } catch (error) {
        logStyled(`节点注册失败: ${error.message}`, colors.error, '', ' ❌');
        throw error;
    }
}


async function startSession(nodeId, proxy, authToken) {
    const fetch = await loadFetch();
    const agent = proxy ? new HttpsProxyAgent(proxy) : null;
    const sessionUrl = `${apiBaseUrl}/nodes/${nodeId}/start-session`;

    logStyled(`启动会话: ${nodeId}`, colors.id, '', ' ⏳');
    try {
        const response = await fetch(sessionUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
            agent,
        });
        const data = await response.json();
        logStyled(`会话启动成功: ${JSON.stringify(data, null, 2)}`, colors.success, '', ' ✅');
        return data;
    } catch (error) {
        logStyled(`启动会话失败: ${error.message}`, colors.error, '', ' ❌');
        throw error;
    }
}


async function pingNode(nodeId, proxy, ipAddress, authToken) {
    const fetch = await loadFetch();
    const agent = proxy ? new HttpsProxyAgent(proxy) : null;
    const pingUrl = `${apiBaseUrl}/nodes/${nodeId}/ping`;

    logStyled(`Ping 节点: ${nodeId}`, colors.id, '', ' ⏳');
    try {
        const response = await fetch(pingUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
            agent,
        });
        const data = await response.json();
        logStyled(`Ping 成功: ${JSON.stringify(data, null, 2)}`, colors.success, '', ' ✅');
        return data;
    } catch (error) {
        logStyled(`Ping 失败: ${error.message}`, colors.error, '', ' ❌');
        throw error;
    }
}


async function processNode(node, proxy, ipAddress, authToken) {
    const pingErrorCount = {};
    let intervalId = null;

    logSeparator('节点任务启动');
    while (true) {
        try {
            logStyled(`处理节点: ${node.nodeId}`, colors.id, `🔧 硬件 ID: ${node.hardwareId} `, ' ⏳');

            const registrationResponse = await registerNode(node.nodeId, node.hardwareId, ipAddress, proxy, authToken);
            const startSessionResponse = await startSession(node.nodeId, proxy, authToken);

            if (!intervalId) {
                intervalId = setInterval(async () => {
                    try {
                        await pingNode(node.nodeId, proxy, ipAddress, authToken);
                        pingErrorCount[node.nodeId] = 0;
                    } catch (error) {
                        pingErrorCount[node.nodeId] = (pingErrorCount[node.nodeId] || 0) + 1;
                        if (pingErrorCount[node.nodeId] >= 3) {
                            clearInterval(intervalId);
                            intervalId = null;
                            logStyled(`节点 ${node.nodeId} 连续 Ping 失败 3 次，重新启动处理`, colors.error);
                            await processNode(node, proxy, ipAddress, authToken);
                        }
                    }
                }, 60000);
            }
            break;
        } catch (error) {
            logStyled(`节点 ${node.nodeId} 处理失败，重试中: ${error.message}`, colors.error);
            await new Promise(res => setTimeout(res, 5000));
        }
    }
}


async function runAll(initialRun = true) {
    try {
        if (initialRun) {
            displayHeader();
            useProxy = await promptUseProxy();
            logStyled(`使用代理: ${useProxy ? '是' : '否'}`, colors.info);
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
                    logStyled(`节点 ${node.nodeId} 处理失败，跳过: ${error.message}`, colors.error);
                }
            }
        }
    } catch (error) {
        logStyled(`运行失败: ${error.message}`, colors.error);
    }
}


process.on('uncaughtException', (error) => {
    logStyled(`未捕获的异常: ${error.message}`, colors.error);
    setTimeout(() => runAll(false), 5000);
});


runAll();
