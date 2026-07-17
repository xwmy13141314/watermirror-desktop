/**
 * 套路破坏机制
 * D: 默认稳压+弹药 / P: 诗意金句 / Q: 扎心反问 / R: 纵向回溯
 * 移植自 Python feedback.py
 */

const ROUTINE_CYCLE = ['D', 'P', 'Q', 'R']
const ROUTINE_PERIOD = 6 // 每6天切换

const ROUTINE_CONFIGS: Record<string, { type: string; name: string; label: string }> = {
  D: { type: 'D', name: '稳压 + 弹药', label: '驱动型' },
  P: { type: 'P', name: '诗意金句', label: '偏执型' },
  Q: { type: 'Q', name: '扎心反问', label: '求稳型' },
  R: { type: 'R', name: '纵向回溯', label: '反复型' },
}

export function getCurrentRoutine(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  )
  const cycleIndex = Math.floor(dayOfYear / ROUTINE_PERIOD) % ROUTINE_CYCLE.length
  return ROUTINE_CYCLE[cycleIndex]
}

export function getRoutineConfig(type: string) {
  return ROUTINE_CONFIGS[type] || ROUTINE_CONFIGS.D
}
