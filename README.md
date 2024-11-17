# 祝福小助手 - Blockless 网络的智能伙伴 🤖🎉

## 这个小助手是什么？
祝福小助手是一款专为无服务器网络爱好者设计的智能工具，它能自动化管理节点、提供实时反馈，让您在无服务器网络的旅途中轻松掌握一切！



## 准备工作
1. 需要您安装 [Node.js](https://nodejs.org/)，版本要求在 12 以上。
2. 小助手目前为 `MIT` 许可证，您可以放心使用和分享。

## 如何安装？
1. **下载小助手**：将项目克隆到您的本地电脑。
   ```bash
   git clone https://github.com/ziqing888/Bless-Bot.git
    ```
   转到
 ```bash
 cd Bless-Bot
  ```
配置与设置 - 小助手专属秘籍 🗝️
1. 创建 user.txt 文件，把您的令牌 B7S_AUTH_TOKEN 直接贴进去，格式如下：
 ```bash
   eyJhbGciOiJIUxxx...（完整的认证令牌）

 ```
在用户面板获取令牌（F12开发者工具里看本地存储 或是直接在控制台输入）
```bash
localStorage.getItem('B7S_AUTH_TOKEN')
  ```
![image](https://github.com/user-attachments/assets/d885bd81-30bb-4911-8204-04936263f8d6)
然后下载扩展程序
下载之后浏览器打开 chrome://extensions/?id=pljbjcehnhcnofmkdbjolghdcjnmekia
![image](https://github.com/user-attachments/assets/eb7074be-7520-49e9-8c73-aa51d05f897c)
接着找到nodeid(pubkey)和hardwareid
![image](https://github.com/user-attachments/assets/072fac55-d32e-4029-846e-c9329938aeee)

 可选：配置代理

如果需要为节点配置代理，可以在 config.js 中添加代理地址。例如：
```bash
module.exports = [
    {
        usertoken: 'usertoken1',
        nodes: [
            { nodeId: 'nodeid(pubkey)1', hardwareId: 'hardwareid1', proxy: 'proxy1' },
            { nodeId: 'nodeid(pubkey)2', hardwareId: 'hardwareid2', proxy: 'proxy2' },
            { nodeId: 'nodeid(pubkey)3', hardwareId: 'hardwareid3', proxy: 'proxy3' },
            { nodeId: 'nodeid(pubkey)4', hardwareId: 'hardwareid4', proxy: 'proxy4' },
            { nodeId: 'nodeid(pubkey)5', hardwareId: 'hardwareid5', proxy: 'proxy5' }
        ]
    },
    {
        usertoken: 'usertoken2',
        nodes: [
            { nodeId: 'nodeid(pubkey)6', hardwareId: 'hardwareid6', proxy: 'proxy6' }
        ]
    }
    // 添加更多的用户
];
```

## 重要说明
每个账户最多可注册 5 个节点 ID。

节点 ID 和硬件 ID 无法删除，请妥善保存。

连接会每 10 分钟刷新一次。

##运行脚本
```bash
node index.js
```
代理格式
```
http://user123:password123@192.168.1.100:8080
socks5://user123:password123@192.168.1.100:1080
```
跑代理的要先生成设备publicKey和hardwareID

使用命令
```bash
node generate_mac.js
 ```
