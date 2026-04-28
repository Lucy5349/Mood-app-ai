# 情绪日记 App 测试报告与修改记录

> 测试日期：2026-04-27  
> 测试人员：CodeBuddy AI  
> 项目版本：main 分支 (commit: latest)

---

## 一、项目技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + Pinia + TypeScript + Tailwind CSS |
| 后端 | Express.js + MongoDB + Mongoose |
| AI 服务 | 火山方舟 (ARK) API - doubao 模型 |
| 部署 | Vercel (前端) + Railway (后端) |

---

## 二、测试方案

### 2.1 测试范围

| 模块 | 测试类型 | 说明 |
|------|----------|------|
| 用户认证 | API + UI | 注册、登录、Token 验证 |
| 日记 CRUD | API + UI | 创建、读取、更新、删除日记 |
| AI 情绪分析 | API + UI | 调用 ARK API 分析情绪并映射 |
| 首页展示 | UI | 今日心情、最近日记、日历、统计 |
| 历史记录 | UI | 日记列表、筛选、详情查看 |
| 待办 Todo | UI | 添加、完成、删除、清除 |

### 2.2 测试环境

- MongoDB: 本地 27017 端口
- 后端: 本地 3000 端口
- 前端: Vite Dev Server 5173 端口
- 测试工具: curl (API) + agent-browser (UI)

---

## 三、后端 API 测试结果

### 3.1 认证模块

| 编号 | 测试项 | 方法 | 路径 | 结果 |
|------|--------|------|------|------|
| AUTH-01 | 用户注册 | POST | /api/auth/register | ✅ 通过 |
| AUTH-02 | 重复注册拦截 | POST | /api/auth/register | ✅ 通过（返回 400） |
| AUTH-03 | 用户登录 | POST | /api/auth/login | ✅ 通过 |
| AUTH-04 | 错误密码拦截 | POST | /api/auth/login | ✅ 通过（返回 401） |
| AUTH-05 | Token 验证 | GET | /api/auth/me | ✅ 通过 |
| AUTH-06 | 无效 Token 拦截 | GET | /api/auth/me | ✅ 通过（返回 401） |
| AUTH-07 | 密码修改 | PUT | /api/auth/password | ✅ 通过 |

### 3.2 日记模块

| 编号 | 测试项 | 方法 | 路径 | 结果 |
|------|--------|------|------|------|
| API-01 | 创建日记 | POST | /api/diaries | ✅ 通过 |
| API-02 | 获取日记列表 | GET | /api/diaries | ✅ 通过 |
| API-03 | 获取单条日记 | GET | /api/diaries/:id | ✅ 通过 |
| API-04 | 更新日记 | PUT | /api/diaries/:id | ✅ 通过 |
| API-05 | 删除日记 | DELETE | /api/diaries/:id | ✅ 通过 |
| API-06 | 情绪统计 | GET | /api/diaries/stats | ✅ 通过 |
| API-07 | 按日期查询 | GET | /api/diaries?date=2026-04-27 | ✅ 通过 |

### 3.3 用户资料模块

| 编号 | 测试项 | 方法 | 路径 | 结果 |
|------|--------|------|------|------|
| USER-01 | 获取用户资料 | GET | /api/auth/me | ✅ 通过 |
| USER-02 | 更新用户名 | PUT | /api/auth/profile | ✅ 通过 |
| USER-03 | 上传头像 | POST | /api/auth/avatar | ✅ 通过 |

### 3.4 AI 情绪分析

| 编号 | 测试项 | 说明 | 结果 |
|------|--------|------|------|
| AI-01 | 正常情绪分析 | 输入日记内容，返回 score/mood/analyze/relaxText | ✅ 通过 |
| AI-02 | 返回格式验证 | 验证 JSON 结构完整性 | ✅ 通过 |
| AI-03 | 分数范围验证 | score 在 0-100 范围内 | ✅ 通过 |
| AI-04 | 多种情绪测试 | 分别测试 happy/sad/anxious/calm/angry 内容 | ✅ 通过 |

---

## 四、前端 UI 测试结果

### 4.1 页面渲染测试

| 页面 | 测试项 | 结果 |
|------|--------|------|
| 登录页 | 表单渲染、输入绑定 | ✅ 通过 |
| 注册页 | 表单渲染、提交跳转 | ✅ 通过 |
| 首页 | 欢迎卡片、今日心情、日历、统计、最近日记 | ✅ 通过 |
| 编辑器 | 日期选择、心情标签、文本输入、AI 分析 | ✅ 通过 |
| 历史页 | 日记列表、情绪筛选、日记详情 | ✅ 通过 |

### 4.2 AI 分析流程测试

| 步骤 | 操作 | 结果 |
|------|------|------|
| 1 | 输入日记内容（≥10字） | ✅ 输入正常 |
| 2 | 选择心情标签 | ✅ 选择正常 |
| 3 | 点击 AI 分析按钮 | ✅ 按钮启用条件正确 |
| 4 | 等待 AI 返回结果 | ✅ 返回 score/mood/analyze/relaxText |
| 5 | 保存日记 | ✅ 保存成功并跳转 |

---

## 五、发现的 Bug 及修复

### Bug-1: moodMapping 关键词映射不完整

**严重程度**: 高  
**影响范围**: 首页 emoji 显示、编辑器 AI 分析后的心情标签映射

**问题描述**:

AI 返回的中文情绪标签（如"愉悦满足"）无法在 `moodMapping` 中精确匹配，导致默认映射为 `calm`，使首页所有日记 emoji 都显示为 😌（平静）。

**根因分析**:

1. `moodMapping` 仅包含 19 个基础关键词，缺少"愉悦"、"满足"、"低落"等 AI 常见返回词
2. AI 模型返回复合情绪词（如"愉悦满足"），精确匹配无法命中
3. 默认回退到 `calm`，导致错误分类

**修复文件**: `src/types/diary.ts`

**修改前** (19 个关键词):
```typescript
export const moodMapping: Record<string, MoodTag> = {
  '难过': 'sad', '伤心': 'sad', '悲伤': 'sad', '沮丧': 'sad',
  '焦虑': 'anxious', '不安': 'anxious', '紧张': 'anxious', '担心': 'anxious',
  '平静': 'calm', '平和': 'calm', '宁静': 'calm',
  '开心': 'happy', '快乐': 'happy', '愉快': 'happy', '喜悦': 'happy',
  '生气': 'angry', '愤怒': 'angry', '愤怒压抑': 'angry', '暴躁': 'angry'
}
```

**修改后** (40+ 个关键词):
```typescript
export const moodMapping: Record<string, MoodTag> = {
  // sad (14个)
  '难过': 'sad', '伤心': 'sad', '悲伤': 'sad', '沮丧': 'sad',
  '低落': 'sad', '失落': 'sad', '忧郁': 'sad', '消沉': 'sad',
  '惆怅': 'sad', '孤独': 'sad', '寂寞': 'sad', '郁闷': 'sad',
  '委屈': 'sad', '心痛': 'sad',
  // anxious (10个)
  '焦虑': 'anxious', '不安': 'anxious', '紧张': 'anxious', '担心': 'anxious',
  '担忧': 'anxious', '忐忑': 'anxious', '烦躁': 'anxious', '焦躁': 'anxious',
  '惶恐': 'anxious', '心慌': 'anxious',
  // calm (8个)
  '平静': 'calm', '平和': 'calm', '宁静': 'calm', '淡然': 'calm',
  '安详': 'calm', '放松': 'calm', '释然': 'calm', '从容': 'calm',
  // happy (13个)
  '开心': 'happy', '快乐': 'happy', '愉快': 'happy', '喜悦': 'happy',
  '愉悦': 'happy', '满足': 'happy', '幸福': 'happy', '欣喜': 'happy',
  '欢乐': 'happy', '高兴': 'happy', '畅快': 'happy', '甜蜜': 'happy',
  '感恩': 'happy',
  // angry (10个)
  '生气': 'angry', '愤怒': 'angry', '愤怒压抑': 'angry', '暴躁': 'angry',
  '恼怒': 'angry', '愤慨': 'angry', '厌烦': 'angry', '烦躁不安': 'angry',
  '愤懑': 'angry', '怨恨': 'angry'
}
```

---

### Bug-2: EditorView AI mood 映射使用精确匹配

**严重程度**: 高  
**影响范围**: 编辑器页面的心情标签自动选择

**问题描述**:

`EditorView.vue` 中使用 `moodMapping[result.mood]` 进行精确匹配，当 AI 返回复合词（如"愉悦满足"）时匹配失败，导致心情标签不能自动切换到正确的选项。

**修复文件**: `src/views/EditorView.vue`

**修改前**:
```typescript
import { moodMapping, type MoodTag } from '@/types/diary'

// ... 在 handleAnalyze 中:
const moodEn = moodMapping[result.mood]
if (moodEn) {
  selectedMood.value = moodEn
} else {
  // 尝试通过同义词匹配
  const lowerMood = result.mood.toLowerCase()
  const matched = moodTags.find(t => 
    t.synonyms.some(syn => syn.toLowerCase() === lowerMood) || t.value.toLowerCase() === lowerMood
  )
  if (matched) selectedMood.value = matched.value
}
```

**修改后**:
```typescript
import { inferMoodLabel, type MoodTag } from '@/types/diary'

// ... 在 handleAnalyze 中:
// 将 AI 返回的中文 mood 转换为英文（使用包含匹配，支持复合词如"愉悦满足"）
selectedMood.value = inferMoodLabel(result.mood)
```

**改进点**:
- 使用 `inferMoodLabel()` 做包含匹配（`moodText.includes(key)`），复合词"愉悦满足"能正确匹配到"愉悦"→ `happy`
- 移除冗余的英文同义词匹配逻辑，代码更简洁

---

### Bug-3: HomeView getMoodTag 精确匹配导致 emoji 显示错误

**严重程度**: 高  
**影响范围**: 首页今日心情、最近日记列表的 emoji 和标签显示

**问题描述**:

`HomeView.vue` 中 `getMoodTag()` 使用 `moodMapping[mood]` 精确匹配，但 `diary.moodTag` 可能存储英文标签（如 "happy"）或中文（旧数据），导致部分日记 emoji 显示错误。

**修复文件**: `src/views/HomeView.vue`

**修改前**:
```typescript
import { moodConfig, moodMapping, type MoodTag } from '@/types/diary'

// 获取有效的 MoodTag（从字符串转换）
function getMoodTag(mood: string): MoodTag {
  return moodMapping[mood] || 'calm'
}
```

**修改后**:
```typescript
import { moodConfig, inferMoodLabel, type MoodTag } from '@/types/diary'

// 获取有效的 MoodTag（从字符串转换）
function getMoodTag(mood: string): MoodTag {
  // 如果已经是有效的英文标签，直接返回
  if (['sad', 'anxious', 'calm', 'happy', 'angry'].includes(mood)) {
    return mood as MoodTag
  }
  // 否则通过映射表进行包含匹配
  return inferMoodLabel(mood)
}
```

**改进点**:
- 先判断 `mood` 是否已经是合法的英文 `MoodTag`，是则直接返回
- 非英文标签则通过 `inferMoodLabel()` 做包含匹配
- 兼容英文标签和中文标签两种数据格式

---

## 六、测试数据

### 6.1 测试账号

| 用户名 | 密码 | 用途 |
|--------|------|------|
| testuser_a | 123456 | 主测试账号 |
| testuser_b | 123456 | 辅助测试账号 |

### 6.2 测试日记数据

| 日期 | moodTag | score | 内容摘要 |
|------|---------|-------|----------|
| 2026-04-27 | happy | 85 | 公园野餐，阳光很好 |
| 2026-04-27 | happy | 90 | 生日聚会，收到了惊喜 |
| 2026-04-25 | sad | 25 | 工作压力大，心情低落 |
| 2026-04-24 | anxious | 40 | 面试紧张，一直忐忑不安 |
| 2026-04-23 | calm | 65 | 雨天喝茶，感觉平静 |
| 2026-04-22 | angry | 30 | 同事甩锅，非常恼怒 |

---

## 七、修改文件清单

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `src/types/diary.ts` | 修改 | moodMapping 从 19 个关键词扩展到 45 个 |
| `src/views/EditorView.vue` | 修改 | AI mood 映射改用 `inferMoodLabel()` 包含匹配 |
| `src/views/HomeView.vue` | 修改 | `getMoodTag()` 增加英文标签兼容 + 包含匹配 |

---

## 八、遗留问题与后续建议

### 8.1 已修复

- [x] moodMapping 关键词不完整
- [x] EditorView AI mood 精确匹配失败
- [x] HomeView getMoodTag 不兼容英文标签

### 8.2 后续建议

1. **moodTag 存储规范化**: 当前 `moodTag` 字段可能存储中文或英文，建议统一存储英文 `MoodTag`，中文仅作为 AI 返回的原始值保留
2. **AI Prompt 优化**: 可在 SYSTEM_PROMPT 中限定 mood 输出为预定义的 5 个中文标签之一，减少映射失败概率
3. **前端自动化测试**: 引入 Vitest + @vue/test-utils 进行组件单元测试
4. **E2E 测试**: 引入 Playwright 或 Cypress 进行端到端自动化测试
5. **错误边界处理**: AI 分析超时或失败时，增加更友好的重试机制
