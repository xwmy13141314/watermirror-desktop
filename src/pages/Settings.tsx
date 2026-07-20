import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getProviders,
  getConfigStatus,
  setProvider as setProviderApi,
  setModel as setModelApi,
  saveApiKey,
  type Provider,
  type ConfigStatus,
} from '../lib/api'

export default function Settings() {
  const navigate = useNavigate()
  const [providers, setProviders] = useState<Provider[]>([])
  const [config, setConfig] = useState<ConfigStatus | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  useEffect(() => {
    getProviders()
      .then((res) => setProviders(res.providers))
      .catch(() => {})
    getConfigStatus()
      .then((res) => setConfig(res))
      .catch(() => {})
  }, [])

  const currentProvider = providers.find((p) => p.id === config?.provider)

  const handleSelectProvider = async (providerId: string) => {
    try {
      const res = await setProviderApi(providerId)
      setConfig(res)
      setApiKey('') // 切换 provider 时清空输入框
      showMsg('已切换模型，请配置对应的 API Key')
    } catch {
      showMsg('切换失败')
    }
  }

  const handleSelectModel = async (model: string) => {
    try {
      const res = await setModelApi(model)
      setConfig(res)
    } catch {}
  }

  const handleSaveKey = async () => {
    if (!apiKey.trim()) return
    setSaving(true)
    try {
      await saveApiKey(apiKey.trim())
      const res = await getConfigStatus()
      setConfig(res)
      setApiKey('')
      showMsg('API Key 已保存')
    } catch {
      showMsg('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const showMsg = (msg: string) => {
    setSavedMsg(msg)
    setTimeout(() => setSavedMsg(''), 2500)
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
        {/* AI 模型配置 */}
        <section>
          <h2 className="text-sm font-semibold text-wm-text mb-3">AI 大模型配置</h2>

          {/* Provider 选择列表 */}
          <div className="space-y-2 mb-4">
            {providers.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectProvider(p.id)}
                className={`w-full bg-wm-card rounded-wm-lg shadow-wm-sm p-4 text-left transition-all ${
                  config?.provider === p.id
                    ? 'ring-2 ring-wm-accent'
                    : 'border border-wm-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-wm-text">{p.name}</span>
                      {config?.provider === p.id && (
                        <span className="w-4 h-4 rounded-full bg-wm-accent flex items-center justify-center">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-wm-text-secondary mt-1">{p.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* API Key 输入 */}
          {currentProvider && (
            <div className="bg-wm-card rounded-wm-lg shadow-wm-md p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-wm-text-secondary">
                  {currentProvider.name} API Key
                </label>
                <a
                  href={currentProvider.getKeyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-wm-accent underline"
                >
                  获取 Key →
                </a>
              </div>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={config?.hasKey ? '已配置（输入新 Key 可替换）' : '请输入 API Key'}
                className="w-full bg-wm-input rounded-wm-md px-3 py-2.5 text-sm text-wm-text outline-none placeholder:text-wm-text-tertiary"
              />
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs ${
                    config?.hasKey ? 'text-wm-chart-2' : 'text-wm-text-tertiary'
                  }`}
                >
                  {config?.hasKey ? '● 已配置' : '○ 未配置'}
                </span>
                <button
                  onClick={handleSaveKey}
                  disabled={!apiKey.trim() || saving}
                  className="px-4 py-2 bg-wm-accent text-white rounded-wm-md text-sm font-medium disabled:opacity-30 active:scale-[0.98] transition-transform"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>

              {/* Model 选择 */}
              {currentProvider.models.length > 1 && (
                <div className="pt-3 border-t border-wm-border">
                  <label className="text-xs font-medium text-wm-text-secondary mb-2 block">
                    模型
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {currentProvider.models.map((m) => (
                      <button
                        key={m}
                        onClick={() => handleSelectModel(m)}
                        className={`px-3 py-1.5 rounded-wm-sm text-xs font-medium transition-all ${
                          config?.model === m
                            ? 'bg-wm-accent text-white'
                            : 'bg-wm-input text-wm-text-secondary'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-wm-text-tertiary leading-relaxed pt-1">
                API Key 存储在本地配置文件中，不会上传到任何服务器。
              </p>
            </div>
          )}

          {/* 保存提示 */}
          {savedMsg && (
            <div className="mt-3 text-center text-sm text-wm-chart-2 wm-fade-in">
              {savedMsg}
            </div>
          )}
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
              <span className="text-sm text-wm-text-tertiary">v1.1.0</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm text-wm-text">当前模型</span>
              <span className="text-sm text-wm-text-tertiary">
                {currentProvider?.name} · {config?.model || '-'}
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
            清除本地缓存数据、登录 token 和页面状态。AI 配置和数据库不受影响。
          </p>
        </section>
      </div>
    </div>
  )
}
