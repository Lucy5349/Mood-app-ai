# Mood App AI - 情绪日记应用

一个使用 Vue + Node.js 构建的情绪日记应用，支持 AI 情感分析和用户认证。

## 项目结构

```
Mood-APP/
├── src/                 # 前端 (Vue 3 + TypeScript)
├── server/              # 后端 (Node.js + Express + MongoDB)
└── README.md
```

## 快速开始

### 1. 启动后端服务

```bash
cd server
npm install

# 确保 MongoDB 已运行
# 启动服务
npm start
```

### 2. 启动前端

```bash
# 在项目根目录
npm install
npm run dev
```

前端运行在 http://localhost:5173
后端运行在 http://localhost:3000

## 功能特性

- 用户注册/登录
- 用户头像上传
- 情绪日记记录
- 心情标签和评分
- AI 情感分析（需配置 AI API）
- 深色模式支持
- 响应式设计

## 技术栈

### 前端
- Vue 3 + Composition API
- TypeScript
- Vue Router
- Pinia
- Tailwind CSS
- 豆包 AI API（可选）

### 后端
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT 认证
- bcryptjs 密码加密
- Multer 文件上传
