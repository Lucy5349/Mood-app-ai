# 情绪日记 App - 免费部署指南

## 方案概述

| 服务 | 用途 | 免费额度 | 地址 |
|------|------|----------|------|
| **Railway** | 后端 + MongoDB | 500小时/月 | https://railway.app |
| **Vercel** | 前端静态部署 | 无限 | https://vercel.com |

---

## 详细部署步骤

### 第一步：准备 GitHub 仓库

1. 创建 GitHub 账号：https://github.com

2. 将项目上传到 GitHub：
```bash
cd Mood-APP

# 初始化 git（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit"

# 添加远程仓库（替换为你的 GitHub 仓库地址）
git remote add origin https://github.com/你的用户名/Mood-APP.git

# 推送
git push -u origin main
```

---

### 第二步：部署后端到 Railway

1. **访问 Railway**
   - 打开 https://railway.app
   - 使用 GitHub 账号登录

2. **创建新项目**
   - 点击 `New Project` → `Deploy from GitHub repo`
   - 授权 GitHub，选择你的仓库
   - 选择 `server` 文件夹作为部署目录

3. **添加 MongoDB 数据库**
   - 在项目面板点击 `Add Plugin`
   - 搜索 `MongoDB`
   - 点击添加，Railway 会自动配置 `MONGODB_URI` 环境变量

4. **配置环境变量**
   - 点击项目 → `Variables`
   - 添加以下变量：

   ```
   MONGODB_URI=mongodb://localhost:27017/mood_app
   JWT_SECRET=your_random_jwt_secret_here_change_this
   PORT=3000
   MAX_FILE_SIZE=2097152
   ```

   > 注意：如果 Railway 自动添加了 `MONGODB_URI`，保留它即可

5. **获取后端地址**
   - 等待部署完成（显示绿色 ✓）
   - 点击 `Settings` → 复制 `Railway URL`（格式：`https://xxxx-xxxx.railway.app`）

---

### 第三步：部署前端到 Vercel

1. **访问 Vercel**
   - 打开 https://vercel.com
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 `Add New` → `Project`
   - 选择你的 GitHub 仓库
   - Vercel 会自动检测为 Vite 项目

3. **配置环境变量**
   - 在 `Environment Variables` 中添加：

   | Name | Value |
   |------|-------|
   | `VITE_API_URL` | 你的 Railway 后端地址（如 `https://xxxx-xxxx.railway.app`） |
   | `VITE_ARK_BASE_URL` | `https://ark.cn-beijing.volces.com/api/v3` |
   | `VITE_ARK_API_KEY` | `ark-ceb31ebe-3224-47d6-bf7a-c557960d9687-c7190` |
   | `VITE_ARK_ENDPOINT_ID` | `ep-20250423112600-5zq5h` |

4. **部署**
   - 点击 `Deploy`
   - 等待构建完成（约1-2分钟）
   - 获得前端地址：`https://your-project.vercel.app`

---

### 第四步：更新后端环境变量（重要！）

回到 Railway，更新后端配置：

1. 在 Railway 项目中进入 `Variables`
2. 添加/更新：

```
FRONTEND_URL=https://your-vercel-url.vercel.app
```

这样后端可以正确配置 CORS 允许前端访问。

---

## 本地打包测试

如果想在本地先测试打包是否正常：

```bash
# 安装依赖
npm install
cd server && npm install && cd ..

# 打包前端
npm run build

# 查看打包结果
ls -la dist/
```

---

## 常见问题

### Q: 部署后 API 请求失败？
1. 检查浏览器开发者工具的 Network 面板
2. 确认 `VITE_API_URL` 设置正确（不带尾部斜杠）
3. 检查 Railway 后端日志是否有错误

### Q: MongoDB 连接失败？
1. 在 Railway 查看 MongoDB 插件状态
2. 确认 `MONGODB_URI` 格式正确
3. 检查 MongoDB 是否在睡眠状态（免费版可能休眠）

### Q: 图片上传不显示？
Railway 的免费计划对静态文件有限制。如果遇到问题，可以：
1. 将头像改为 Base64 存储（当前已支持）
2. 或使用图床服务存储图片 URL

---

## 快速回滚

- **Vercel**: Dashboard → Deployments → 选择旧版本 → `...` → `Promote to Production`
- **Railway**: Dashboard → Deployments → 选择旧版本 → `Redeploy`

---

## 成本说明

本方案**完全免费**，适合：
- 个人项目/学习
- 小规模使用
- 原型验证

免费额度说明：
- Vercel: 无限带宽，100GB 存储
- Railway: 500小时/月（睡眠后不计时）

---

## 联系方式

部署遇到问题可以提 Issue 或查看 Railway/Vercel 官方文档。
