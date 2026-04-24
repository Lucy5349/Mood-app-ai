require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const connectDB = require('./config/db')

// 导入路由
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/user')
const diaryRoutes = require('./routes/diary')

// 连接数据库
connectDB()

const app = express()

// 中间件
app.use(cors())
app.use(express.json({ limit: '10mb' }))  // 支持大数据上传
app.use(express.urlencoded({ extended: true }))

// 静态文件服务（头像图片）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// API 路由
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/diary', diaryRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务运行中' })
})

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err)
  
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: '文件大小超过限制' })
    }
    return res.status(400).json({ message: '文件上传错误' })
  }
  
  if (err.message && err.message.includes('只支持图片')) {
    return res.status(400).json({ message: err.message })
  }
  
  res.status(500).json({ message: '服务器错误' })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`)
  console.log(`📖 API 文档:`)
  console.log(`   POST /api/auth/register - 注册`)
  console.log(`   POST /api/auth/login - 登录`)
  console.log(`   GET  /api/auth/me - 获取当前用户`)
  console.log(`   PUT  /api/user/avatar - 上传头像`)
  console.log(`   GET  /api/diary - 获取日记列表`)
  console.log(`   POST /api/diary - 创建日记`)
  console.log(`   PUT  /api/diary/:id - 更新日记`)
  console.log(`   DELETE /api/diary/:id - 删除日记`)
})
