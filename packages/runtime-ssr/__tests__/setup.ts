// setup 是所有测试开始前需要执行的文件
import { setRenderer } from '@vitarx/runtime-core'
import { DOMRenderer } from '@vitarx/runtime-dom'
import { beforeEach } from 'vitest'

// 注册 DomRenderer 和所有节点驱动器
setRenderer(new DOMRenderer())

// 每个测试前清理 DOM
beforeEach(() => {
  document.body.innerHTML = ''
  // 清理全局状态
  if (typeof window !== 'undefined') {
    delete (window as any).__INITIAL_STATE__
  }
})
