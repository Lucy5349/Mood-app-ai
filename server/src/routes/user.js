const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { protect } = require('../middleware/auth')
const User = require('../models/User')

const router = express.Router()

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads/avatars')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, `avatar-${req.user._id}-${uniqueSuffix}${ext}`)
  }
})

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)

  if (extname && mimetype) {
    cb(null, true)
  } else {
    cb(new Error('只支持图片格式: jpeg, jpg, png, gif, webp'))
  }
}

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 2 * 1024 * 1024 },
  fileFilter
})

// @route   PUT /api/user/avatar
// @desc    上传头像
// @access  Private
router.put('/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请选择图片文件' })
    }

    // 删除旧头像文件（如果存在且不是默认头像）
    const user = await User.findById(req.user._id)
    if (user.avatar && user.avatar.startsWith('/uploads/')) {
      const oldAvatarPath = path.join(__dirname, '../..', user.avatar)
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath)
      }
    }

    // 更新用户头像
    const avatarUrl = `/uploads/avatars/${req.file.filename}`
    user.avatar = avatarUrl
    await user.save()

    res.json({ avatar: avatarUrl })
  } catch (error) {
    console.error('上传头像错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// @route   PUT /api/user/avatar/base64
// @desc    上传 Base64 头像
// @access  Private
router.put('/avatar/base64', protect, async (req, res) => {
  try {
    const { avatar } = req.body

    if (!avatar) {
      return res.status(400).json({ message: '请提供头像数据' })
    }

    // 更新用户头像（Base64 数据直接存储）
    const user = await User.findById(req.user._id)
    user.avatar = avatar
    await user.save()

    res.json({ avatar })
  } catch (error) {
    console.error('上传头像错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// @route   GET /api/user/profile
// @desc    获取用户资料
// @access  Private
router.get('/profile', protect, async (req, res) => {
  res.json({
    _id: req.user._id,
    username: req.user.username,
    avatar: req.user.avatar,
    createdAt: req.user.createdAt
  })
})

// @route   PUT /api/user/username
// @desc    修改用户名
// @access  Private
router.put('/username', protect, async (req, res) => {
  try {
    const { username } = req.body

    if (!username || username.length < 3) {
      return res.status(400).json({ message: '用户名至少3个字符' })
    }

    // 检查用户名是否已被占用
    const existingUser = await User.findOne({ username })
    if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
      return res.status(400).json({ message: '用户名已被占用' })
    }

    const user = await User.findById(req.user._id)
    user.username = username
    await user.save()

    res.json({ username: user.username })
  } catch (error) {
    console.error('修改用户名错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

module.exports = router
