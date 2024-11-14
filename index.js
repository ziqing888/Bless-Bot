const fs = require('fs').promises;
const { HttpsProxyAgent } = require('https-proxy-agent');
const readline = require('readline');
const chalk = require('chalk');

// 定义颜色和样式
const colors = {
  header: chalk.hex('#FFD700'),         // 柔和的金黄色
  info: chalk.hex('#87CEEB'),           // 天蓝色
  success: chalk.hex('#32CD32'),        // 浅绿色
  error: chalk.hex('#FF6347'),          // 番茄红色
  timestamp: chalk.hex('#4682B4'),      // 柔和的蓝色
  id: chalk.hex('#FF69B4'),             // 粉红色
  ip: chalk.hex('#9370DB'),             // 浅紫色
};

// 显示标题头部信息
function displayHeader() {
  console.log(colors.header('╔════════════════════════════════════════╗'));
  console.log(colors.header('║      🎀  祝福小助手 Bless-Bot 🎀       ║'));
  console.log(colors.header('║     🐱 编写：@qklxsqf                  ║'));
  console.log(colors.header('║  🎉 电报频道：https://t.me/ksqxszq     ║'));
  console.log(colors.header('╚════════════════════════════════════════╝'));
  console.log();
}

// 输出带时间戳的日志
function logTimestamped(message, style = colors.info) {
  console.log(`${colors.timestamp(`[${new Date().toISOString()}]`)} ${style(message)}`);
}

// 加载 fetch 模块
async function loadFetch() {
  const fetch = await import('node-fetch').then(module => module.default);
  return fetch;
}

// 读取代理配置
async function readProxy() {
  try {
    const data = await fs.readFile('proxy.txt', 'utf-8');
    const proxies = data.trim().split('\n').filter(proxy => proxy);
    if (proxies.length === 0) {
      logTimestamped("呜呜，没有找到代理，继续直接工作啦～", colors.info);
      return null;
    }
    const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];
    logTimestamped(`正在使用代理哦，代理地址是: ${colors.ip(randomProxy)}`);
    return randomProxy;
  } catch (error) {
    logTimestamped(`哎呀～读取代理文件时出错了: ${error.message}`, colors.error);
    return null;
  }
}

const apiBaseUrl = "https://gateway-run.bls.dev/api/v1";
const ipServiceUrl = "https://tight-block-2413.txlabs.workers.dev";

// 读取节点和硬件ID
async function readNodeAndHardwareId() {
  try {
    const data = await fs.readFile('id.txt', 'utf-8');
    const [nodeId, hardwareId] = data.trim().split(':');
    logTimestamped(`主人，找到你的节点ID啦～ID: ${colors.id(nodeId)}, 硬件ID: ${colors.id(hardwareId)}`);
    return { nodeId, hardwareId };
  } catch (error) {
    logTimestamped(`唔...读取ID文件时遇到了困难: ${error.message}`, colors.error);
    throw error;
  }
}

// 读取授权令牌
async function readAuthToken() {
  try {
    const data = await fs.readFile('user.txt', 'utf-8');
    return data.trim();
  } catch (error) {
    logTimestamped(`唔...读取用户授权文件时出错了: ${error.message}`, colors.error);
    throw error;
  }
}

// 提示是否使用代理
async function promptUseProxy() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question('要用代理吗？（y/n）: ', answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// 注册节点
async function registerNode(nodeId, hardwareId, useProxy) {
  const fetch = await loadFetch();
  const authToken = await readAuthToken();
  let agent;

  if (useProxy) {
    const proxy = await readProxy();
    if (proxy) agent = new HttpsProxyAgent(proxy);
  }

  const registerUrl = `${apiBaseUrl}/nodes/${nodeId}`;
  const ipAddress = await fetchIpAddress(fetch, agent);
  logTimestamped(`正在为主人注册节点，IP地址是: ${colors.ip(ipAddress)}，硬件ID: ${colors.id(hardwareId)}，请稍等哦～`, colors.info);

  try {
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

    const data = await response.json();
    logTimestamped(`主人，节点注册成功啦！🎉 这里是返回的信息哦: ${JSON.stringify(data, null, 2)}`, colors.success);
    return data;
  } catch (error) {
    logTimestamped(`哎呀，注册节点时遇到了错误: ${error.message}`, colors.error);
    throw error;
  }
}

// 启动节点会话
async function startSession(nodeId, useProxy) {
  const fetch = await loadFetch();
  const authToken = await readAuthToken();
  let agent;

  if (useProxy) {
    const proxy = await readProxy();
    if (proxy) agent = new HttpsProxyAgent(proxy);
  }

  const startSessionUrl = `${apiBaseUrl}/nodes/${nodeId}/start-session`;
  logTimestamped(`开始为节点 ${colors.id(nodeId)} 启动会话哦，请稍等片刻～`, colors.info);

  try {
    const response = await fetch(startSessionUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      agent
    });

    const data = await response.json();
    logTimestamped(`会话启动成功啦，主人！🎉 哇哦，这是返回的信息: ${JSON.stringify(data, null, 2)}`, colors.success);
    return data;
  } catch (error) {
    logTimestamped(`呜呜，启动会话时遇到了问题: ${error.message}`, colors.error);
    throw error;
  }
}

// ping 节点
async function pingNode(nodeId, useProxy) {
  const fetch = await loadFetch();
  const authToken = await readAuthToken();
  let agent;

  if (useProxy) {
    const proxy = await readProxy();
    if (proxy) agent = new HttpsProxyAgent(proxy);
  }

  const pingUrl = `${apiBaseUrl}/nodes/${nodeId}/ping`;
  logTimestamped(`对你的电脑 ${colors.id(nodeId)} 进行狂轰乱炸...`, colors.info);

  try {
    const response = await fetch(pingUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      agent
    });

    const data = await response.json();
    if (data.pings && Array.isArray(data.pings) && data.pings.length > 0) {
      const lastPing = data.pings[data.pings.length - 1].timestamp;
      logTimestamped(`发射成功啦！节点ID: ${colors.id(nodeId)}, 上次发射时间是: ${colors.info(lastPing)}`, colors.success);
    } else {
      logTimestamped("嗯...没有ping数据返回呢", colors.info);
    }
    return data;
  } catch (error) {
    logTimestamped(`ping节点时出现了问题呢: ${error.message}`, colors.error);
    throw error;
  }
}

// 获取IP地址
async function fetchIpAddress(fetch, agent) {
  try {
    const response = await fetch(ipServiceUrl, { agent });
    const data = await response.json();
    logTimestamped(`哇哦，获取到了IP地址: ${colors.ip(data.ip)}`, colors.ip);
    return data.ip;
  } catch (error) {
    logTimestamped(`获取IP地址时遇到了问题: ${error.message}`, colors.error);
    throw error;
  }
}

// 主运行函数
async function run() {
  try {
    displayHeader();

    const useProxy = await promptUseProxy();
    const { nodeId, hardwareId } = await readNodeAndHardwareId();

    const registrationResponse = await registerNode(nodeId, hardwareId, useProxy);
    logTimestamped(`节点注册完成，开始工作啦～💪 ${JSON.stringify(registrationResponse, null, 2)}`, colors.success);

    const startSessionResponse = await startSession(nodeId, useProxy);
    logTimestamped(`会话启动完成，工作顺利进行中！💨 ${JSON.stringify(startSessionResponse, null, 2)}`, colors.success);

    logTimestamped("首次发射检测开始咯～请稍候...", colors.info);
    await pingNode(nodeId, useProxy);

    setInterval(async () => {
      logTimestamped("好累，但是我还要努力为主人工作...", colors.info);
      await pingNode(nodeId, useProxy);
    }, 60 * 1000);  // 每分钟ping一次
  } catch (error) {
    logTimestamped(`哎呀，执行过程中发生了问题: ${error.message}`, colors.error);
  }
}

run();
