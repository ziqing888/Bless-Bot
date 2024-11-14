const { registerNode, startSession, stopSession } = require('./api');
const { readNodeAndHardwareId, readAuthToken } = require('./fileUtils');
const { pingNodeWithInterval } = require('./ping');
const chalk = require('chalk');
const inquirer = require('inquirer');

// 显示自定义 Logo
function displayHeader() {
  console.log(chalk.yellow('╔════════════════════════════════════════╗'));
  console.log(chalk.yellow('║      🚀   Bless-Bot         🚀         ║'));
  console.log(chalk.yellow('║  👤    脚本编写：子清                  ║'));
  console.log(chalk.yellow('║  📢  电报频道：https://t.me/ksqxszq    ║'));
  console.log(chalk.yellow('╚════════════════════════════════════════╝'));
  console.log(); // 添加额外空行以分隔内容
}

// 主运行函数
async function runAll() {
  try {
    await displayHeader(); // 显示自定义 Logo

    const { nodeId, hardwareId, authToken } = await readMultipleFiles();
    console.log(`[${new Date().toISOString()}] 读取到节点 ID：${nodeId}，硬件 ID：${hardwareId}`);

    const registrationResponse = await registerNode(nodeId, hardwareId, authToken);
    console.log(`[${new Date().toISOString()}] 节点注册完成，响应：`, registrationResponse);

    const startSessionResponse = await startSession(nodeId, authToken);
    console.log(`[${new Date().toISOString()}] 会话已启动，响应：`, startSessionResponse);

    // 启动 ping 请求
    await pingNodeWithInterval(nodeId, authToken);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] 发生错误：`, error);
  }
}

// 执行主函数
runAll();
