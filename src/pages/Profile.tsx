import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { getProfile, type Profile } from '../lib/api'

const abilityLabels: { key: keyof Profile['ability_breakdown']; label: string; color: string }[] = [
  { key: 'grit', label: '坚韧力', color: '#E85D5D' },
  { key: 'insight', label: '洞察力', color: '#2A9D8F' },
  { key: 'optimize', label: '优化力', color: '#264653' },
  { key: 'empathy', label: '共情力', color: '#9CA3AF' },
]

export default function ProfilePage() {
  const navigate = useNavigate()
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
      <div className="min-h-screen pb-24 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-20 h-20 rounded-full bg-wm-accent-light flex items-center justify-center mb-4">
          <span className="text-3xl font-serif text-wm-accent">镜</span>
        </div>
        <p className="font-serif text-lg text-wm-text mb-2">
          还没有天赋说明书
        </p>
        <p className="text-sm text-wm-text-tertiary mb-6">
          完成天赋测评后，水镜将为你生成专属说明书
        </p>
        <button
          onClick={() => navigate('/assessment')}
          className="px-6 py-3 bg-wm-accent text-white rounded-wm-md font-medium shadow-wm-fab"
        >
          去做天赋测评
        </button>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 wm-fade-in">
      {/* 顶部 */}
      <header className="px-5 pt-12 pb-6 text-center">
        <p className="text-xs text-wm-text-tertiary mb-2">天赋说明书</p>
        <h1 className="font-serif text-2xl text-wm-text">
          {profile.identity_title}
        </h1>
        <p className="text-sm text-wm-text-secondary mt-1">
          {profile.identity_subtitle}
        </p>
      </header>

      <div className="px-5 space-y-4">
        {/* Top3 天赋卡片 */}
        <div className="space-y-3">
          {profile.top_talents.map((talent, i) => (
            <div
              key={i}
              className="bg-wm-card rounded-wm-lg shadow-wm-md p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-wm-accent-light text-wm-accent text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <h3 className="font-semibold text-wm-text">
                    {talent.name}
                  </h3>
                </div>
                <span className="text-2xl font-bold text-wm-accent">
                  {talent.score}
                </span>
              </div>
              <p className="text-sm text-wm-text-secondary leading-relaxed">
                {talent.description}
              </p>
              <div className="mt-3 pt-3 border-t border-wm-border">
                <p className="font-serif text-sm text-wm-text italic">
                  「{talent.empathy_quote}」
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 能力构成图 */}
        <div className="bg-wm-card rounded-wm-lg shadow-wm-md p-5">
          <h2 className="text-sm font-semibold text-wm-text mb-4">
            能力构成
          </h2>
          <div className="space-y-4">
            {abilityLabels.map((item) => {
              const val = profile.ability_breakdown[item.key] || 0
              return (
                <div key={item.key}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs font-medium text-wm-text-secondary">
                      {item.label}
                    </span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: item.color }}
                    >
                      {val.toFixed(0)}
                    </span>
                  </div>
                  <div className="h-2 bg-wm-input rounded-wm-full overflow-hidden">
                    <div
                      className="h-full rounded-wm-full transition-all duration-500"
                      style={{
                        width: `${val}%`,
                        background: item.color,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 按钮 */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => navigate('/assessment')}
            className="py-3 bg-wm-card text-wm-text-secondary rounded-wm-md font-medium text-sm shadow-wm-md border border-wm-border"
          >
            重新测评
          </button>
          <button
            onClick={() => navigate('/share')}
            className="py-3 bg-wm-accent text-white rounded-wm-md font-medium text-sm shadow-wm-fab"
          >
            分享天赋
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
