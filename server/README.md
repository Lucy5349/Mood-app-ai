# Mood App Server

情绪日记 AI 应用后端服务

## 技术栈

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **Password Hashing**: bcryptjs

## 环境要求

- Node.js 16+
- MongoDB 4.4+

## 安装步骤

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 启动 MongoDB

确保本地 MongoDB 已运行：

```bash
# macOS (使用 brew)
brew services start mongodb-community

# Windows
net start MongoDB

# 或使用 Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 3. 配置环境

编辑 `.env` 文件：

```env
MONGODB_URI=mongodb://localhost:27017/mood_app
JWT_SECRET=your_secret_key_here
PORT=3000
```

### 4. 启动服务

```bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm start
```

服务将在 http://localhost:3000 运行

## API 接口

### 认证接口

| 方法 | 路径 | 描述 | 参数 |
|------|------|------|------|
| POST | `/api/auth/register` | 注册用户 | username, password |
| POST | `/api/auth/login` | 用户登录 | username, password |
| GET | `/api/auth/me` | 获取当前用户 | - |

### 用户接口

| 方法 | 路径 | 描述 | 参数 |
|------|------|------|------|
| GET | `/api/user/profile` | 获取用户资料 | - |
| PUT | `/api/user/avatar` | 上传头像(文件) | avatar (file) |
| PUT | `/api/user/avatar/base64` | 上传头像(Base64) | avatar (string) |
| PUT | `/api/user/username` | 修改用户名 | username |

### 日记接口

| 方法 | 路径 | 描述 | 参数 |
|------|------|------|------|
| GET | `/api/diary` | 获取所有日记 | - |
| GET | `/api/diary/today` | 获取今日日记 | - |
| GET | `/api/diary/:id` | 获取单篇日记 | - |
| POST | `/api/diary` | 创建日记 | content, moodTag, score, date |
| PUT | `/api/diary/:id` | 更新日记 | content, moodTag, score |
| DELETE | `/api/diary/:id` | 删除日记 | - |
| GET | `/api/diary/stats/summary` | 获取统计摘要 | - |

## 接口示例

### 注册

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "123456"}'
```

### 登录

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "123456"}'
```

### 创建日记

```bash
curl -X POST http://localhost:3000/api/diary \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "content": "今天心情不错！",
    "moodTag": "happy",
    "score": 85,
    "date": "2024-01-15"
  }'
```

### 上传头像

```bash
curl -X PUT http://localhost:3000/api/user/avatar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "avatar=@/path/to/image.jpg"
```

## 项目结构

```
server/
├── .env              # 环境变量配置
├── package.json
├── src/
│   ├── app.js        # 应用入口
│   ├── config/
│   │   └── db.js     # 数据库连接
│   ├── middleware/
│   │   └── auth.js   # 认证中间件
│   ├── models/
│   │   ├── User.js   # 用户模型
│   │   └── Diary.js  # 日记模型
│   └── routes/
│       ├── auth.js   # 认证路由
│       ├── user.js   # 用户路由
│       └── diary.js  # 日记路由
└── uploads/          # 上传文件目录
    └── avatars/      # 头像存储
```
