FROM node:16

# 设置工作目录
WORKDIR /usr/src/app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制所有文件到容器
COPY . .

# 暴露端口
EXPOSE 8080

# 启动脚本
CMD ["node", "src/main.js"]
