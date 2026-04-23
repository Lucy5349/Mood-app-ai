import axios, { AxiosInstance, AxiosError } from "axios";

const ENV_VARS = {
  BASE_URL: import.meta.env.VITE_ARK_BASE_URL,
  API_KEY: import.meta.env.VITE_ARK_API_KEY,
  ENDPOINT_ID: import.meta.env.VITE_ARK_ENDPOINT_ID,
} as const;

Object.entries(ENV_VARS).forEach(([key, value]) => {
  if (!value) {
    const msg = `[doubao API] 缺少环境变量: VITE_ARK_${key}`;
    if (import.meta.env.DEV) alert(msg);
    console.error(msg);
  }
});

const USE_PROXY = import.meta.env.DEV;
const BASE_URL = USE_PROXY ? "/api/ark" : ENV_VARS.BASE_URL || "";
const API_KEY = ENV_VARS.API_KEY || "";
const ENDPOINT_ID = ENV_VARS.ENDPOINT_ID || "";

// 情绪日记 AI 返回类型（固定不变）
export interface EmotionAnalyzeResult {
  score: number;
  mood: string;
  analyze: string;
  relaxText: string;
}

// 创建 axios 实例
const doubaoRequest: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
});

// 请求拦截器：自动塞入你的接入点 ID
doubaoRequest.interceptors.request.use(
  (config) => {
    if (config.data) {
      const requestData =
        typeof config.data === "string" ? JSON.parse(config.data) : config.data;
      config.data = { ...requestData, model: ENDPOINT_ID };
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// 响应拦截器 + 异常兜底
doubaoRequest.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    let errMsg = "网络异常，请稍后重试";
    if (!error.response) {
      errMsg = "网络连接失败";
    } else {
      const status = error.response.status;
      switch (status) {
        case 401:
          errMsg = "API 密钥无效";
          break;
        case 403:
          errMsg = "无权限访问";
          break;
        case 429:
          errMsg = "请求过于频繁";
          break;
        case 500:
          errMsg = "服务器繁忙";
          break;
      }
    }
    console.error("API 调用失败：", errMsg);
    return Promise.reject(new Error(errMsg));
  },
);

const SYSTEM_PROMPT = `
你是温柔专业的情绪疗愈师。先在内心分析用户的心情，然后**只在最后输出纯JSON**，不要输出分析过程。
严格按照以下格式，不要任何多余文字：
{
  "score": 0-100的整数,
  "mood": "情绪标签",
  "analyze": "80字内温柔解读",
  "relaxText": "20字内治愈语录"
}
`;

interface ArkResponse {
  choices: Array<{
    message: {
      content: string;
      reasoning_content: string;
    };
  }>;
}

const validateResult = (data: unknown): EmotionAnalyzeResult => {
  const fallback: EmotionAnalyzeResult = {
    score: 50,
    mood: "平静",
    analyze: "感谢分享你的心情，记录本身就是疗愈的开始。",
    relaxText: "每一天都是新的开始",
  };

  if (typeof data !== "object" || !data) return fallback;

  const obj = data as Record<string, unknown>;
  const score = Math.max(
    0,
    Math.min(100, typeof obj.score === "number" ? Math.round(obj.score) : 50),
  );

  return {
    score,
    mood: typeof obj.mood === "string" ? obj.mood : fallback.mood,
    analyze:
      typeof obj.analyze === "string"
        ? obj.analyze.slice(0, 80)
        : fallback.analyze,
    relaxText:
      typeof obj.relaxText === "string"
        ? obj.relaxText.slice(0, 20)
        : fallback.relaxText,
  };
};

export const getEmotionAnalyze = async (
  content: string,
): Promise<EmotionAnalyzeResult> => {
  if (!content || content.trim().length < 5) {
    throw new Error("请输入至少5个字");
  }

  const params = {
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: content },
    ],
    temperature: 0.3,
    max_completion_tokens: 1024,
  };

  try {
    const res = (await doubaoRequest.post(
      "/chat/completions",
      params,
    )) as unknown as ArkResponse;

    const msg = res.choices?.[0]?.message;
    const aiText = msg?.content || msg?.reasoning_content;

    if (!aiText) throw new Error("AI 返回内容为空");

    let result;
    try {
      result = JSON.parse(aiText);
    } catch {
      const jsonMatch = aiText.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) throw new Error("AI 返回格式异常");
      result = JSON.parse(jsonMatch[0]);
    }

    return validateResult(result);
  } catch (err) {
    console.error("情绪分析失败:", err);
    throw err;
  }
};
