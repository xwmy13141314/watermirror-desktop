import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDailyFeedback, type DailyFeedback } from '../lib/api'

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const patternLabels: Record<string, { label: string; color: string }> = {
  D: { label: '驱动型', color: '#E85D5D' },
  P: { label: '偏执型', color: '#264653' },
  Q: { label: '求稳型', color: '#2A9D8F' },
  R: { label: '反复型', color: '#9CA3AF' },
}

export default function Feedback() {
  const navigate = useNavigate()
  const [feedback, setFeedback] = useState<DailyFeedback | null>(null)
  const [actions, setActions] = useState<
    { text: string; category: string; estimated_time: string; done: boolean }[]
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
      .finally(() => setLoading(false))
  }, [])

  const toggleAction = (idx: number) => {
    setActions((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, done: !a.done } : a)),
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-3 h-3 rounded-full bg-wm-accent wm-dot"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (!feedback) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center">
        <p className="font-serif text-lg text-wm-text mb-2">
          暂无今日反馈
        </p>
        <p className="text-sm text-wm-text-tertiary mb-6">
          先完成今日复盘，水镜会为你生成专属反馈
        </p>
        <button
          onClick={() => navigate('/review')}
          className="px-6 py-3 bg-wm-accent text-white rounded-wm-md font-medium shadow-wm-fab"
        >
          去复盘
        </button>
      </div>
    )
  }

  const pattern = patternLabels[feedback.pattern_type] || patternLabels.R

  return (
    <div className="min-h-screen flex flex-col bg-wm-bg wm-fade-in">
      {/* 顶部栏 */}
      <header className="px-5 pt-12 pb-3 flex items-center gap-3 border-b border-wm-border bg-wm-bg sticky top-0 z-10">
        <button onClick={() => navigate('/home')} className="p-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-wm-text">今日反馈</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 no-scrollbar">
        {/* 套路类型标签 */}
        <div className="flex items-center gap-2">
          <span
            className="px-3 py-1.5 rounded-wm-full text-xs font-medium text-white"
            style={{ background: pattern.color }}
          >
            {feedback.pattern_label || pattern.label}
          </span>
          <span className="text-xs text-wm-text-tertiary">
            你今天的心理套路
          </span>
        </div>

        {/* 精神稳压文本 */}
        <div className="bg-wm-card rounded-wm-lg shadow-wm-md p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-wm-accent" />
            <span className="text-xs font-medium text-wm-text-secondary">
              精神稳压
            </span>
          </div>
          <p className="font-serif text-base text-wm-text leading-relaxed whitespace-pre-wrap">
            {feedback.soothing_text}
          </p>
        </div>

        {/* 行动弹药 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-wm-text">
              今日弹药
            </h2>
            <span className="text-xs text-wm-text-tertiary">
              {actions.filter((a) => a.done).length}/{actions.length}
            </span>
          </div>
          <div className="space-y-3">
            {actions.map((a, i) => (
              <div
                key={i}
                className="bg-wm-card rounded-wm-lg shadow-wm-md p-4 flex items-start gap-3"
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
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-wm-accent-light text-wm-accent">
                      {a.category}
                    </span>
                    <span className="text-[10px] text-wm-text-tertiary">
                      预计 {a.estimated_time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部金句 */}
        <div className="bg-wm-accent-light rounded-wm-lg p-5 text-center">
          <p className="font-serif text-base text-wm-accent italic leading-relaxed">
            「{feedback.quote}」
          </p>
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="px-5 py-4 border-t border-wm-border bg-wm-card">
        <button
          onClick={() => navigate('/home')}
          className="w-full py-3.5 bg-wm-accent text-white rounded-wm-md font-medium shadow-wm-fab active:scale-[0.98] transition-transform"
        >
          回到今日
        </button>
      </div>
    </div>
  )
}
