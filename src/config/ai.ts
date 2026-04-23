// 豆包AI配置
export const doubaoConfig = {
  // API Endpoint - 火山引擎ARK API
  get apiUrl() {
    const baseUrl = import.meta.env.VITE_ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3'
    return `${baseUrl}/chat/completions`
  },
  
  // 接入点ID (Endpoint ID)
  get endpointId() {
    return import.meta.env.VITE_ARK_ENDPOINT_ID || 'ep-20260423112600-5zq5h'
  },
  
  // 模型名称
  modelName: 'doubao-seed-1-6-flash-250828',
  
  // API Key
  get apiKey() {
    return import.meta.env.VITE_ARK_API_KEY || ''
  }
}

// AI Prompt 模板
export const AI_PROMPT = `你是温柔的情绪疗愈师，根据用户的日记内容，严格按照JSON格式返回分析结果。

要求：
1. score: 情绪分数 0-100（越高心情越好）
2. mood: 核心情绪标签，只能是以下之一：sad（难过）、anxious（焦虑）、calm（平静）、happy（开心）、angry（生气）
3. analyze: 简短温柔的情绪解读，50字以内，要温暖治愈
4. relaxText: 一句治愈解压语录，20字以内，温暖有力量

请严格按照以下JSON格式返回，不要包含任何其他内容：
{"score": 分数, "mood": "情绪标签", "analyze": "解读文案", "relaxText": "治愈语录"}

用户日记内容：`
