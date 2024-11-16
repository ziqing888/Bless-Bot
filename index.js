
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

// 读取代理列表
async function readProxies() {
  try {
    const data = await fs.readFile('proxy.txt', 'utf-8');
    const proxies = data.trim().split('\n').filter(proxy => proxy);
    logTimestamped(`读取到 ${proxies.length} 个代理配置。`, colors.info);
    return proxies;
  } catch (error) {
    logTimestamped(`读取代理文件失败: ${error.message}`, colors.error);
    return [];
  }
}

// 读取节点和硬件ID列表
async function readNodeAndHardwareIds() {
  try {
    const data = await fs.readFile('id.txt', 'utf-8');
    const ids = data
      .trim()
      .split('\n')
      .filter(line => line)
      .map(line => {
        const [nodeId, hardwareId] = line.split(':');
        return { nodeId, hardwareId };
      });
    logTimestamped(`读取到 ${ids.length} 个节点配置。`, colors.info);
    return ids;
  } catch (error) {
    logTimestamped(`读取节点配置文件失败: ${error.message}`, colors.error);
    throw error;
  }
}

// 读取授权令牌
async function readAuthToken() {
  try {
    const data = await fs.readFile('user.txt', 'utf-8');
    return data.trim();
  } catch (error) {
    logTimestamped(`读取授权令牌失败: ${error.message}`, colors.error);
    throw error;
  }
}

// 获取IP地址
async function fetchIpAddress(fetch, agent) {
  try {
    const response = await fetch('https://tight-block-2413.txlabs.workers.dev', { agent });
    const data = await response.json();
    logTimestamped(`获取到IP地址: ${colors.ip(data.ip)}`, colors.success);
    return data.ip;
  } catch (error) {
    logTimestamped(`获取IP地址失败: ${error.message}`, colors.error);
    throw error;
  }
}

// 注册节点
async function registerNode(fetch, nodeId, hardwareId, authToken, ipAddress, agent) {
  const registerUrl = `https://gateway-run.bls.dev/api/v1/nodes/${nodeId}`;
  logTimestamped(`注册节点 ${colors.id(nodeId)}，硬件ID: ${colors.id(hardwareId)}，IP地址: ${colors.ip(ipAddress)}`, colors.info);

  try {
    const response = await fetch(registerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
async function startSession(fetch, nodeId, authToken, agent) {
  const sessionUrl = `https://gateway-run.bls.dev/api/v1/nodes/${nodeId}/start-session`;
  logTimestamped(`启动会话: ${colors.id(nodeId)}`, colors.info);

  try {
    const response = await fetch(sessionUrl, {
      method: 'POST',
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

// ping 节点
async function pingNode(fetch, nodeId, authToken, agent) {
  const pingUrl = `https://gateway-run.bls.dev/api/v1/nodes/${nodeId}/ping`;
  logTimestamped(`Ping节点: ${colors.id(nodeId)}`, colors.info);

  try {
    const response = await fetch(pingUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      agent,
    });

    const data = await response.json();
    logTimestamped(`Ping成功: ${JSON.stringify(data, null, 2)}`, colors.success);
    return data;
  } catch (error) {
    logTimestamped(`Ping失败: ${error.message}`, colors.error);
    throw error;
  }
}

// 处理单个节点
async function processNode(fetch, nodeId, hardwareId, authToken, proxy, agent) {
  try {
    const ipAddress = await fetchIpAddress(fetch, agent);
    await registerNode(fetch, nodeId, hardwareId, authToken, ipAddress, agent);
    await startSession(fetch, nodeId, authToken, agent);
    setInterval(() => pingNode(fetch, nodeId, authToken, agent), 60 * 1000);
  } catch (error) {
    logTimestamped(`节点 ${nodeId} 处理失败: ${error.message}`, colors.error);
  }
}

// 主运行函数
async function run() {
  try {
    displayHeader();

    const useProxy = await promptUseProxy();
    const fetch = await loadFetch();
    const authToken = await readAuthToken();
    const ids = await readNodeAndHardwareIds();
    const proxies = await readProxies();

    if (useProxy && proxies.length !== ids.length) {
      logTimestamped('代理数量与节点数量不匹配，请检查配置文件！', colors.error);
      return;
    }

    await Promise.all(
      ids.map((id, index) => {
        const proxy = useProxy ? proxies[index] : null;
        const agent = proxy ? new HttpsProxyAgent(proxy) : null;
        return processNode(fetch, id.nodeId, id.hardwareId, authToken, proxy, agent);
      })
    );
  } catch (error) {
    logTimestamped(`运行失败: ${error.message}`, colors.error);
  }
}

run();
