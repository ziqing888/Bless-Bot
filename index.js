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


function logSection(title) {
    console.log(colors.dim('────────────────────────────────────────────'));
    console.log(colors.header(`📌 ${title}`));
    console.log(colors.dim('────────────────────────────────────────────'));
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

async function loadFetch() {
    const fetch = await import('node-fetch').then(module => module.default);
    return fetch;
}

// 提取核心 IP 获取逻辑
async function fetchIpAddressWithFallback(fetch, agent) {
    for (const url of ipServiceUrls) {
        try {
            const response = await fetch(url, { agent });
            const data = await response.json();
            logStyled(`获取到 IP 地址: ${data.ip}`, colors.ip, `🔗 来源: ${url}`, ' ✅');
            return data.ip;
        } catch (error) {
            logStyled(`IP 服务失败: ${error.message} (来源: ${url})`, colors.error, '', ' ❌');
        }
    }
    throw new Error("所有 IP 服务不可用");
}

// 处理注册节点
async function registerNode(nodeId, hardwareId, ipAddress, proxy, authToken) {
    const fetch = await loadFetch();
    const agent = proxy ? new HttpsProxyAgent(proxy) : null;
    const registerUrl = `${apiBaseUrl}/nodes/${nodeId}`;

    logSection('节点注册');
    logStyled(`节点 ID: ${nodeId}`, colors.id, '', ' ⏳');
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
        logStyled(`节点注册成功`, colors.success);
        return data;
    } catch (error) {
        logStyled(`注册失败: ${error.message}`, colors.error);
        throw error;
    }
}

// 启动会话
async function startSession(nodeId, proxy, authToken) {
    const fetch = await loadFetch();
    const agent = proxy ? new HttpsProxyAgent(proxy) : null;
    const sessionUrl = `${apiBaseUrl}/nodes/${nodeId}/start-session`;

    logSection('启动会话');
    logStyled(`启动节点会话: ${nodeId}`, colors.id, '', ' ⏳');
    try {
        const response = await fetch(sessionUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
            agent,
        });
        const data = await response.json();
        logStyled(`会话启动成功 - 会话 ID: ${data.sessionId}`, colors.success);
        return data;
    } catch (error) {
        logStyled(`会话启动失败: ${error.message}`, colors.error);
        throw error;
    }
}


async function pingNode(nodeId, proxy, authToken) {
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
        logStyled(`Ping 成功`, colors.success);
        return data;
    } catch (error) {
        logStyled(`Ping 失败: ${error.message}`, colors.error);
        throw error;
    }
}

// 无限循环处理节点
async function processNode(node, proxy, ipAddress, authToken) {
    logSection('节点任务');
    let pingCount = 0;

    try {
        await registerNode(node.nodeId, node.hardwareId, ipAddress, proxy, authToken);
        await startSession(node.nodeId, proxy, authToken);

        setInterval(async () => {
            try {
                await pingNode(node.nodeId, proxy, authToken);
                pingCount++;
                logStyled(`累计 Ping 成功次数: ${pingCount}`, colors.info);
            } catch (error) {
                logStyled(`Ping 失败: ${error.message}`, colors.warning);
            }
        }, 60000);
    } catch (error) {
        logStyled(`节点任务失败: ${error.message}`, colors.error);
        throw error;
    }
}


async function runAll() {
    displayHeader();
    useProxy = await promptUseProxy();

    for (const user of config) {
        for (const node of user.nodes) {
            const proxy = useProxy ? node.proxy : null;
            try {
                const ipAddress = proxy
                    ? await fetchIpAddressWithFallback(await loadFetch(), proxy ? new HttpsProxyAgent(proxy) : null)
                    : null;

                await processNode(node, proxy, ipAddress, user.usertoken);
            } catch (error) {
                logStyled(`节点 ${node.nodeId} 跳过: ${error.message}`, colors.error);
            }
        }
    }
}

runAll();
