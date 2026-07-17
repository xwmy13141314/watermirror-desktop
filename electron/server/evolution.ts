/**
 * 进化曲线积分算法
 * 移植自 Python evolution.py
 * 三维积分: E_Grit(长程稳态) / E_Insight(本质直觉) / E_Optimize(局部优化)
 */

export function calculateDailyScore(
  energy: number,
  chaos: number,
  discomfort: number,
): [number, number, number] {
  // E_Grit: 精力高 + 混乱低 = 稳态强
  const e_grit = Math.min(100, Math.max(0, energy * 8 + (10 - chaos) * 2))

  // E_Insight: 不爽度转化为觉察力 (适度不爽 = 高觉察)
  const e_insight = Math.min(100, Math.max(0, 40 + discomfort * 4))

  // E_Optimize: 能量管理
  const e_optimize = Math.min(100, Math.max(0, energy * 5 + 20))

  return [round1(e_grit), round1(e_insight), round1(e_optimize)]
}

export function movingAverage(values: number[], window: number): number[] {
  const result: number[] = []
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1)
    const subset = values.slice(start, i + 1)
    const avg = subset.reduce((a, b) => a + b, 0) / subset.length
    result.push(round1(avg))
  }
  return result
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}
