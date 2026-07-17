// API 客户端 —— 所有请求发到 /api/v1/...（同源，Electron 内嵌 Express）

const API_BASE = '/api/v1'

function getToken(): string | null {
  return localStorage.getItem('wm_token')
}

function setToken(token: string) {
  localStorage.setItem('wm_token', token)
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${text || res.statusText}`)
  }
  return res.json() as Promise<T>
}

// ===== 类型定义 =====
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AssessmentChatResponse {
  reply: string
  isComplete: boolean
  turn: number
}

export interface TalentScore {
  name: string
  score: number
  description: string
  empathy_quote: string
}

export interface AbilityBreakdown {
  grit: number
  insight: number
  optimize: number
  empathy: number
}

export interface Profile {
  identity_title: string
  identity_subtitle: string
  top_talents: TalentScore[]
  ability_breakdown: AbilityBreakdown
  summary?: string
}

export interface GenerateProfileResponse {
  profile: Profile
}

export interface GetProfileResponse {
  profile: Profile | null
}

export interface DailySubmitData {
  energy: number
  chaos: number
  frustration: number
  in_flow: boolean
  content: string
}

export interface ActionItem {
  text: string
  category: string
  estimated_time: string
}

export interface DailyFeedback {
  pattern_type: string
  pattern_label?: string
  soothing_text: string
  actions: ActionItem[]
  quote: string
}

export interface EvolutionPoint {
  date: string
  grit: number
  insight: number
  optimize: number
}

export interface EvolutionCurveResponse {
  scores: EvolutionPoint[]
  ma7: { date: string; grit: number; insight: number; optimize: number }[]
  ma30: { date: string; grit: number; insight: number; optimize: number }[]
}

export interface ApiKeyStatusResponse {
  hasKey: boolean
}

// ===== API 函数 =====

export async function guestLogin(): Promise<{ token: string }> {
  const data = await request<{ token: string }>('/auth/guest', {
    method: 'POST',
  })
  if (data.token) {
    setToken(data.token)
  }
  return data
}

export async function assessmentChat(
  messages: ChatMessage[],
): Promise<AssessmentChatResponse> {
  return request<AssessmentChatResponse>('/assessment/chat', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  })
}

export async function generateProfile(
  messages: ChatMessage[],
): Promise<GenerateProfileResponse> {
  return request<GenerateProfileResponse>('/assessment/generate', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  })
}

export async function getProfile(): Promise<GetProfileResponse> {
  return request<GetProfileResponse>('/assessment/profile')
}

export async function submitDaily(
  data: DailySubmitData,
): Promise<{ entry_id: string; status: string; feedback: DailyFeedback }> {
  return request('/daily/submit', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getDailyFeedback(
  date: string,
): Promise<{ feedback: DailyFeedback | null }> {
  return request(`/daily/feedback?date=${encodeURIComponent(date)}`)
}

export async function getEvolutionCurve(
  days: number,
): Promise<EvolutionCurveResponse> {
  return request(`/curve?days=${days}`)
}

export async function getApiKeyStatus(): Promise<ApiKeyStatusResponse> {
  return request<ApiKeyStatusResponse>('/settings/api-key')
}

export async function saveApiKey(key: string): Promise<void> {
  await request('/settings/api-key', {
    method: 'POST',
    body: JSON.stringify({ key }),
  })
}

// ===== 启动时自动游客登录 =====
let loginPromise: Promise<void> | null = null

export function ensureGuestLogin(): Promise<void> {
  if (getToken()) return Promise.resolve()
  if (loginPromise) return loginPromise
  loginPromise = guestLogin()
    .then(() => undefined)
    .catch((e) => {
      loginPromise = null
      throw e
    })
  return loginPromise
}

// 应用启动时自动调用
ensureGuestLogin().catch(() => {
  /* 静默失败，后续请求会重试 */
})
