const jwt = require('jsonwebtoken')
const User = require('../models/User')

// 认证中间件
const protect = async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      
      req.user = await User.findById(decoded.id).select('-password')
      
      if (!req.user) {
        return res.status(401).json({ message: '用户不存在' })
      }
      
      next()
    } catch (error) {
      console.error('认证失败:', error.message)
      return res.status(401).json({ message: '未授权，请重新登录' })
    }
  } else {
    return res.status(401).json({ message: '没有提供认证令牌' })
  }
}

module.exports = { protect }
