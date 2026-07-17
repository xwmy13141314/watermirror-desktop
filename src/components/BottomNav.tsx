import { Link, useLocation } from 'react-router-dom'

// 底部导航图标（SVG）
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? '#E85D5D' : '#9CA3AF'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9.5z" />
    </svg>
  )
}

function BookIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? '#E85D5D' : '#9CA3AF'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function ReviewIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? '#E85D5D' : '#9CA3AF'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function MeIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? '#E85D5D' : '#9CA3AF'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a7 7 0 0 1 14 0v1" />
    </svg>
  )
}

// 心电图 FAB 图标
function PulseIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}

const tabs = [
  { path: '/home', label: '今日', icon: HomeIcon },
  { path: '/profile', label: '说明书', icon: BookIcon },
  { path: '/review', label: '复盘', icon: ReviewIcon },
  { path: '/me', label: '我的', icon: MeIcon },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-wm-border z-50">
      <div className="flex items-center justify-around h-16 px-2 relative">
        {/* 前2个 tab */}
        <div className="flex flex-1 justify-around">
          {tabs.slice(0, 2).map((tab) => {
            const active = location.pathname === tab.path
            const Icon = tab.icon
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 ${
                  active ? 'text-wm-accent' : 'text-wm-text-tertiary'
                }`}
              >
                <Icon active={active} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            )
          })}
        </div>

        {/* 中间 FAB 按钮 */}
        <Link
          to="/evolution"
          className="flex flex-col items-center justify-center -mt-8"
        >
          <div className="w-14 h-14 rounded-full bg-wm-accent shadow-wm-fab flex items-center justify-center">
            <PulseIcon />
          </div>
          <span className="text-[10px] font-medium text-wm-text-tertiary mt-0.5">
            进化
          </span>
        </Link>

        {/* 后2个 tab */}
        <div className="flex flex-1 justify-around">
          {tabs.slice(2).map((tab) => {
            const active = location.pathname === tab.path
            const Icon = tab.icon
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 ${
                  active ? 'text-wm-accent' : 'text-wm-text-tertiary'
                }`}
              >
                <Icon active={active} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
