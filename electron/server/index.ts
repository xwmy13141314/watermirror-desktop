/**
 * Express 服务器 - 内嵌在 Electron 主进程中
 * 端口 8787，前端通过 fetch('/api/v1/...') 调用
 */
import express from 'express'
import cors from 'cors'
import path from 'path'
import http from 'http'
import { app as electronApp } from 'electron'

import {
  initDB,
  getLocalUser,
  createLocalUser,
  getProfile,
  saveProfile,
  submitEntry,
  getFeedback,
  saveFeedback,
  getScores,
  saveScore,
  type ProfileRow,
} from './db'
import {
  assessmentChat,
  generateProfileFromChat,
  generateFeedback,
  getApiKey,
  saveApiKey,
} from './ai'
import { calculateDailyScore, movingAverage } from './evolution'
import { getCurrentRoutine, getRoutineConfig } from './feedback'

const PORT = 8787

export function startServer(): Promise<http.Server> {
  // 初始化数据库
  initDB()
  // 确保本地用户存在
  createLocalUser()

  const app = express()
  app.use(cors())
  app.use(express.json())

  // ===== 静态文件服务（非开发模式） =====
  if (process.env.NODE_ENV !== 'development') {
    // 统一使用 app.getAppPath() 获取应用根目录，兼容开发和打包
    const appPath = electronApp ? electronApp.getAppPath() : process.cwd()
    const distPath = path.join(appPath, 'dist')
    app.use(express.static(distPath))

    // SPA 兜底：所有非 API 请求返回 index.html
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/') || req.path === '/health') {
        return next()
      }
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  // ===== 健康检查 =====
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'watermirror' })
  })

  // ===== 认证（简化：单用户本地） =====
  app.post('/api/v1/auth/guest', (_req, res) => {
    const user = getLocalUser() || createLocalUser()
    res.json({
      token: 'local',
      user: { id: user.id, nickname: user.nickname },
    })
  })

  // ===== 测评 =====

  // AI 对话式测评
  app.post('/api/v1/assessment/chat', async (req, res) => {
    try {
      const { messages } = req.body
      const reply = await assessmentChat(messages)
      const isComplete = reply.includes('[ASSESSMENT_COMPLETE]')
      const cleanReply = reply.replace('[ASSESSMENT_COMPLETE]', '').trim()
      const turn = messages.filter((m: any) => m.role === 'user').length

      res.json({ reply: cleanReply, isComplete, turn })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // 生成天赋画像
  app.post('/api/v1/assessment/generate', async (req, res) => {
    try {
      const { messages } = req.body
      const profileData = await generateProfileFromChat(messages)

      // 保存到数据库
      const user = getLocalUser()
      if (user) {
        saveProfile(user.id, {
          identity_title: profileData.identity_title || '',
          identity_subtitle: profileData.identity_subtitle || '',
          talents: profileData.top_talents || [],
          composition: profileData.ability_breakdown
            ? Object.entries(profileData.ability_breakdown).map(([name, score]) => ({ name, score }))
            : [],
        })
      }

      res.json({ profile: profileData })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // 获取当前用户的天赋画像
  app.get('/api/v1/assessment/profile', (_req, res) => {
    const user = getLocalUser()
    if (!user) {
      return res.json({ profile: null })
    }

    const row = getProfile(user.id)
    if (!row) {
      return res.json({ profile: null })
    }

    // 转换 DB 行为前端期望的格式
    const profile = transformProfileRow(row)
    res.json({ profile })
  })

  // ===== 每日复盘 =====

  // 提交每日复盘
  app.post('/api/v1/daily/submit', async (req, res) => {
    try {
      const { energy, chaos, frustration, in_flow, content } = req.body
      const user = getLocalUser()
      if (!user) {
        return res.status(401).json({ error: 'Not initialized' })
      }

      const today = new Date().toISOString().slice(0, 10)

      // 保存复盘条目
      const entryId = submitEntry(user.id, today, {
        energy,
        chaos,
        discomfort: frustration, // 前端用 frustration，后端用 discomfort
        content,
        is_flow: in_flow,
      })

      // 计算进化分数
      const [e_grit, e_insight, e_optimize] = calculateDailyScore(energy, chaos, frustration)
      saveScore(user.id, today, { e_grit, e_insight, e_optimize })

      // 生成反馈
      const routineType = getCurrentRoutine()
      const feedbackData = await generateFeedback(
        { energy, chaos, discomfort: frustration, content },
        routineType,
      )

      // 保存反馈
      saveFeedback(user.id, entryId, today, {
        routine_type: routineType,
        steady_pressure: feedbackData.soothing_text || '',
        action_items: feedbackData.actions || [],
      })

      res.json({
        entry_id: entryId,
        status: 'submitted',
        feedback: {
          pattern_type: routineType,
          pattern_label: getRoutineConfig(routineType).label,
          soothing_text: feedbackData.soothing_text || '',
          actions: feedbackData.actions || [],
          quote: feedbackData.quote || '',
        },
      })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // 获取某天的反馈
  app.get('/api/v1/daily/feedback', (req, res) => {
    const date = req.query.date as string
    const user = getLocalUser()
    if (!user) {
      return res.json({ feedback: null })
    }

    const row = getFeedback(user.id, date)
    if (!row) {
      return res.json({ feedback: null })
    }

    res.json({
      feedback: {
        pattern_type: row.routine_type,
        pattern_label: getRoutineConfig(row.routine_type).label,
        soothing_text: row.steady_pressure,
        actions: JSON.parse(row.action_items || '[]'),
        quote: '你的标准不是包袱，是你看问题的景深。',
      },
    })
  })

  // ===== 进化曲线 =====
  app.get('/api/v1/curve', (req, res) => {
    const days = parseInt(req.query.days as string) || 30
    const user = getLocalUser()

    if (!user) {
      return res.json({ scores: [], ma7: [], ma30: [] })
    }

    const rows = getScores(user.id, days)

    if (rows.length === 0) {
      // 无数据时返回 mock 数据（7天示例）
      const mockScores = generateMockScores()
      return res.json({
        scores: mockScores,
        ma7: mockScores, // 数据少于7天时 MA = 原始
        ma30: mockScores,
      })
    }

    const scores = rows.map((r) => ({
      date: r.date,
      grit: r.e_grit,
      insight: r.e_insight,
      optimize: r.e_optimize,
    }))

    // 计算移动平均
    const gritValues = scores.map((s) => s.grit)
    const insightValues = scores.map((s) => s.insight)
    const optimizeValues = scores.map((s) => s.optimize)

    const ma7Grit = movingAverage(gritValues, 7)
    const ma7Insight = movingAverage(insightValues, 7)
    const ma7Optimize = movingAverage(optimizeValues, 7)

    const ma7 = scores.map((s, i) => ({
      date: s.date,
      grit: ma7Grit[i],
      insight: ma7Insight[i],
      optimize: ma7Optimize[i],
    }))

    const ma30Grit = movingAverage(gritValues, 30)
    const ma30Insight = movingAverage(insightValues, 30)
    const ma30Optimize = movingAverage(optimizeValues, 30)

    const ma30 = scores.map((s, i) => ({
      date: s.date,
      grit: ma30Grit[i],
      insight: ma30Insight[i],
      optimize: ma30Optimize[i],
    }))

    res.json({ scores, ma7, ma30 })
  })

  // ===== 设置 =====
  app.get('/api/v1/settings/api-key', (_req, res) => {
    res.json({ hasKey: !!getApiKey() })
  })

  app.post('/api/v1/settings/api-key', (req, res) => {
    const { key } = req.body
    if (key) {
      saveApiKey(key)
    }
    res.json({ status: 'ok' })
  })

  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log(`WaterMirror server running on http://localhost:${PORT}`)
      resolve(server)
    })
  })
}

// ===== 辅助函数 =====

function transformProfileRow(row: ProfileRow): any {
  const talents = JSON.parse(row.talents || '[]')
  const composition = JSON.parse(row.composition || '{}')

  // composition 可能是数组 [{name, score}] 或对象 {grit, insight, ...}
  let abilityBreakdown: any
  if (Array.isArray(composition)) {
    abilityBreakdown = {
      grit: composition.find((c: any) => c.name === 'grit')?.score || 0,
      insight: composition.find((c: any) => c.name === 'insight')?.score || 0,
      optimize: composition.find((c: any) => c.name === 'optimize')?.score || 0,
      empathy: composition.find((c: any) => c.name === 'empathy')?.score || 0,
    }
  } else {
    abilityBreakdown = composition
  }

  return {
    identity_title: row.identity_title,
    identity_subtitle: row.identity_subtitle,
    top_talents: talents,
    ability_breakdown: abilityBreakdown,
  }
}

function generateMockScores() {
  const today = new Date()
  const scores = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const base = 60 + i * 2
    scores.push({
      date: dateStr,
      grit: base + Math.floor(Math.random() * 5),
      insight: base - 5 + Math.floor(Math.random() * 5),
      optimize: base - 10 + Math.floor(Math.random() * 5),
    })
  }
  return scores
}
