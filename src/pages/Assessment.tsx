import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  assessmentChat,
  generateProfile,
  type ChatMessage,
  type Profile,
} from '../lib/api'

type Phase = 'chat' | 'generating' | 'result'

const INITIAL_MESSAGE =
  '你好，我是水镜。在我这里，没有标准答案，只有真实的你。\n\n最近有什么事让你睡不着觉吗？'

export default function Assessment() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('chat')
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: INITIAL_MESSAGE },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: ChatMessage = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await assessmentChat(newMessages)
      const aiMsg: ChatMessage = { role: 'assistant', content: res.reply }
      setMessages((prev) => [...prev, aiMsg])

      if (res.isComplete) {
        // 1.5s 后自动进入 generating
        setTimeout(async () => {
          setPhase('generating')
          try {
            const genRes = await generateProfile(newMessages)
            setProfile(genRes.profile)
            setTimeout(() => setPhase('result'), 500)
          } catch (e) {
            // 生成失败，回到聊天
            setPhase('chat')
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant',
                content: '读取过程出现了波动，我们再聊几句。',
              },
            ])
          }
        }, 1500)
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '连接出现了波动，请再试一次。',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ===== Generating 阶段 =====
  if (phase === 'generating') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8">
        <div className="flex gap-2 mb-6">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-3 h-3 rounded-full bg-wm-accent wm-dot"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
        <p className="font-serif text-lg text-wm-text text-center">
          水镜正在读取你的底层天赋...
        </p>
        <p className="text-sm text-wm-text-tertiary mt-2 text-center">
          请稍候，这需要一点时间
        </p>
      </div>
    )
  }

  // ===== Result 阶段 =====
  if (phase === 'result' && profile) {
    return (
      <div className="min-h-screen pb-8 wm-fade-in">
        {/* 顶部 */}
        <div className="px-5 pt-12 pb-6 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-wm-accent-light flex items-center justify-center mb-4">
            <span className="text-3xl font-serif text-wm-accent">镜</span>
          </div>
          <p className="text-xs text-wm-text-tertiary mb-1">你的天赋画像</p>
          <h1 className="font-serif text-2xl text-wm-text">
            {profile.identity_title}
          </h1>
          <p className="text-sm text-wm-text-secondary mt-1">
            {profile.identity_subtitle}
          </p>
        </div>

        {/* Top3 天赋卡片 */}
        <div className="px-5 space-y-3">
          {profile.top_talents.map((talent, i) => (
            <div
              key={i}
              className="bg-wm-card rounded-wm-lg shadow-wm-md p-4"
              style={{ animationDelay: `${i * 0.15}s` }}
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

        {/* 按钮 */}
        <div className="px-5 mt-8">
          <button
            onClick={() => navigate('/home')}
            className="w-full py-3.5 bg-wm-accent text-white rounded-wm-md font-medium shadow-wm-fab active:scale-[0.98] transition-transform"
          >
            进入水镜进化
          </button>
        </div>
      </div>
    )
  }

  // ===== Chat 阶段 =====
  return (
    <div className="min-h-screen flex flex-col bg-wm-bg">
      {/* 顶部栏 */}
      <header className="px-5 pt-12 pb-3 flex items-center gap-3 border-b border-wm-border bg-wm-bg sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-wm-accent-light flex items-center justify-center">
            <span className="text-sm font-serif text-wm-accent">镜</span>
          </div>
          <div>
            <p className="text-sm font-medium text-wm-text">水镜</p>
            <p className="text-[10px] text-wm-text-tertiary">天赋测评中</p>
          </div>
        </div>
      </header>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-wm-accent-light flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                <span className="text-sm font-serif text-wm-accent">镜</span>
              </div>
            )}
            <div
              className={`max-w-[75%] px-4 py-2.5 rounded-wm-lg text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-wm-accent text-white rounded-tr-wm-sm'
                  : 'bg-wm-card text-wm-text shadow-wm-sm rounded-tl-wm-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-wm-accent-light flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
              <span className="text-sm font-serif text-wm-accent">镜</span>
            </div>
            <div className="bg-wm-card px-4 py-3 rounded-wm-lg shadow-wm-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-wm-text-tertiary wm-dot"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="px-4 py-3 border-t border-wm-border bg-wm-card">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="说出你此刻的真实感受..."
            rows={1}
            className="flex-1 bg-wm-input rounded-wm-md px-3 py-2.5 text-sm text-wm-text resize-none outline-none max-h-24 placeholder:text-wm-text-tertiary"
            style={{ minHeight: '42px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-full bg-wm-accent flex items-center justify-center disabled:opacity-30 flex-shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
