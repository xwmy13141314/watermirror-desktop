import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { getProfile, getDailyFeedback, getEvolutionCurve, getConfigStatus, type Profile, type DailyFeedback } from '../lib/api'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 11) return '早安'
  if (h < 14) return '午安'
  if (h < 18) return '下午好'
  if (h < 22) return '晚上好'
  return '夜深了'
}

function formatDate(): string {
  const d = new Date()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function Home() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [feedback, setFeedback] = useState<DailyFeedback | null>(null)
  const [talentIndex, setTalentIndex] = useState<number>(0)
  const [change, setChange] = useState<number>(0)
  const [hasApiKey, setHasApiKey] = useState<boolean>(true)
  const [actions, setActions] = useState<
    { text: string; category: string; estimated_time: string; done: boolean }[]
  >([])

  useEffect(() => {
    // 检查 AI 配置状态
    getConfigStatus()
      .then((res) => setHasApiKey(res.hasKey))
      .catch(() => {})

    getProfile()
      .then((res) => {
        if (res.profile) setProfile(res.profile)
      })
      .catch(() => {})
    getDailyFeedback(todayStr())
      .then((res) => {
        if (res.feedback) {
          setFeedback(res.feedback)
          setActions(
            res.feedback.actions.map((a) => ({ ...a, done: false })),
          )
        }
      })
      .catch(() => {})
    // 获取进化曲线，计算天赋指数
    getEvolutionCurve(30)
      .then((res) => {
        if (res.scores && res.scores.length > 0) {
          const latest = res.scores[res.scores.length - 1]
          const index = (latest.grit + latest.insight + latest.optimize) / 3
          setTalentIndex(Math.round(index * 10) / 10)
          if (res.scores.length >= 2) {
            const prev = res.scores[res.scores.length - 2]
            const prevIndex = (prev.grit + prev.insight + prev.optimize) / 3
            setChange(Math.round((index - prevIndex) * 10) / 10)
          }
        }
      })
      .catch(() => {})
  }, [])

  const toggleAction = (idx: number) => {
    setActions((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, done: !a.done } : a)),
    )
  }

  return (
    <div className="min-h-screen pb-24 wm-fade-in">
      {/* 顶部日期 + 问候 */}
      <header className="px-5 pt-12 pb-4">
        <p className="text-xs text-wm-text-tertiary">{formatDate()}</p>
        <h1 className="text-2xl font-semibold text-wm-text mt-1">
          {getGreeting()}
        </h1>
      </header>

      <div className="px-5 space-y-4">
        {/* API Key 未配置提示 */}
        {!hasApiKey && (
          <button
            onClick={() => navigate('/settings')}
            className="w-full bg-wm-accent-light rounded-wm-md p-3 flex items-center gap-3 active:scale-[0.98] transition-transform"
          >
            <span className="w-8 h-8 rounded-full bg-wm-accent flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </span>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-wm-accent">未配置 AI 大模型</p>
              <p className="text-xs text-wm-text-secondary mt-0.5">点击配置 Kimi/通义/DeepSeek/GLM API Key</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E85D5D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        {/* 天赋指数卡片 */}
        <div className="bg-wm-card rounded-wm-lg shadow-wm-md p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-wm-text-secondary">天赋指数</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-bold text-wm-text">
                  {talentIndex > 0 ? talentIndex.toFixed(1) : '--'}
                </span>
                {talentIndex > 0 && (
                  <span
                    className={`text-sm font-medium ${
                      change >= 0 ? 'text-wm-chart-2' : 'text-wm-accent'
                    }`}
                  >
                    {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}
                  </span>
                )}
              </div>
              <p className="text-xs text-wm-text-tertiary mt-0.5">
                {talentIndex > 0 ? '较昨日' : '完成测评后生成'}
              </p>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-wm-accent-light flex items-center justify-center">
              <span className="text-lg font-serif text-wm-accent">镜</span>
            </div>
          </div>
        </div>

        {/* 精神稳压卡 */}
        <div className="bg-wm-card rounded-wm-lg shadow-wm-md p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-wm-accent" />
            <span className="text-xs font-medium text-wm-text-secondary">
              精神稳压
            </span>
          </div>
          <p className="font-serif text-base text-wm-text leading-relaxed">
            {feedback?.soothing_text ||
              '允许一切发生，是最高级的松弛。你不需要时刻紧绷，也不需要永远正确。'}
          </p>
        </div>

        {/* 今日弹药盒 */}
        <div className="bg-wm-card rounded-wm-lg shadow-wm-md p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-wm-text">今日弹药盒</h2>
            <span className="text-xs text-wm-text-tertiary">
              {actions.filter((a) => a.done).length}/{actions.length}
            </span>
          </div>
          {actions.length === 0 ? (
            <div className="space-y-2">
              {[
                { text: '写下今天最想推进的一件事', category: '执行', time: '10min' },
                { text: '花5分钟整理思绪，清空大脑', category: '复盘', time: '5min' },
                { text: '给一个重要的人发条消息', category: '关系', time: '3min' },
              ].map((a, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 py-2.5 border-b border-wm-border last:border-0"
                >
                  <button
                    onClick={() => toggleAction(i)}
                    className="mt-0.5 w-5 h-5 rounded border-2 border-wm-text-tertiary flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-wm-text">{a.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-wm-accent-light text-wm-accent">
                        {a.category}
                      </span>
                      <span className="text-[10px] text-wm-text-tertiary">
                        {a.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {actions.map((a, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 py-2.5 border-b border-wm-border last:border-0"
                >
                  <button
                    onClick={() => toggleAction(i)}
                    className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center ${
                      a.done
                        ? 'bg-wm-accent border-wm-accent'
                        : 'border-2 border-wm-text-tertiary'
                    }`}
                  >
                    {a.done && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1">
                    <p
                      className={`text-sm ${
                        a.done
                          ? 'text-wm-text-tertiary line-through'
                          : 'text-wm-text'
                      }`}
                    >
                      {a.text}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-wm-accent-light text-wm-accent">
                        {a.category}
                      </span>
                      <span className="text-[10px] text-wm-text-tertiary">
                        {a.estimated_time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 开始今日复盘 按钮 */}
        <button
          onClick={() => navigate('/review')}
          className="w-full py-3.5 bg-wm-accent text-white rounded-wm-md font-medium shadow-wm-fab active:scale-[0.98] transition-transform"
        >
          开始今日复盘
        </button>

        {/* 首次使用链接 */}
        <button
          onClick={() => navigate('/assessment')}
          className="w-full text-center text-sm text-wm-text-secondary py-2"
        >
          首次使用？先做天赋测评 <span className="text-wm-accent">→</span>
        </button>

        {/* 天赋身份简介（如果已有 profile） */}
        {profile && (
          <button
            onClick={() => navigate('/profile')}
            className="w-full bg-wm-card rounded-wm-lg shadow-wm-md p-4 text-left"
          >
            <p className="text-xs text-wm-text-tertiary mb-1">你的天赋身份</p>
            <p className="font-serif text-lg text-wm-text">
              {profile.identity_title}
            </p>
            <p className="text-xs text-wm-text-secondary mt-0.5">
              {profile.identity_subtitle}
            </p>
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
