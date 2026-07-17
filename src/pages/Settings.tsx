import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiKeyStatus, saveApiKey } from '../lib/api'

export default function Settings() {
  const navigate = useNavigate()
  const [apiKey, setApiKey] = useState('')
  const [hasKey, setHasKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getApiKeyStatus()
      .then((res) => setHasKey(res.hasKey))
      .catch(() => {})
  }, [])

  const handleSaveKey = async () => {
    if (!apiKey.trim()) return
    setSaving(true)
    try {
      await saveApiKey(apiKey.trim())
      setHasKey(true)
      setSaved(true)
      setApiKey('')
      setTimeout(() => setSaved(false), 2000)
    } catch {
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleClearData = () => {
    if (confirm('确定清除所有本地数据？这将登出当前账号。')) {
      localStorage.clear()
      alert('本地数据已清除')
      navigate('/home')
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
        <h1 className="text-lg font-semibold text-wm-text">设置</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 no-scrollbar">
        {/* AI 配置 */}
        <section>
          <h2 className="text-sm font-semibold text-wm-text mb-3">AI 配置</h2>
          <div className="bg-wm-card rounded-wm-lg shadow-wm-md p-4 space-y-3">
            <div>
              <label className="text-xs text-wm-text-secondary mb-1.5 block">
                DashScope API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={hasKey ? '已配置（输入新 Key 可替换）' : '请输入 API Key'}
                className="w-full bg-wm-input rounded-wm-md px-3 py-2.5 text-sm text-wm-text outline-none placeholder:text-wm-text-tertiary"
              />
            </div>
            <div className="flex items-center justify-between">
              <span
                className={`text-xs ${
                  hasKey ? 'text-wm-chart-2' : 'text-wm-text-tertiary'
                }`}
              >
                {hasKey ? '● 已配置' : '○ 未配置'}
              </span>
              <button
                onClick={handleSaveKey}
                disabled={!apiKey.trim() || saving}
                className="px-4 py-2 bg-wm-accent text-white rounded-wm-md text-sm font-medium disabled:opacity-30 active:scale-[0.98] transition-transform"
              >
                {saving ? '保存中...' : saved ? '已保存' : '保存'}
              </button>
            </div>
            <p className="text-[10px] text-wm-text-tertiary leading-relaxed pt-1">
              API Key 用于驱动水镜的 AI 对话能力。可在阿里云 DashScope 平台免费获取。
            </p>
          </div>
        </section>

        {/* 关于 */}
        <section>
          <h2 className="text-sm font-semibold text-wm-text mb-3">关于</h2>
          <div className="bg-wm-card rounded-wm-lg shadow-wm-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-wm-border">
              <span className="text-sm text-wm-text">应用名称</span>
              <span className="text-sm text-wm-text-tertiary">水镜进化</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-wm-border">
              <span className="text-sm text-wm-text">版本号</span>
              <span className="text-sm text-wm-text-tertiary">v1.0.0</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm text-wm-text">运行环境</span>
              <span className="text-sm text-wm-text-tertiary">
                Electron Desktop
              </span>
            </div>
          </div>
        </section>

        {/* 数据 */}
        <section>
          <h2 className="text-sm font-semibold text-wm-text mb-3">数据</h2>
          <button
            onClick={handleClearData}
            className="w-full bg-wm-card rounded-wm-lg shadow-wm-md px-4 py-3.5 text-left flex items-center justify-between border border-wm-border"
          >
            <span className="text-sm text-wm-accent">清除本地数据</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E85D5D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <p className="text-[10px] text-wm-text-tertiary mt-2 leading-relaxed">
            清除本地缓存数据、登录 token 和页面状态。服务端数据不受影响。
          </p>
        </section>
      </div>
    </div>
  )
}
