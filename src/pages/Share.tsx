import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProfile, type Profile } from '../lib/api'

export default function Share() {
  const navigate = useNavigate()
  const cardRef = useRef<HTMLDivElement>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProfile()
      .then((res) => {
        if (res.profile) setProfile(res.profile)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSaveImage = () => {
    // 使用原生 Canvas 绘制天赋卡片并下载
    const W = 640
    const H = 960
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx || !profile) return

    // 背景
    ctx.fillStyle = '#FAF8F3'
    ctx.fillRect(0, 0, W, H)

    // 装饰圆
    ctx.fillStyle = 'rgba(232,93,93,0.06)'
    ctx.beginPath()
    ctx.arc(W - 40, 80, 120, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(60, H - 100, 100, 0, Math.PI * 2)
    ctx.fill()

    // Logo 圆
    ctx.fillStyle = '#E85D5D'
    ctx.beginPath()
    ctx.arc(W / 2, 160, 48, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 32px "Noto Serif SC", serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('镜', W / 2, 162)

    // 标签
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '14px Inter, sans-serif'
    ctx.fillText('我的天赋画像', W / 2, 240)

    // 身份标题
    ctx.fillStyle = '#1A1A2E'
    ctx.font = 'bold 26px "Noto Serif SC", serif'
    ctx.fillText(profile.identity_title, W / 2, 290)
    // 副标题
    ctx.fillStyle = '#6B7280'
    ctx.font = '13px Inter, sans-serif'
    ctx.fillText(profile.identity_subtitle, W / 2, 325)

    // Top3 天赋
    profile.top_talents.forEach((t, i) => {
      const y = 380 + i * 64
      // 卡片背景
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      const cardX = 60
      const cardW = W - 120
      const cardH = 52
      if ((ctx as any).roundRect) {
        ;(ctx as any).roundRect(cardX, y, cardW, cardH, 12)
      } else {
        ctx.rect(cardX, y, cardW, cardH)
      }
      ctx.fill()
      // 名称
      ctx.fillStyle = '#1A1A2E'
      ctx.font = '14px Inter, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(t.name, cardX + 20, y + 30)
      // 分数
      ctx.fillStyle = '#E85D5D'
      ctx.font = 'bold 18px Inter, sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(String(t.score), cardX + cardW - 20, y + 32)
    })

    // 底部
    ctx.textAlign = 'center'
    ctx.strokeStyle = 'rgba(26,26,46,0.06)'
    ctx.beginPath()
    ctx.moveTo(80, H - 80)
    ctx.lineTo(W - 80, H - 80)
    ctx.stroke()
    ctx.fillStyle = '#1A1A2E'
    ctx.font = '14px "Noto Serif SC", serif'
    ctx.fillText('水镜进化 · WaterMirror OS', W / 2, H - 50)

    // 下载
    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `水镜天赋-${Date.now()}.png`
    link.href = dataUrl
    link.click()
  }

  const handleShare = () => {
    // Electron 中可通过 clipboard 或原生分享
    if (navigator.clipboard && profile) {
      const text = `我是「${profile.identity_title}」\n${profile.identity_subtitle}\n\n— 水镜进化`
      navigator.clipboard.writeText(text).then(() => {
        alert('天赋卡片已复制到剪贴板')
      }).catch(() => {
        alert('分享失败')
      })
    } else {
      alert('分享功能不可用')
    }
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

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center">
        <p className="font-serif text-lg text-wm-text mb-2">
          还没有天赋画像
        </p>
        <p className="text-sm text-wm-text-tertiary mb-6">
          完成天赋测评后即可分享
        </p>
        <button
          onClick={() => navigate('/assessment')}
          className="px-6 py-3 bg-wm-accent text-white rounded-wm-md font-medium shadow-wm-fab"
        >
          去做天赋测评
        </button>
      </div>
    )
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
        <h1 className="text-lg font-semibold text-wm-text">分享天赋</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        {/* 卡片预览 */}
        <div
          ref={cardRef}
          className="w-full bg-gradient-to-br from-white to-wm-bg rounded-wm-xl shadow-wm-lg p-8 relative overflow-hidden"
          style={{ maxWidth: '320px' }}
        >
          {/* 装饰圆 */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-wm-accent-light" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-wm-accent-light" />

          {/* 内容 */}
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-wm-accent flex items-center justify-center mb-4">
              <span className="text-2xl font-serif text-white">镜</span>
            </div>
            <p className="text-xs text-wm-text-tertiary mb-1">我的天赋画像</p>
            <h2 className="font-serif text-xl text-wm-text leading-tight">
              {profile.identity_title}
            </h2>
            <p className="text-xs text-wm-text-secondary mt-1 mb-5">
              {profile.identity_subtitle}
            </p>

            {/* Top3 天赋 */}
            <div className="space-y-2 mb-5">
              {profile.top_talents.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-white rounded-wm-md px-3 py-2"
                >
                  <span className="text-xs font-medium text-wm-text">
                    {t.name}
                  </span>
                  <span className="text-sm font-bold text-wm-accent">
                    {t.score}
                  </span>
                </div>
              ))}
            </div>

            {/* Logo */}
            <div className="pt-4 border-t border-wm-border">
              <p className="font-serif text-sm text-wm-text">
                水镜进化 · WaterMirror OS
              </p>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="w-full max-w-[320px] mt-8 space-y-3">
          <button
            onClick={handleSaveImage}
            className="w-full py-3.5 bg-wm-accent text-white rounded-wm-md font-medium shadow-wm-fab active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            保存到相册
          </button>
          <button
            onClick={handleShare}
            className="w-full py-3.5 bg-wm-card text-wm-text rounded-wm-md font-medium shadow-wm-md border border-wm-border flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            分享
          </button>
        </div>
      </div>
    </div>
  )
}
