const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,  // 头像 URL 或 Base64
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// 密码加密前 Hook
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next()
  }
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  this.updatedAt = Date.now()
  next()
})

// 密码验证方法
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

// 转换为 JSON 时移除密码
userSchema.methods.toJSON = function() {
  const obj = this.toObject()
  delete obj.password
  return obj
}

module.exports = mongoose.model('User', userSchema)
