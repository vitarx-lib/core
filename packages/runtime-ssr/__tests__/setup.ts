// setup 是所有测试开始前需要执行的文件
import { setHostSchema, setRenderer } from '@vitarx/runtime-core'
import { DomRenderer, VOID_ELEMENTS } from '@vitarx/runtime-dom'
import { registerDefaultDrivers } from '@vitarx/runtime-drivers'
import { beforeEach } from 'vitest'

// 注册 DomRenderer 和所有节点驱动器
setRenderer(new DomRenderer())
setHostSchema({ voidElements: VOID_ELEMENTS })
registerDefaultDrivers()

// 每个测试前清理 DOM
beforeEach(() => {
  document.body.innerHTML = ''
  // 清理全局状态
  if (typeof window !== 'undefined') {
    delete (window as any).__INITIAL_STATE__
  }
})
