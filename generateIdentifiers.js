const crypto = require('crypto');
const fs = require('fs');
const readline = require('readline');

// 随机生成硬件标识符
function getRandomHardwareIdentifier() {
    const randomCpuArchitecture = Math.random() > 0.5 ? 'x64' : 'x86';
    const randomCpuModel = `虚拟 CPU 型号 ${Math.floor(Math.random() * 1000)}`;
    const randomNumOfProcessors = Math.floor(Math.random() * 8) + 1;
    const randomTotalMemory = Math.floor(Math.random() * 16 + 1) * 1024 * 1024 * 1024;

    const cpuInfo = {
        cpuArchitecture: randomCpuArchitecture,
        cpuModel: randomCpuModel,
        numOfProcessors: randomNumOfProcessors,
        totalMemory: randomTotalMemory,
    };

    return Buffer.from(JSON.stringify(cpuInfo)).toString('base64');
}

// 生成设备标识符
async function generateDeviceIdentifier() {
    const hardwareIdentifier = getRandomHardwareIdentifier();
    const deviceInfo = JSON.stringify({ hardware: hardwareIdentifier });
    const hash = crypto.createHash('sha256');
    hash.update(deviceInfo);
    return hash.digest('hex');
}

// 生成公钥
function generatePubKey(length = 52) {
    const prefix = "12D3KooW";
    const remainingLength = length - prefix.length;
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return prefix + Array.from({ length: remainingLength }, () =>
        characters.charAt(Math.floor(Math.random() * characters.length))
    ).join('');
}

// 保存生成的数据到文件
function saveToFile(filename, data) {
    try {
        fs.writeFileSync(filename, data);
        return true;
    } catch (error) {
        console.error(`保存到文件失败：${error.message}`);
        return false;
    }
}

// 主函数
async function main() {
    const chalk = (await import('chalk')).default;

    console.log(chalk.red.bold('⚠️ 仅供测试用途，不建议在生产环境中使用 ⚠️'));

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question(chalk.cyan('请输入要生成的标识符数量：'), async (answer) => {
        const total = parseInt(answer, 10);

        if (isNaN(total) || total <= 0) {
            console.log(chalk.red('❌ 输入的数量无效，请输入一个正整数！'));
            rl.close();
            return;
        }

        console.log(chalk.green(`开始生成 ${total} 个标识符...\n`));
        let output = '';

        for (let i = 0; i < total; i++) {
            try {
                const deviceIdentifier = await generateDeviceIdentifier();
                const publicKey = generatePubKey();

                const logEntry = `设备标识符 ${i + 1}: ${chalk.green(deviceIdentifier)}\n公钥 ${i + 1}: ${chalk.blue(publicKey)}\n`;
                const formattedEntry = `${publicKey}:${deviceIdentifier}\n`;

                output += formattedEntry;
                console.log(logEntry);
            } catch (error) {
                console.error(chalk.red(`生成标识符时出错：${error.message}`));
            }
        }

        const isSaved = saveToFile('output.txt', output);
        if (isSaved) {
            console.log(chalk.yellow('✅ 数据已成功保存到 output.txt 文件中'));
        }

        rl.close();
    });
}

main();

