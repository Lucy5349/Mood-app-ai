const express = require('express')
const Diary = require('../models/Diary')
const { protect } = require('../middleware/auth')

const router = express.Router()

// @route   GET /api/diary
// @desc    获取用户所有日记
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const diaries = await Diary.find({ userId: req.user._id })
      .sort({ date: -1, createdAt: -1 })
    
    res.json(diaries)
  } catch (error) {
    console.error('获取日记错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// @route   GET /api/diary/today
// @desc    获取今日日记
// @access  Private
router.get('/today', protect, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const diary = await Diary.findOne({ 
      userId: req.user._id, 
      date: today 
    })
    
    res.json(diary)
  } catch (error) {
    console.error('获取今日日记错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// @route   GET /api/diary/:id
// @desc    获取单篇日记
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const diary = await Diary.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    })
    
    if (!diary) {
      return res.status(404).json({ message: '日记不存在' })
    }
    
    res.json(diary)
  } catch (error) {
    console.error('获取日记错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// @route   POST /api/diary
// @desc    创建日记
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { content, moodTag, score, aiAnalyze, date } = req.body

    // 验证必填字段
    if (!content || !moodTag || score === undefined || !date) {
      return res.status(400).json({ message: '请填写完整信息' })
    }

    // 验证 moodTag
    const validTags = ['sad', 'anxious', 'calm', 'happy', 'angry']
    if (!validTags.includes(moodTag)) {
      return res.status(400).json({ message: '无效的情绪标签' })
    }

    // 验证 score
    if (score < 0 || score > 100) {
      return res.status(400).json({ message: '情绪分数需要在 0-100 之间' })
    }

    const diary = await Diary.create({
      userId: req.user._id,
      content,
      moodTag,
      score,
      aiAnalyze,
      date
    })

    res.status(201).json(diary)
  } catch (error) {
    console.error('创建日记错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// @route   PUT /api/diary/:id
// @desc    更新日记
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { content, moodTag, score, aiAnalyze } = req.body

    const diary = await Diary.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    })

    if (!diary) {
      return res.status(404).json({ message: '日记不存在' })
    }

    // 更新字段
    if (content !== undefined) diary.content = content
    if (moodTag !== undefined) diary.moodTag = moodTag
    if (score !== undefined) diary.score = score
    if (aiAnalyze !== undefined) diary.aiAnalyze = aiAnalyze

    await diary.save()

    res.json(diary)
  } catch (error) {
    console.error('更新日记错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// @route   DELETE /api/diary/:id
// @desc    删除日记
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const diary = await Diary.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    })

    if (!diary) {
      return res.status(404).json({ message: '日记不存在' })
    }

    res.json({ message: '日记已删除' })
  } catch (error) {
    console.error('删除日记错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// @route   GET /api/diary/stats/summary
// @desc    获取日记统计摘要
// @access  Private
router.get('/stats/summary', protect, async (req, res) => {
  try {
    const diaries = await Diary.find({ userId: req.user._id })
    
    const total = diaries.length
    const avgScore = total > 0 
      ? Math.round(diaries.reduce((sum, d) => sum + d.score, 0) / total) 
      : 0

    // 情绪分布
    const moodDistribution = {
      sad: 0,
      anxious: 0,
      calm: 0,
      happy: 0,
      angry: 0
    }
    diaries.forEach(d => {
      moodDistribution[d.moodTag]++
    })

    res.json({
      total,
      avgScore,
      moodDistribution
    })
  } catch (error) {
    console.error('获取统计错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

module.exports = router
