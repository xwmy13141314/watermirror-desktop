import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { register, login } from '../lib/api'

export default function Auth() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('请输入邮箱和密码')
      return
    }
    if (mode === 'register' && password.length < 6) {
      setError('密码至少 6 位')
      return
    }

    setLoading(true)
    setError('')
    try {
      if (mode === 'register') {
        await register(email.trim(), password)
      } else {
        await login(email.trim(), password)
      }
      navigate('/home')
    } catch (err: any) {
      setError(err.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const handleGuest = () => {
    // 跳过登录，以游客模式使用
    localStorage.setItem('wm_token', 'guest')
    localStorage.setItem('wm_user_id', 'local_user')
    localStorage.setItem('wm_nickname', '水镜用户')
    navigate('/home')
  }

  return (
    <div className="min-h-screen flex flex-col bg-wm-bg">
      {/* 顶部 Logo 区 */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-20 h-20 rounded-wm-xl bg-wm-accent flex items-center justify-center shadow-wm-fab mb-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C8 6 6 9 6 13a6 6 0 0012 0c0-4-2-7-6-11z" />
            <circle cx="12" cy="13" r="2" fill="white" stroke="none" />
          </svg>
        </div>
        <h1 className="text-2xl font-serif font-bold text-wm-text mb-2">水镜进化</h1>
        <p className="text-sm text-wm-text-secondary text-center">
          AI 驱动的天赋发现与进化系统
        </p>
      </div>

      {/* 表单区 */}
      <div className="px-8 pb-10 space-y-4">
        {/* Tab 切换 */}
        <div className="flex bg-wm-input rounded-wm-md p-1">
          <button
            onClick={() => { setMode('login'); setError('') }}
            className={`flex-1 py-2 rounded-wm-sm text-sm font-medium transition-all ${
              mode === 'login' ? 'bg-wm-card text-wm-text shadow-wm-sm' : 'text-wm-text-tertiary'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => { setMode('register'); setError('') }}
            className={`flex-1 py-2 rounded-wm-sm text-sm font-medium transition-all ${
              mode === 'register' ? 'bg-wm-card text-wm-text shadow-wm-sm' : 'text-wm-text-tertiary'
            }`}
          >
            注册
          </button>
        </div>

        {/* 邮箱 */}
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱"
            className="w-full bg-wm-input rounded-wm-md px-4 py-3 text-sm text-wm-text outline-none placeholder:text-wm-text-tertiary"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {/* 密码 */}
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'register' ? '密码（至少 6 位）' : '密码'}
            className="w-full bg-wm-input rounded-wm-md px-4 py-3 text-sm text-wm-text outline-none placeholder:text-wm-text-tertiary"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {/* 错误提示 */}
        {error && (
          <p className="text-sm text-wm-accent text-center wm-fade-in">{error}</p>
        )}

        {/* 提交按钮 */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-wm-accent text-white rounded-wm-md py-3 text-sm font-semibold shadow-wm-fab disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
        </button>

        {/* 分隔线 */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-wm-border" />
          <span className="text-xs text-wm-text-tertiary">或</span>
          <div className="flex-1 h-px bg-wm-border" />
        </div>

        {/* 游客模式 */}
        <button
          onClick={handleGuest}
          className="w-full bg-wm-card text-wm-text-secondary rounded-wm-md py-3 text-sm font-medium border border-wm-border active:scale-[0.98] transition-transform"
        >
          游客模式体验
        </button>

        <p className="text-[10px] text-wm-text-tertiary text-center leading-relaxed pt-2">
          {mode === 'register'
            ? '注册后数据存储在本地，仅你本机可访问'
            : '账号数据存储在本地数据库，更换电脑需重新注册'}
        </p>
      </div>
    </div>
  )
}
