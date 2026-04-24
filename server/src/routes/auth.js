const express = require('express')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { protect } = require('../middleware/auth')

const router = express.Router()

// 生成 JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' })
}

// @route   POST /api/auth/register
// @desc    注册新用户
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' })
    }

    if (username.length < 3) {
      return res.status(400).json({ message: '用户名至少3个字符' })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: '密码至少6个字符' })
    }

    // 检查用户是否已存在
    const userExists = await User.findOne({ username })
    if (userExists) {
      return res.status(400).json({ message: '用户名已存在' })
    }

    // 创建用户
    const user = await User.create({
      username,
      password
    })

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
        token: generateToken(user._id)
      })
    }
  } catch (error) {
    console.error('注册错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// @route   POST /api/auth/login
// @desc    用户登录
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' })
    }

    // 查找用户
    const user = await User.findOne({ username })
    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' })
    }

    // 验证密码
    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: '用户名或密码错误' })
    }

    res.json({
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
      token: generateToken(user._id)
    })
  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// @route   GET /api/auth/me
// @desc    获取当前用户信息
// @access  Private
router.get('/me', protect, async (req, res) => {
  res.json({
    _id: req.user._id,
    username: req.user.username,
    avatar: req.user.avatar,
    createdAt: req.user.createdAt
  })
})

module.exports = router
