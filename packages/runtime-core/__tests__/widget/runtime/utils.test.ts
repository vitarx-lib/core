/**
 * Widget Runtime Utils 单元测试
 *
 * 测试 Widget 运行时相关的工具函数
 */

import { Scheduler } from '@vitarx/responsive'
import { describe, expect, it, vi } from 'vitest'
import {
  createVNode,
  defineStatelessWidget,
  StatefulWidgetRuntime,
  StatelessWidgetRuntime,
  Widget
} from '../../../src/index.js'
import { createWidgetRuntime, useForceUpdater } from '../../../src/widget/runtime/utils.js'

// 测试用组件
class TestStatefulWidget extends Widget {
  build() {
    return createVNode('div', { children: 'stateful' })
  }
}

const TestStatelessWidget = defineStatelessWidget(() => {
  return createVNode('div', { children: 'stateless' })
})

describe('createWidgetRuntime', () => {
  describe('无状态组件', () => {
    it('应该创建 StatelessWidgetRuntime 实例', () => {
      const vnode = createVNode(TestStatelessWidget, {})
      const runtime = createWidgetRuntime(vnode)

      expect(runtime).toBeInstanceOf(StatelessWidgetRuntime)
    })

    it('应该绑定实例到 vnode.runtimeInstance', () => {
      const vnode = createVNode(TestStatelessWidget, {})
      const runtime = createWidgetRuntime(vnode)

      expect(vnode.runtimeInstance).toBe(runtime)
    })

    it('重复调用应该返回已有实例', () => {
      const vnode = createVNode(TestStatelessWidget, {})
      const runtime1 = createWidgetRuntime(vnode)
      const runtime2 = createWidgetRuntime(vnode)

      expect(runtime2).toBe(runtime1)
    })

    it('不同 vnode 应该创建不同实例', () => {
      const vnode1 = createVNode(TestStatelessWidget, {})
      const vnode2 = createVNode(TestStatelessWidget, {})

      const runtime1 = createWidgetRuntime(vnode1 as any)
      const runtime2 = createWidgetRuntime(vnode2 as any)

      expect(runtime1).not.toBe(runtime2)
    })
  })

  describe('有状态组件', () => {
    it('应该创建 StatefulWidgetRuntime 实例', () => {
      const vnode = createVNode(TestStatefulWidget, {})
      const runtime = createWidgetRuntime(vnode)

      expect(runtime).toBeInstanceOf(StatefulWidgetRuntime)
    })

    it('应该正确传递配置选项', () => {
      const vnode = createVNode(TestStatefulWidget, {})
      const options = {
        enableAutoUpdate: false,
        enableScheduler: false
      }
      const runtime = createWidgetRuntime(vnode, options)

      expect((runtime as StatefulWidgetRuntime).options.enableAutoUpdate).toBe(false)
      expect((runtime as StatefulWidgetRuntime).options.enableScheduler).toBe(false)
    })

    it('应该绑定实例到 vnode.runtimeInstance', () => {
      const vnode = createVNode(TestStatefulWidget, {})
      const runtime = createWidgetRuntime(vnode)

      expect(vnode.runtimeInstance).toBe(runtime)
    })

    it('重复调用应该返回已有实例', () => {
      const vnode = createVNode(TestStatefulWidget, {})
      const runtime1 = createWidgetRuntime(vnode)
      const runtime2 = createWidgetRuntime(vnode)

      expect(runtime2).toBe(runtime1)
    })

    it('类组件应该创建正确的实例', () => {
      class MyWidget extends Widget {
        build() {
          return createVNode('div')
        }
      }

      const vnode = createVNode(MyWidget, {})
      const runtime = createWidgetRuntime(vnode)

      expect(runtime).toBeInstanceOf(StatefulWidgetRuntime)
      expect(runtime.instance).toBeInstanceOf(MyWidget)
    })
  })

  describe('类型判断', () => {
    it('应该正确识别有状态组件', () => {
      class StatefulWidget extends Widget {
        build() {
          return createVNode('div')
        }
      }

      const vnode = createVNode(StatefulWidget, {})
      const runtime = createWidgetRuntime(vnode)

      expect(runtime).toBeInstanceOf(StatefulWidgetRuntime)
    })

    it('应该正确识别无状态组件', () => {
      const StatelessWidget = defineStatelessWidget(() => {
        return createVNode('div')
      })

      const vnode = createVNode(StatelessWidget, {})
      const runtime = createWidgetRuntime(vnode)

      expect(runtime).toBeInstanceOf(StatelessWidgetRuntime)
    })

    it('箭头函数应该识别为无状态组件', () => {
      const ArrowWidget = defineStatelessWidget(() => createVNode('div'))

      const vnode = createVNode(ArrowWidget, {})
      const runtime = createWidgetRuntime(vnode)

      expect(runtime).toBeInstanceOf(StatelessWidgetRuntime)
    })
  })
})

describe('useForceUpdater', () => {
  describe('正常使用', () => {
    it('应该返回强制更新函数', () => {
      class TestWidget extends Widget {
        test = 1
        forceUpdate: any
        override onCreate() {
          this.forceUpdate = useForceUpdater()
        }
        build() {
          return createVNode('div')
        }
      }

      const vnode = createVNode(TestWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode)
      expect(runtime.instance.forceUpdate).toBeInstanceOf(Function)
    })

    it('调用返回函数应该触发组件更新', () => {
      class TestWidget extends Widget {
        forceUpdate: any
        override onCreate() {
          this.forceUpdate = useForceUpdater()
        }
        build() {
          return createVNode('div')
        }
      }

      const vnode = createVNode(TestWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode)
      const updateSpy = vi.spyOn(runtime, 'update')

      runtime.instance.forceUpdate()

      expect(updateSpy).toHaveBeenCalled()
    })

    it('sync 为 true 时应该同步刷新调度器', () => {
      class TestWidget extends Widget {
        forceUpdate: any
        override onCreate() {
          this.forceUpdate = useForceUpdater()
        }
        build() {
          return createVNode('div')
        }
      }

      const vnode = createVNode(TestWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode)
      const flushSyncSpy = vi.spyOn(Scheduler, 'flushSync')

      runtime.instance.forceUpdate(true)

      expect(flushSyncSpy).toHaveBeenCalled()
    })

    it('sync 为 false 时应该异步更新', () => {
      class TestWidget extends Widget {
        forceUpdate: any
        override onCreate() {
          this.forceUpdate = useForceUpdater()
        }
        build() {
          return createVNode('div')
        }
      }

      const vnode = createVNode(TestWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode)
      const updateSpy = vi.spyOn(runtime, 'update')
      const flushSyncSpy = vi.spyOn(Scheduler, 'flushSync')

      runtime.instance.forceUpdate(false)

      expect(updateSpy).toHaveBeenCalled()
      expect(flushSyncSpy).not.toHaveBeenCalled()
    })

    it('应该在无状态组件中正常工作', () => {
      let forceUpdate: any

      function TestWidget() {
        forceUpdate = useForceUpdater()
        return createVNode('div')
      }

      const vnode = createVNode(TestWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode)

      expect(forceUpdate).toBeInstanceOf(Function)

      const updateSpy = vi.spyOn(runtime, 'update')
      forceUpdate()

      expect(updateSpy).toHaveBeenCalled()
    })
  })

  describe('异常场景', () => {
    it('非组件上下文调用应该抛出错误', () => {
      expect(() => {
        useForceUpdater()
      }).toThrow()
    })

    it('错误信息应该清晰明确', () => {
      let errorMessage = ''
      try {
        useForceUpdater()
      } catch (error: any) {
        errorMessage = error.message
      }

      expect(errorMessage).toBeTruthy()
    })

    it('在非生命周期钩子外调用应该抛出错误', () => {
      // 直接在外部调用，没有组件上下文
      expect(() => {
        useForceUpdater()
      }).toThrow()
    })
  })

  describe('集成测试', () => {
    it('forceUpdate 应该触发完整的更新流程', () => {
      let renderCount = 0
      class TestWidget extends Widget {
        forceUpdate: any
        override onCreate() {
          this.forceUpdate = useForceUpdater()
        }
        build() {
          renderCount++
          return createVNode('div', { children: renderCount.toString() })
        }
      }

      const vnode = createVNode(TestWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode)

      // 初始构建
      runtime.build()
      expect(renderCount).toBe(1)

      // 强制更新
      runtime.instance.forceUpdate(true)
      expect(renderCount).toBe(2)
    })

    it('多次 forceUpdate 应该正确处理', () => {
      class TestWidget extends Widget {
        forceUpdate: any
        override onCreate() {
          this.forceUpdate = useForceUpdater()
        }
        build() {
          return createVNode('div')
        }
      }

      const vnode = createVNode(TestWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode)
      const updateSpy = vi.spyOn(runtime, 'update')

      runtime.instance.forceUpdate()
      runtime.instance.forceUpdate()
      runtime.instance.forceUpdate()

      expect(updateSpy).toHaveBeenCalledTimes(3)
    })
  })
})
