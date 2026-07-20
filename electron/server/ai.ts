/**
 * AI 服务 - 多模型统一封装
 * 支持：阿里通义千问 / Kimi(月之暗面) / DeepSeek / 智谱GLM
 * 所有 provider 统一使用 OpenAI 兼容格式
 */

// ===== Provider 配置 =====

export interface ProviderConfig {
  id: string
  name: string
  baseUrl: string
  defaultModel: string
  models: string[]
  getKeyUrl: string
  description: string
}

export const PROVIDERS: Record<string, ProviderConfig> = {
  dashscope: {
    id: 'dashscope',
    name: '阿里通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-turbo',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
    getKeyUrl: 'https://dashscope.console.aliyun.com/apiKey',
    description: '阿里云通义千问，免费额度较多',
  },
  kimi: {
    id: 'kimi',
    name: 'Kimi (月之暗面)',
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    getKeyUrl: 'https://platform.moonshot.cn/console/api-keys',
    description: '长上下文能力强，适合长对话',
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    getKeyUrl: 'https://platform.deepseek.com/api_keys',
    description: '推理能力强，性价比高',
  },
  glm: {
    id: 'glm',
    name: '智谱 GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4-flash',
    models: ['glm-4-flash', 'glm-4', 'glm-4-plus'],
    getKeyUrl: 'https://open.bigmodel.cn/manage/apikey',
    description: '清华系大模型，glm-4-flash 免费',
  },
}

export function getProviderList() {
  return Object.values(PROVIDERS).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    defaultModel: p.defaultModel,
    models: p.models,
    getKeyUrl: p.getKeyUrl,
  }))
}

// ===== 配置文件管理 =====

import { app } from 'electron'
import path from 'path'
import fs from 'fs'

interface AppConfig {
  provider: string
  apiKey: string
  model: string
}

function getConfigPath(): string {
  return path.join(app.getPath('userData'), 'config.json')
}

function readConfig(): AppConfig {
  try {
    const configPath = getConfigPath()
    if (fs.existsSync(configPath)) {
      const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      // 兼容旧版配置（dashscopeApiKey）
      if (raw.dashscopeApiKey && !raw.apiKey) {
        return { provider: 'dashscope', apiKey: raw.dashscopeApiKey, model: 'qwen-turbo' }
      }
      return {
        provider: raw.provider || 'dashscope',
        apiKey: raw.apiKey || '',
        model: raw.model || PROVIDERS[raw.provider || 'dashscope']?.defaultModel || 'qwen-turbo',
      }
    }
  } catch {}
  return { provider: 'dashscope', apiKey: '', model: 'qwen-turbo' }
}

function writeConfig(config: AppConfig): void {
  const configPath = getConfigPath()
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
}

export function getApiKey(): string {
  return readConfig().apiKey
}

export function saveApiKey(key: string): void {
  const config = readConfig()
  config.apiKey = key
  writeConfig(config)
}

export function getProvider(): string {
  return readConfig().provider
}

export function setProvider(providerId: string): void {
  const config = readConfig()
  config.provider = providerId
  config.model = PROVIDERS[providerId]?.defaultModel || 'qwen-turbo'
  writeConfig(config)
}

export function getModel(): string {
  return readConfig().model
}

export function setModel(model: string): void {
  const config = readConfig()
  config.model = model
  writeConfig(config)
}

export function getConfigStatus(): { provider: string; hasKey: boolean; model: string } {
  const config = readConfig()
  return {
    provider: config.provider,
    hasKey: !!config.apiKey,
    model: config.model,
  }
}

// ===== 统一 OpenAI 兼容格式调用 =====

async function chatCompletion(
  model: string,
  messages: Array<{ role: string; content: string }>,
  temperature: number = 0.7,
): Promise<any> {
  const config = readConfig()
  if (!config.apiKey) {
    throw new Error('No API key')
  }

  const provider = PROVIDERS[config.provider] || PROVIDERS.dashscope
  const useModel = model || config.model || provider.defaultModel

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    'Content-Type': 'application/json',
  }
  const payload = {
    model: useModel,
    messages,
    temperature,
  }

  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`${provider.name} API error: ${response.status} ${errText}`)
  }
  return response.json()
}

/** 从 OpenAI 兼容响应中提取文本 */
function extractText(result: any): string | null {
  if (!result) return null
  // OpenAI 兼容格式: choices[0].message.content
  if (result.choices?.[0]?.message?.content) {
    return result.choices[0].message.content
  }
  // 兼容旧格式
  if (result.output?.text) return result.output.text
  if (result.output?.choices?.[0]?.message?.content) {
    return result.output.choices[0].message.content
  }
  return null
}

// ===== 测评 Agent =====

const CHAT_SYSTEM_PROMPT = `你是一位结合盖洛普优势理论、荣格心理学和心流理论的生涯咨询师，名叫"水镜"。
你正在和用户进行一场 3-5 轮的深度对话，目的是发掘用户的底层天赋。

对话规则：
1. 每次只问一个问题，问题要具体、有场景感，不要泛泛而谈
2. 像朋友聊天一样，语气温暖但犀利，不说空话
3. 根据用户的回答追问细节——感受、反应、行为模式
4. 不要说"你是什么类型的人"，而是通过对话让用户自己发现
5. 回复控制在 100 字以内，简洁有力
6. 第 1 轮：从用户最近的一个困扰或开心的事切入
7. 第 2-3 轮：深挖行为模式和价值观
8. 第 4-5 轮：确认核心天赋线索

当对话进行到第 5 轮（用户第 5 次回复）时，你在回复末尾加上标记 [ASSESSMENT_COMPLETE]，表示可以生成天赋画像了。

示例对话：
用户：最近工作压力大，总觉得做的不够好
水镜：你说"不够好"——是跟谁比？是跟同事比，还是跟自己心里那个标准比？
用户：主要是跟自己心里的标准比，我总觉得可以做得更好
水镜：这个"可以做得更好"的感觉，是从什么时候开始的？能想起一个具体场景吗？`

const PROFILE_SYSTEM_PROMPT = `你是一位结合盖洛普优势理论、荣格心理学和心流理论的生涯咨询师。
你的任务是根据对话记录，生成一份精准、温暖、有灵魂的天赋画像。

输出格式（纯JSON，不要markdown代码块）：
{
  "identity_title": "身份标题（2-4字，具象命名）",
  "identity_subtitle": "副标题（一句话描述）",
  "top_talents": [
    {
      "name": "天赋名称（具象命名）",
      "score": 85,
      "description": "200字内描述，温暖但犀利",
      "empathy_quote": "一句击中灵魂的共情金句"
    },
    {
      "name": "天赋名称",
      "score": 78,
      "description": "描述",
      "empathy_quote": "共情金句"
    },
    {
      "name": "天赋名称",
      "score": 72,
      "description": "描述",
      "empathy_quote": "共情金句"
    }
  ],
  "ability_breakdown": {
    "grit": 85,
    "insight": 78,
    "optimize": 72,
    "empathy": 69
  }
}

原则：
1. 反宿命论 - 不是"你是XX型"，而是"你正在进化成XX"
2. 阴影即宝藏 - 把缺点翻译为天赋
3. 原话证据 - 每个结论必须引用用户对话中的原话
4. 温暖而犀利 - 不说空话，用具体场景"钉住"用户的感受`

const FEEDBACK_SYSTEM_PROMPT = `你是一面"水镜"——绝对懂用户、不评判的AI镜子。
根据用户的复盘内容，生成次日清晨的双轨反馈。

输出格式（纯JSON，不要markdown代码块）：
{
  "soothing_text": "精神稳压：翻译用户的情绪，重构认知（200字内）",
  "actions": [
    {"text": "具体可执行的动作", "category": "认知重构", "estimated_time": "30秒"},
    {"text": "具体可执行的动作", "category": "自我觉察", "estimated_time": "5分钟"},
    {"text": "具体可执行的动作", "category": "接纳练习", "estimated_time": "全天"}
  ],
  "quote": "一句击中灵魂的金句"
}

原则：
1. 先翻译情绪 - "你不是在焦虑，你是在..."
2. 共情金句 - 一句让人"被接住"的话
3. 弹药具体 - 每个 Action 必须 100 字内、明天就能做
4. 不评判 - 绝对不说"你应该"`

// ===== Mock 数据 =====

function mockChatReply(turn: number): string {
  const replies = [
    '你好，我是水镜。最近有什么事让你睡不着觉吗？不一定是坏事——也可能是一件让你兴奋但说不清楚为什么的事。',
    "你说的这件事，如果用身体的一个部位来感受，会是哪里？是胸口发紧，还是脑袋发胀，还是别的什么？",
    '这种感受你以前经历过吗？上一次是什么时候？当时你是怎么应对的？',
    "如果把你刚才描述的状态看作一种'能力'而不是'问题'，你觉得它在帮你做什么？",
    '我听到了三个关键词：敏锐、标准、深度。最后一个问题：如果有人要写一本关于你的书，你希望书名叫什么？[ASSESSMENT_COMPLETE]',
  ]
  const idx = Math.min(turn - 1, replies.length - 1)
  return replies[idx]
}

function mockProfile(): any {
  return {
    identity_title: '结构苦行僧',
    identity_subtitle: '在混沌中建造秩序的人',
    top_talents: [
      {
        name: '高敏侦察雷达',
        score: 87,
        description: '你能感知到别人忽略的信号，这不是焦虑，是天赋。你的过度思考本质上是高分辨率的信息处理系统。',
        empathy_quote: "你说'我只是想太多了'——不，你想得比别人深，这是侦察兵的天赋。",
      },
      {
        name: '认知重构力',
        score: 82,
        description: '你习惯在困境中寻找意义和结构，这种能力让你能从废墟中重建秩序。',
        empathy_quote: "'为什么我不行'不是自我攻击，是你的系统在自动debug。",
      },
      {
        name: '经验景深',
        score: 78,
        description: '你的经验赋予你看问题的纵深感，AI 取代不了这种经过时间沉淀的直觉。',
        empathy_quote: '你的标准不是包袱，是你看问题的景深。',
      },
    ],
    ability_breakdown: {
      grit: 87,
      insight: 82,
      optimize: 78,
      empathy: 71,
    },
  }
}

const MOCK_FEEDBACK = {
  soothing_text:
    '你昨晚提到的"被时代落下"的焦虑，水镜读到了一个关键信号：\n\n你不是怕落后，你是怕自己的经验突然失效。\n\n这恰恰说明你对自己的专业有尊严感——而尊严感，是稀缺的天赋。',
  actions: [
    { text: '把"我不配"换成"我还没找到配得上的方式"', category: '认知重构', estimated_time: '30秒' },
    { text: '今天下午 15:00，写下一件"不该做但我做了"的事', category: '自我觉察', estimated_time: '5分钟' },
    { text: '允许高敏雷达暂时过载——不修复，只观察', category: '接纳练习', estimated_time: '全天' },
  ],
  quote: '你的标准不是包袱，是你看问题的景深。',
}

// ===== 导出的 AI 函数 =====

export async function assessmentChat(messages: Array<{ role: string; content: string }>): Promise<string> {
  const fullMessages = [{ role: 'system', content: CHAT_SYSTEM_PROMPT }, ...messages]
  try {
    const result = await chatCompletion('', fullMessages, 0.85)
    const text = extractText(result)
    if (text) return text
    return mockChatReply(messages.filter((m) => m.role === 'user').length)
  } catch {
    return mockChatReply(messages.filter((m) => m.role === 'user').length)
  }
}

export async function generateProfileFromChat(messages: Array<{ role: string; content: string }>): Promise<any> {
  const dialogText = messages
    .map((m) => `${m.role === 'user' ? '用户' : '水镜'}: ${m.content}`)
    .join('\n')
  const fullMessages = [
    { role: 'system', content: PROFILE_SYSTEM_PROMPT },
    { role: 'user', content: `以下是对话记录：\n${dialogText}\n\n请根据对话生成天赋画像JSON。` },
  ]
  try {
    const result = await chatCompletion('', fullMessages, 0.8)
    let text = extractText(result)
    if (!text) return mockProfile()

    // 清理 markdown 代码块
    text = text.trim()
    if (text.startsWith('```')) {
      text = text.split('\n').slice(1).join('\n')
    }
    if (text.endsWith('```')) {
      text = text.slice(0, -3)
    }
    text = text.trim()
    return JSON.parse(text)
  } catch {
    return mockProfile()
  }
}

export async function generateFeedback(entry: {
  energy: number
  chaos: number
  discomfort: number
  content: string
}, routineType: string): Promise<any> {
  const messages = [
    { role: 'system', content: FEEDBACK_SYSTEM_PROMPT },
    { role: 'user', content: `用户复盘：${JSON.stringify(entry)}\n套路类型：${routineType}` },
  ]
  try {
    const result = await chatCompletion('', messages, 0.7)
    let text = extractText(result)
    if (!text) return { ...MOCK_FEEDBACK, pattern_type: routineType }

    text = text.trim()
    if (text.startsWith('```')) {
      text = text.split('\n').slice(1).join('\n')
    }
    if (text.endsWith('```')) {
      text = text.slice(0, -3)
    }
    text = text.trim()
    const parsed = JSON.parse(text)
    return { ...parsed, pattern_type: routineType }
  } catch {
    return { ...MOCK_FEEDBACK, pattern_type: routineType }
  }
}
