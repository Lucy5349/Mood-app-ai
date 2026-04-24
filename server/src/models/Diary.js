const mongoose = require('mongoose')

const diarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  moodTag: {
    type: String,
    enum: ['sad', 'anxious', 'calm', 'happy', 'angry'],
    required: true
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  aiAnalyze: {
    type: String,
    default: null
  },
  date: {
    type: String,  // 格式: YYYY-MM-DD
    required: true
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

// 索引，提高查询效率
diarySchema.index({ userId: 1, date: -1 })

// 更新时间 Hook
diarySchema.pre('save', function(next) {
  this.updatedAt = Date.now()
  next()
})

module.exports = mongoose.model('Diary', diarySchema)
