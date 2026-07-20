/**
 * SQLite 数据库 - better-sqlite3
 * 数据库文件存储在 userData 目录
 */
import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

let db: Database.Database

export interface LocalUser {
  id: string
  email: string | null
  nickname: string
  created_at: string
}

export interface ProfileRow {
  id: string
  user_id: string
  identity_title: string
  identity_subtitle: string
  talents: string // JSON
  composition: string // JSON
}

export interface DailyEntryRow {
  id: string
  user_id: string
  date: string
  energy: number
  chaos: number
  discomfort: number
  content: string
  is_flow: number
  created_at: string
}

export interface FeedbackRow {
  id: string
  user_id: string
  entry_id: string
  date: string
  routine_type: string
  steady_pressure: string
  action_items: string // JSON
}

export interface EvolutionScoreRow {
  id: string
  user_id: string
  date: string
  e_grit: number
  e_insight: number
  e_optimize: number
}

export function initDB(): void {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'watermirror.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  // 创建表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password_hash TEXT,
      nickname TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE,
      identity_title TEXT,
      identity_subtitle TEXT,
      talents TEXT,
      composition TEXT
    );

    CREATE TABLE IF NOT EXISTS daily_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      date TEXT,
      energy REAL,
      chaos REAL,
      discomfort REAL,
      content TEXT,
      is_flow INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS feedbacks (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      entry_id TEXT UNIQUE,
      date TEXT,
      routine_type TEXT,
      steady_pressure TEXT,
      action_items TEXT
    );

    CREATE TABLE IF NOT EXISTS evolution_scores (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      date TEXT,
      e_grit REAL,
      e_insight REAL,
      e_optimize REAL
    );

    CREATE INDEX IF NOT EXISTS idx_daily_user_date ON daily_entries(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_scores_user_date ON evolution_scores(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_feedbacks_user_date ON feedbacks(user_id, date);
  `)

  // 兼容旧数据库：如果 users 表缺少 email/password_hash 列则添加
  try {
    db.prepare('SELECT email FROM users LIMIT 0').get()
  } catch {
    db.exec('ALTER TABLE users ADD COLUMN email TEXT;')
    db.exec('ALTER TABLE users ADD COLUMN password_hash TEXT;')
  }
}

// ===== 用户操作 =====

export function getLocalUser(): LocalUser | null {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get('local_user') as LocalUser | undefined
  return row || null
}

export function createLocalUser(): LocalUser {
  const existing = getLocalUser()
  if (existing) return existing

  const user: LocalUser = {
    id: 'local_user',
    email: null,
    nickname: '水镜用户',
    created_at: new Date().toISOString(),
  }
  db.prepare('INSERT INTO users (id, nickname, created_at) VALUES (?, ?, ?)').run(
    user.id,
    user.nickname,
    user.created_at,
  )
  return user
}

// ===== 天赋画像 =====

export function getProfile(userId: string): ProfileRow | null {
  const row = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId) as ProfileRow | undefined
  return row || null
}

export function saveProfile(userId: string, data: {
  identity_title: string
  identity_subtitle: string
  talents: any[]
  composition: any[]
}): void {
  const existing = getProfile(userId)
  const id = existing?.id || `p_${Date.now()}`
  const talentsJson = JSON.stringify(data.talents)
  const compositionJson = JSON.stringify(data.composition)

  if (existing) {
    db.prepare(`
      UPDATE profiles SET identity_title = ?, identity_subtitle = ?, talents = ?, composition = ?
      WHERE user_id = ?
    `).run(data.identity_title, data.identity_subtitle, talentsJson, compositionJson, userId)
  } else {
    db.prepare(`
      INSERT INTO profiles (id, user_id, identity_title, identity_subtitle, talents, composition)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, data.identity_title, data.identity_subtitle, talentsJson, compositionJson)
  }
}

// ===== 每日复盘 =====

export function getTodayEntry(userId: string, date: string): DailyEntryRow | null {
  const row = db.prepare('SELECT * FROM daily_entries WHERE user_id = ? AND date = ?').get(userId, date) as DailyEntryRow | undefined
  return row || null
}

export function submitEntry(userId: string, date: string, data: {
  energy: number
  chaos: number
  discomfort: number
  content: string
  is_flow: boolean
}): string {
  const id = `e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  db.prepare(`
    INSERT INTO daily_entries (id, user_id, date, energy, chaos, discomfort, content, is_flow)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, date, data.energy, data.chaos, data.discomfort, data.content, data.is_flow ? 1 : 0)
  return id
}

// ===== 反馈 =====

export function getFeedback(userId: string, date: string): FeedbackRow | null {
  const row = db.prepare('SELECT * FROM feedbacks WHERE user_id = ? AND date = ?').get(userId, date) as FeedbackRow | undefined
  return row || null
}

export function saveFeedback(userId: string, entryId: string, date: string, data: {
  routine_type: string
  steady_pressure: string
  action_items: any[]
}): void {
  const id = `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  db.prepare(`
    INSERT INTO feedbacks (id, user_id, entry_id, date, routine_type, steady_pressure, action_items)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, entryId, date, data.routine_type, data.steady_pressure, JSON.stringify(data.action_items))
}

// ===== 进化分数 =====

export function getScores(userId: string, days: number): EvolutionScoreRow[] {
  return db.prepare(`
    SELECT * FROM evolution_scores
    WHERE user_id = ?
    ORDER BY date ASC
    LIMIT ?
  `).all(userId, days) as EvolutionScoreRow[]
}

export function saveScore(userId: string, date: string, scores: {
  e_grit: number
  e_insight: number
  e_optimize: number
}): void {
  const id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  db.prepare(`
    INSERT INTO evolution_scores (id, user_id, date, e_grit, e_insight, e_optimize)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, userId, date, scores.e_grit, scores.e_insight, scores.e_optimize)
}

// ===== 注册 / 登录 =====

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex')
  return hash === verifyHash
}

export function registerUser(email: string, password: string): { user: LocalUser; token: string } {
  // 检查邮箱是否已注册
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    throw new Error('该邮箱已注册')
  }

  const id = `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  const nickname = email.split('@')[0]
  const passwordHash = hashPassword(password)
  const token = crypto.randomBytes(32).toString('hex')

  db.prepare(`
    INSERT INTO users (id, email, password_hash, nickname, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, email, passwordHash, nickname, new Date().toISOString())

  return {
    user: { id, email, nickname, created_at: new Date().toISOString() },
    token,
  }
}

export function loginUser(email: string, password: string): { user: LocalUser; token: string } {
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as (LocalUser & { password_hash: string }) | undefined
  if (!row) {
    throw new Error('邮箱未注册')
  }
  if (!row.password_hash) {
    throw new Error('该账号未设置密码，请使用注册功能')
  }
  if (!verifyPassword(password, row.password_hash)) {
    throw new Error('密码错误')
  }

  const token = crypto.randomBytes(32).toString('hex')
  return {
    user: { id: row.id, email: row.email, nickname: row.nickname, created_at: row.created_at },
    token,
  }
}

export function getUserById(userId: string): LocalUser | null {
  const row = db.prepare('SELECT id, email, nickname, created_at FROM users WHERE id = ?').get(userId) as LocalUser | undefined
  return row || null
}

export function updateNickname(userId: string, nickname: string): void {
  db.prepare('UPDATE users SET nickname = ? WHERE id = ?').run(nickname, userId)
}
