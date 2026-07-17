import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { submitDaily } from '../lib/api'

interface Slider {
  key: 'energy' | 'chaos' | 'frustration'
  label: string
  desc: string
  leftLabel: string
  rightLabel: string
  color: string
}

const sliders: Slider[] = [
  {
    key: 'energy',
    label: '精力值',
    desc: '今天有多少电？',
    leftLabel: '耗尽',
    rightLabel: '满格',
    color: '#2A9D8F',
  },
  {
    key: 'chaos',
    label: '混乱度',
    desc: '脑子有多乱？',
    leftLabel: '清晰',
    rightLabel: '炸裂',
    color: '#E85D5D',
  },
  {
    key: 'frustration',
    label: '不爽度',
    desc: '心里有多堵？',
    leftLabel: '平静',
    rightLabel: '暴躁',
    color: '#264653',
  },
]

export default function Review() {
  const navigate = useNavigate()
  const [values, setValues] = useState({
    energy: 5,
    chaos: 5,
    frustration: 5,
  })
  const [content, setContent] = useState('')
  const [inFlow, setInFlow] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (key: keyof typeof values, val: number) => {
    setValues((prev) => ({ ...prev, [key]: val }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await submitDaily({
        energy: values.energy,
        chaos: values.chaos,
        frustration: values.frustration,
        in_flow: inFlow,
        content,
      })
      navigate('/feedback')
    } catch (e) {
      alert('提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-wm-bg wm-fade-in">
      {/* 顶部栏 */}
      <header className="px-5 pt-12 pb-3 flex items-center gap-3 border-b border-wm-border bg-wm-bg sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-wm-text">每日复盘</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 no-scrollbar">
        {/* 滑块组 */}
        <div className="space-y-5">
          {sliders.map((s) => (
            <div key={s.key} className="bg-wm-card rounded-wm-lg shadow-wm-md p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-wm-text">
                    {s.label}
                  </p>
                  <p className="text-xs text-wm-text-tertiary">{s.desc}</p>
                </div>
                <span
                  className="text-2xl font-bold"
                  style={{ color: s.color }}
                >
                  {values[s.key]}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={values[s.key]}
                onChange={(e) =>
                  handleChange(s.key, parseInt(e.target.value))
                }
                style={{
                  background: `linear-gradient(to right, ${s.color} ${values[s.key] * 10}%, #F8F7F4 ${values[s.key] * 10}%)`,
                }}
              />
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-wm-text-tertiary">
                  {s.leftLabel}
                </span>
                <span className="text-[10px] text-wm-text-tertiary">
                  {s.rightLabel}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 文本框 */}
        <div>
          <p className="text-sm font-semibold text-wm-text mb-2">
            今天发生了什么？
          </p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="把脑子里的东西倒出来..."
            className="w-full min-h-[120px] bg-wm-card rounded-wm-lg shadow-wm-md p-4 text-sm text-wm-text resize-none outline-none placeholder:text-wm-text-tertiary"
          />
        </div>

        {/* 流切换 */}
        <button
          onClick={() => setInFlow(!inFlow)}
          className={`w-full py-3 rounded-wm-lg font-medium text-sm transition-all ${
            inFlow
              ? 'bg-wm-accent text-white shadow-wm-fab'
              : 'bg-wm-card text-wm-text-secondary shadow-wm-md'
          }`}
        >
          {inFlow ? '✓ 今日处于心流状态' : '今日处于心流状态'}
        </button>
      </div>

      {/* 提交按钮 */}
      <div className="px-5 py-4 border-t border-wm-border bg-wm-card">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3.5 bg-wm-accent text-white rounded-wm-md font-medium shadow-wm-fab active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {submitting ? '提交中...' : '提交复盘'}
        </button>
      </div>
    </div>
  )
}
