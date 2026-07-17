import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEvolutionCurve, type EvolutionPoint } from '../lib/api'

const COLORS = {
  grit: '#E85D5D',
  insight: '#2A9D8F',
  optimize: '#264653',
}

const LABELS = {
  grit: 'E-Grit 坚韧',
  insight: 'E-Insight 洞察',
  optimize: 'E-Optimize 优化',
}

type RangeKey = 7 | 30 | 90

export default function Evolution() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [range, setRange] = useState<RangeKey>(30)
  const [scores, setScores] = useState<EvolutionPoint[]>([])
  const [ma7, setMa7] = useState<EvolutionPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getEvolutionCurve(range)
      .then((res) => {
        setScores(res.scores)
        setMa7(res.ma7)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [range])

  // 绘制 Canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || scores.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 高 DPI
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const W = rect.width
    const H = rect.height
    const padding = { top: 20, right: 16, bottom: 28, left: 32 }
    const chartW = W - padding.left - padding.right
    const chartH = H - padding.top - padding.bottom

    // 清空
    ctx.clearRect(0, 0, W, H)

    // Y 轴刻度 (0-100)
    ctx.strokeStyle = 'rgba(26,26,46,0.06)'
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '10px Inter, sans-serif'
    ctx.textAlign = 'right'
    for (let v = 0; v <= 100; v += 25) {
      const y = padding.top + chartH - (v / 100) * chartH
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(W - padding.right, y)
      ctx.stroke()
      ctx.fillText(String(v), padding.left - 6, y + 3)
    }

    // X 轴日期标签
    ctx.textAlign = 'center'
    const xStep = chartW / Math.max(scores.length - 1, 1)
    const labelInterval = Math.ceil(scores.length / 6)
    scores.forEach((p, i) => {
      if (i % labelInterval === 0 || i === scores.length - 1) {
        const x = padding.left + i * xStep
        const dateStr = p.date.slice(5) // MM-DD
        ctx.fillText(dateStr, x, H - 8)
      }
    })

    // 绘制曲线
    const drawLine = (
      data: { grit: number; insight: number; optimize: number }[],
      key: 'grit' | 'insight' | 'optimize',
      color: string,
      dashed = false,
    ) => {
      ctx.strokeStyle = color
      ctx.lineWidth = dashed ? 1.5 : 2
      ctx.setLineDash(dashed ? [4, 3] : [])
      ctx.beginPath()
      data.forEach((p, i) => {
        const x = padding.left + i * xStep
        const y = padding.top + chartH - (p[key] / 100) * chartH
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
      ctx.setLineDash([])

      // 填充区域（仅实线）
      if (!dashed) {
        ctx.lineTo(padding.left + (data.length - 1) * xStep, padding.top + chartH)
        ctx.lineTo(padding.left, padding.top + chartH)
        ctx.closePath()
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH)
        gradient.addColorStop(0, color + '15')
        gradient.addColorStop(1, color + '00')
        ctx.fillStyle = gradient
        ctx.fill()
      }
    }

    // 三条实线
    drawLine(scores, 'grit', COLORS.grit)
    drawLine(scores, 'insight', COLORS.insight)
    drawLine(scores, 'optimize', COLORS.optimize)

    // MA7 虚线
    if (ma7.length > 0) {
      drawLine(ma7, 'grit', COLORS.grit, true)
      drawLine(ma7, 'insight', COLORS.insight, true)
      drawLine(ma7, 'optimize', COLORS.optimize, true)
    }
  }, [scores, ma7])

  const ranges: RangeKey[] = [7, 30, 90]

  return (
    <div className="min-h-screen flex flex-col bg-wm-bg wm-fade-in">
      {/* 顶部栏 */}
      <header className="px-5 pt-12 pb-3 flex items-center gap-3 border-b border-wm-border bg-wm-bg sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-wm-text">进化曲线</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 no-scrollbar">
        {/* 时间范围切换 */}
        <div className="flex gap-2 bg-wm-input rounded-wm-md p-1">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`flex-1 py-2 rounded-wm-sm text-sm font-medium transition-all ${
                range === r
                  ? 'bg-wm-card text-wm-accent shadow-wm-sm'
                  : 'text-wm-text-tertiary'
              }`}
            >
              {r}天
            </button>
          ))}
        </div>

        {/* 图表 */}
        <div className="bg-wm-card rounded-wm-lg shadow-wm-md p-4">
          {loading ? (
            <div className="h-[260px] flex items-center justify-center">
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
          ) : scores.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center">
              <p className="text-sm text-wm-text-tertiary">
                暂无进化数据，坚持复盘即可看到
              </p>
            </div>
          ) : (
            <>
              <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '260px' }}
              />
              {/* 图例 */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 pt-3 border-t border-wm-border">
                {(['grit', 'insight', 'optimize'] as const).map((key) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-0.5 rounded-full"
                      style={{ background: COLORS[key] }}
                    />
                    <span className="text-[10px] text-wm-text-secondary">
                      {LABELS[key]}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-0.5 border-t border-dashed border-wm-text-tertiary"
                    style={{ borderColor: '#9CA3AF' }}
                  />
                  <span className="text-[10px] text-wm-text-tertiary">
                    MA7 均线
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 维度说明 */}
        <div className="bg-wm-card rounded-wm-lg shadow-wm-md p-4 space-y-3">
          {(['grit', 'insight', 'optimize'] as const).map((key) => (
            <div key={key} className="flex items-center gap-3">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: COLORS[key] }}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-wm-text">
                  {LABELS[key]}
                </p>
              </div>
              <span className="text-sm font-bold text-wm-text">
                {scores.length > 0
                  ? scores[scores.length - 1][key].toFixed(0)
                  : '--'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
