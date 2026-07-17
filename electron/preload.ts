/**
 * 预加载脚本 - 向渲染进程暴露安全 API
 */
const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('watermirror', {
  version: '1.0.0',
  platform: process.platform,
})
