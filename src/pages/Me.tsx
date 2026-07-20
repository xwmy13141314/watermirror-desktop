import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { getProfile, getNickname, logout, type Profile } from '../lib/api'

const menuItems = [
  {
    label: '天赋说明书',
    desc: '查看你的天赋画像',
    path: '/profile',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    label: '进化曲线',
    desc: '追踪你的天赋成长',
    path: '/evolution',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    label: '分享天赋',
    desc: '生成你的天赋卡片',
    path: '/share',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ),
  },
  {
    label: '设置',
    desc: 'AI 配置与数据管理',
    path: '/settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
]

export default function Me() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [nickname, setNickname] = useState(getNickname())

  useEffect(() => {
    setNickname(getNickname())
    getProfile()
      .then((res) => {
        if (res.profile) setProfile(res.profile)
      })
      .catch(() => {})
  }, [])

  const handleLogout = () => {
    if (confirm('确定退出登录？')) {
      logout()
      navigate('/auth')
    }
  }

  const isGuest = localStorage.getItem('wm_token') === 'guest'

  return (
    <div className="min-h-screen pb-24 wm-fade-in">
      {/* 顶部 */}
      <header className="px-5 pt-12 pb-6">
        <h1 className="text-xl font-semibold text-wm-text">我的</h1>
      </header>

      <div className="px-5 space-y-4">
        {/* 用户信息卡片 */}
        <div className="bg-wm-card rounded-wm-lg shadow-wm-md p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-wm-accent-light flex items-center justify-center">
            <span className="text-2xl font-serif text-wm-accent">
              {nickname.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-wm-text">{nickname}</p>
            <p className="text-xs text-wm-text-tertiary mt-0.5">
              {isGuest ? '游客模式' : '已注册用户'}
            </p>
          </div>
          {!isGuest && (
            <button
              onClick={handleLogout}
              className="text-xs text-wm-accent px-3 py-1.5 rounded-wm-sm border border-wm-border"
            >
              退出
            </button>
          )}
          {isGuest && (
            <button
              onClick={() => navigate('/auth')}
              className="text-xs text-wm-accent px-3 py-1.5 rounded-wm-sm border border-wm-border"
            >
              登录
            </button>
          )}
        </div>

        {/* 天赋身份卡 */}
        {profile ? (
          <button
            onClick={() => navigate('/profile')}
            className="w-full bg-wm-card rounded-wm-lg shadow-wm-md p-5 text-left"
          >
            <p className="text-xs text-wm-text-tertiary mb-1">天赋身份</p>
            <p className="font-serif text-lg text-wm-text">
              {profile.identity_title}
            </p>
            <p className="text-xs text-wm-text-secondary mt-0.5">
              {profile.identity_subtitle}
            </p>
            <div className="flex gap-2 mt-3">
              {profile.top_talents.map((t, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded bg-wm-accent-light text-wm-accent"
                >
                  {t.name}
                </span>
              ))}
            </div>
          </button>
        ) : (
          <button
            onClick={() => navigate('/assessment')}
            className="w-full bg-wm-card rounded-wm-lg shadow-wm-md p-5 text-left"
          >
            <p className="text-sm text-wm-text-secondary">
              还没有天赋画像，去测评 →
            </p>
          </button>
        )}

        {/* 菜单列表 */}
        <div className="bg-wm-card rounded-wm-lg shadow-wm-md overflow-hidden">
          {menuItems.map((item, i) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-wm-input transition-colors ${
                i !== menuItems.length - 1 ? 'border-b border-wm-border' : ''
              }`}
            >
              <div className="flex-shrink-0">{item.icon}</div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-wm-text">
                  {item.label}
                </p>
                <p className="text-xs text-wm-text-tertiary">{item.desc}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>

        {/* 版本号 */}
        <p className="text-center text-xs text-wm-text-tertiary pt-4">
          水镜进化 v1.1.0
        </p>
      </div>

      <BottomNav />
    </div>
  )
}
