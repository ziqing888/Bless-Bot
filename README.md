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
    cd bless-bot
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

把他们放在id.txt 文件里面
格式如下
```bash
12D31pubKey：2a59fef6472e7hardwareId

```
如果使用代理在文件proxy.txt编辑
一个账户最多只能有 5 个 nodeid，且无法删除，我建议保存您账户的 Nodeid（pubkey） 和 hardwareid
