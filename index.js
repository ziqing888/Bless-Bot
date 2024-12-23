const fs = require('fs').promises;
const path = require('path');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');
const chalk = require('chalk');
const readline = require('readline');
const config = require('./config');

const apiBaseUrl = "https://gateway-run.bls.dev/api/v1";
let useProxy;
const MAX_PING_ERRORS = 3;
const pingInterval = 120000;  
const restartDelay = 240000;  
const processRestartDelay = 150000;  
const retryDelay = 150000; 
const hardwareInfoFile = path.join(__dirname, 'hardwareInfo.json');


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
    console.log(colors.header('║      🎀  Blockless Bless 网络机器人     ║'));
    console.log(colors.header('║       🐱 编写：qklxsqf                  ║'));
    console.log(colors.header('║    🎉 电报频道：https://t.me/ksqxszq     ║'));
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


const ipServiceUrls = [
    "https://ip-check.bls.dev/api/v1/ip",  
    "https://api.ipify.org?format=json"   
];

async function fetchIpAddressWithFallback(fetch, agent = null) {
    for (const url of ipServiceUrls) {
        try {
            const response = await fetch(url, { agent, headers: commonHeaders });
            const data = await response.json();
            logStyled(`获取到 IP 地址: ${data.ip}`, colors.ip, `🔗 来自服务: ${url} `, ' ✅');
            return data.ip;
        } catch (error) {
            logStyled(`从服务 ${url} 获取 IP 失败: ${error.message}`, colors.error, '', ' ❌');
        }
    }
    throw new Error("所有 IP 服务都不可用");
}


const commonHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.5"  
};

function generateRandomHardwareInfo() {
    const cpuModels = [
        "AMD Ryzen 9 5900HS", "Intel Core i7-10700K", "AMD Ryzen 5 3600",
        "Intel Core i9-10900K", "AMD Ryzen 7 3700X", "Intel Core i5-10600K",
        "AMD Ryzen 3 3300X", "Intel Core i3-10100", "AMD Ryzen 7 5800X",
        "Intel Core i5-11600K", "AMD Ryzen 5 5600X", "Intel Core i3-10320",
        "AMD Ryzen 3 3100", "Intel Core i9-9900K", "AMD Ryzen 9 3900X",
        "Intel Core i7-9700K", "AMD Ryzen 7 2700X", "Intel Core i5-9600K",
        "AMD Ryzen 5 2600", "Intel Core i3-9100", "AMD Ryzen 3 2200G",
        "Intel Core i9-11900K", "AMD Ryzen 9 5950X", "Intel Core i7-11700K",
        "AMD Ryzen 5 4500U", "Intel Core i7-10750H", "AMD Ryzen 7 4800H",
        "Intel Core i5-10210U", "AMD Ryzen 3 4300U", "Intel Core i3-1005G1",
        "AMD Ryzen 9 4900HS", "Intel Core i9-10850K", "AMD Ryzen 9 3950X",
        "Intel Core i7-10700", "AMD Ryzen 7 3700U", "Intel Core i5-10400",
        "AMD Ryzen 5 3550H", "Intel Core i3-10100F", "AMD Ryzen 3 3200G",
        "Intel Core i9-9900KS", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-9750H", "AMD Ryzen 5 4600H",
        "Intel Core i9-10940X", "AMD Ryzen 7 2700", "Intel Core i5-9400F",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400",
        "AMD Ryzen 3 1200", "Intel Core i3-8100", "AMD Ryzen 9 5900X",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i7-10710U", "AMD Ryzen 7 2700E",
        "Intel Core i5-9500", "AMD Ryzen 5 3400G", "Intel Core i3-8300",
        "AMD Ryzen 3 1300X", "Intel Core i9-10980HK", "AMD Ryzen 5 3600X",
        "Intel Core i7-10700F", "AMD Ryzen 7 2700", "Intel Core i5-9400"
    ];
    const cpuFeatures = ["mmx", "sse", "sse2", "sse3", "ssse3", "sse4_1", "sse4_2", "avx"];
    return {
        cpuArchitecture: "x86_64",
        cpuModel: cpuModels[Math.floor(Math.random() * cpuModels.length)],
        cpuFeatures: cpuFeatures.slice(0, Math.floor(Math.random() * cpuFeatures.length) + 1),
        numOfProcessors: Math.floor(Math.random() * 8) + 4,
        totalMemory: Math.floor(Math.random() * (128 - 8 + 1) + 8) * 1024 * 1024 * 1024
    };
}

async function loadHardwareInfo() {
    try {
        const data = await fs.readFile(hardwareInfoFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

async function saveHardwareInfo(hardwareInfo) {
    await fs.writeFile(hardwareInfoFile, JSON.stringify(hardwareInfo, null, 2));
}


async function registerNode(nodeId, hardwareId, ipAddress, proxy, authToken) {
    const fetch = await loadFetch();
    const agent = proxy ? (proxy.startsWith('socks') ? new SocksProxyAgent(proxy) : new HttpsProxyAgent(proxy)) : null;
    const registerUrl = `${apiBaseUrl}/nodes/${nodeId}`;

    logStyled(`注册节点: ${nodeId}`, colors.id, `🔧 IP: ${colors.ip(ipAddress)} `, ' ⏳');
    try {
        let hardwareInfo = await loadHardwareInfo();
        if (!hardwareInfo[nodeId]) {
            hardwareInfo[nodeId] = generateRandomHardwareInfo();
            await saveHardwareInfo(hardwareInfo);
        }

        const response = await fetch(registerUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
                ...commonHeaders
            },
            body: JSON.stringify({ 
                ipAddress, 
                hardwareId, 
                hardwareInfo: hardwareInfo[nodeId], 
                extensionVersion: "0.1.7" 
            }),
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
    const agent = proxy ? (proxy.startsWith('socks') ? new SocksProxyAgent(proxy) : new HttpsProxyAgent(proxy)) : null;
    const sessionUrl = `${apiBaseUrl}/nodes/${nodeId}/start-session`;

    logStyled(`启动会话: ${nodeId}`, colors.id, '', ' ⏳');
    try {
        const response = await fetch(sessionUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${authToken}`,
                ...commonHeaders
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


async function pingNode(nodeId, proxy, ipAddress, authToken, pingErrorCount) {
    const fetch = await loadFetch();
    const agent = proxy ? (proxy.startsWith('socks') ? new SocksProxyAgent(proxy) : new HttpsProxyAgent(proxy)) : null;
    const pingUrl = `${apiBaseUrl}/nodes/${nodeId}/ping`;

    logStyled(`Ping 节点: ${nodeId}`, colors.id, '', ' ⏳');
    try {
        const response = await fetch(pingUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${authToken}`,
                ...commonHeaders
            },
            agent,
        });
        const data = await response.json();
        if (!data.status) {
            logStyled(`首次 Ping 触发, 节点ID: ${nodeId}, 代理: ${proxy ? '是' : '否'}, IP: ${ipAddress}`, colors.info, '', ' ✅');
        } else {
            let statusColor = data.status.toLowerCase() === 'ok' ? colors.success : colors.error;
            const logMessage = `Ping 响应状态: ${statusColor(data.status.toUpperCase())}, 节点ID: ${nodeId}, 代理: ${proxy ? '是' : '否'}, IP: ${ipAddress}`;
            logStyled(logMessage, colors.info, '', '');
        }
        pingErrorCount[nodeId] = 0;
        return data;
    } catch (error) {
        logStyled(`Ping 失败: ${error.message}`, colors.error, '', ' ❌');
        pingErrorCount[nodeId] = (pingErrorCount[nodeId] || 0) + 1;
        throw error;
    }
}

const activeNodes = new Set();
const nodeIntervals = new Map();


async function processNode(node, proxy, ipAddress, authToken) {
    const pingErrorCount = {};
    let intervalId = null;

    logSeparator('节点任务启动');
    while (true) {
        try {
            if (activeNodes.has(node.nodeId)) {
                logStyled(`节点 ${node.nodeId} 已在处理中。`, colors.warning, '', '');
                return;
            }

            activeNodes.add(node.nodeId);
            logStyled(`处理节点: ${node.nodeId}`, colors.id, `🔧 硬件 ID: ${node.hardwareId} `, ' ⏳');

            const registrationResponse = await registerNode(node.nodeId, node.hardwareId, ipAddress, proxy, authToken);
            const startSessionResponse = await startSession(node.nodeId, proxy, authToken);

            // 发送初始 Ping
            logStyled(`发送初始 Ping，节点ID: ${node.nodeId}`, colors.info, '', '');
            await pingNode(node.nodeId, proxy, ipAddress, authToken, pingErrorCount);

            if (!nodeIntervals.has(node.nodeId)) {
                intervalId = setInterval(async () => {
                    try {
                        logStyled(`发送 Ping，节点ID: ${node.nodeId}`, colors.info, '', '');
                        await pingNode(node.nodeId, proxy, ipAddress, authToken, pingErrorCount);
                    } catch (error) {
                        logStyled(`Ping 过程中出错: ${error.message}`, colors.error, '', ' ❌');

                        pingErrorCount[node.nodeId] = (pingErrorCount[node.nodeId] || 0) + 1;
                        if (pingErrorCount[node.nodeId] >= MAX_PING_ERRORS) {
                            clearInterval(nodeIntervals.get(node.nodeId));
                            nodeIntervals.delete(node.nodeId);
                            activeNodes.delete(node.nodeId);
                            logStyled(`节点 ${node.nodeId} 连续 ${MAX_PING_ERRORS} 次 Ping 失败。正在重启进程...`, colors.error, '', ' ❌');
                            await new Promise(resolve => setTimeout(resolve, processRestartDelay));
                            await processNode(node, proxy, ipAddress, authToken);
                        }
                    }
                }, pingInterval);
                nodeIntervals.set(node.nodeId, intervalId);
            }

            break;

        } catch (error) {
            if (error.message.includes('proxy') || error.message.includes('connect') || error.message.includes('authenticate')) {
                logStyled(`节点ID: ${node.nodeId} 代理错误，15分钟后重试: ${error.message}`, colors.error, '', ' ❌');
                setTimeout(() => processNode(node, proxy, ipAddress, authToken), retryDelay);
            } else {
                logStyled(`节点ID: ${node.nodeId} 发生错误，50秒后重启进程: ${error.message}`, colors.error, '', ' ❌');
                await new Promise(resolve => setTimeout(resolve, restartDelay));
            }
        } finally {
            activeNodes.delete(node.nodeId);
        }
    }
}


async function runAll(initialRun = true) {
    try {
        if (initialRun) {
            displayHeader();
            useProxy = await promptUseProxy();
            logStyled(`使用代理: ${useProxy ? '是' : '否'}`, colors.info, '🔍 ', '');
        }

        const fetch = await loadFetch();
        const publicIpAddress = useProxy ? null : await fetchIpAddressWithFallback(fetch, null);

        let hardwareInfo = await loadHardwareInfo();


        config.forEach(user => {
            user.nodes.forEach(node => {
                if (!hardwareInfo[node.nodeId]) {
                    hardwareInfo[node.nodeId] = generateRandomHardwareInfo();
                }
            });
        });

        await saveHardwareInfo(hardwareInfo);

        const nodePromises = config.flatMap(user =>
            user.nodes.map(async node => {
                try {
                    const proxy = useProxy ? node.proxy : null;
                    const agent = proxy ? (proxy.startsWith('socks') ? new SocksProxyAgent(proxy) : new HttpsProxyAgent(proxy)) : null;
                    const ipAddress = useProxy 
                        ? await fetchIpAddressWithFallback(fetch, agent)
                        : publicIpAddress;

                    if (ipAddress) {
                        await processNode(node, proxy, ipAddress, user.usertoken);
                    } else {
                        logStyled(`跳过节点 ${node.nodeId}，因无法获取 IP 地址。15分钟后重试。`, colors.warning, '', ' ⚠️');
                        setTimeout(async () => {
                            try {
                                const newIpAddress = useProxy 
                                    ? await fetchIpAddressWithFallback(fetch, agent)
                                    : publicIpAddress;
                                if (newIpAddress) {
                                    await processNode(node, proxy, newIpAddress, user.usertoken);
                                } else {
                                    logStyled(`再次获取节点 ${node.nodeId} 的 IP 地址失败。`, colors.error, '', ' ❌');
                                }
                            } catch (error) {
                                logStyled(`节点 ${node.nodeId} 处理失败，错误: ${error.message}`, colors.error, '', ' ❌');
                            }
                        }, retryDelay);
                    }
                } catch (error) {
                    logStyled(`节点 ${node.nodeId} 处理失败，跳过: ${error.message}`, colors.error, '', ' ❌');
                }
            })
        );

        await Promise.allSettled(nodePromises);
    } catch (error) {
        logStyled(`运行失败: ${error.message}`, colors.error, '', ' ❌');
    }
}

process.on('uncaughtException', (error) => {
    logStyled(`未捕获的异常: ${error.message}`, colors.error, '', ' ❌');
    setTimeout(() => runAll(false), 5000);
});


runAll();
