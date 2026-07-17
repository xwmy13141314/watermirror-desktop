# 水镜进化 WaterMirror OS - Windows 桌面版

AI 驱动的天赋发现与进化系统，Windows 原生桌面应用。

## 下载安装

1. 前往 [Releases](../../releases) 页面下载 `水镜进化.exe`
2. 双击运行即可，无需安装
3. 首次使用建议在「设置」中配置 DashScope API Key 以启用 AI 对话功能

## 功能

- **AI 天赋测评** — 3-5 轮对话式深度访谈，生成个人天赋画像
- **每日复盘** — 三维度滑块（精力/混乱/不爽）+ AI 双轨反馈
- **进化曲线** — 三维积分（Grit/Insight/Optimize）+ 7日移动平均
- **天赋说明书** — Top3 天赋卡片 + 能力构成雷达图
- **套路破坏机制** — D/P/Q/R 四态周期，避免反馈疲劳

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vite + React 18 + TypeScript + TailwindCSS |
| 后端 | Express + better-sqlite3（内嵌 Electron 主进程） |
| AI | 通义千问 DashScope API（qwen-max） |
| 桌面 | Electron 31 |
| 打包 | electron-builder |

## 本地开发

```bash
npm install
npm run rebuild    # 重新编译 better-sqlite3 原生模块
npm run dev        # 启动 Vite 前端开发服务器
# 另一个终端
npm run build:electron && npx electron .   # 启动 Electron
```

## 打包

```bash
npm run build
npm run build:electron
npx electron-builder --dir --win    # 输出到 release/win-unpacked/
```

## 数据存储

- 数据库：`%APPDATA%\水镜进化\watermirror.db`
- 配置：`%APPDATA%\水镜进化\config.json`（API Key）

## 设计系统

- 背景：#FAF8F3（暖米色）
- 主色：#E85D5D（珊瑚红）
- 文字：#1A1A2E
- 圆角：22px 大圆角卡片
- 字体：Noto Serif SC（标题）+ Inter（正文）

## License

MIT
