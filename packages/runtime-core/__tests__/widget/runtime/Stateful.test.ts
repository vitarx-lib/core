/**
 * StatefulWidgetRuntime 单元测试
 *
 * 测试有状态组件运行时管理器的完整生命周期和状态管理
 */

import { ref, Scheduler } from '@vitarx/responsive'
import { logger } from '@vitarx/utils'
import { describe, expect, it, vi } from 'vitest'
import {
  activateNode,
  createVNode,
  deactivateNode,
  type ErrorInfo,
  findParentNode,
  LifecycleHooks,
  mountNode,
  NodeState,
  type Renderable,
  renderNode,
  type StatefulManagerOptions,
  StatefulWidgetRuntime,
  Widget
} from '../../../src/index.js'
import { flushScheduler, renderAndMount } from '../../helpers/test-widget.js'

// 测试用组件
class TestWidget extends Widget {
  build() {
    return createVNode('div', { children: 'test' })
  }
}

class ReactiveWidget extends Widget {
  count = ref(0)

  build() {
    return createVNode('div', { children: this.count.value.toString() })
  }
}

describe('StatefulWidgetRuntime', () => {
  describe('初始化', () => {
    it('应该创建 EffectScope 实例', () => {
      const vnode = createVNode(TestWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any)

      expect(runtime.scope).toBeDefined()
      expect(runtime.scope.constructor.name).toBe('EffectScope')
    })

    it('应该正确合并配置选项', () => {
      const options: StatefulManagerOptions = {
        enableAutoUpdate: false,
        enableScheduler: false
      }
      const vnode = createVNode(TestWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any, options)

      expect(runtime.options.enableAutoUpdate).toBe(false)
      expect(runtime.options.enableScheduler).toBe(false)
    })

    it('默认配置应该启用自动更新和调度器', () => {
      const vnode = createVNode(TestWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any)

      expect(runtime.options.enableAutoUpdate).toBe(true)
      expect(runtime.options.enableScheduler).toBe(true)
    })

    it('应该通过 proxyWidgetProps 处理 props', () => {
      const props = { name: 'test', age: 30 }
      const vnode = createVNode(TestWidget, props)
      const runtime = new StatefulWidgetRuntime(vnode as any)

      expect(runtime.props).toBeDefined()
    })

    it('应该创建类组件实例', () => {
      class MyWidget extends Widget {
        build() {
          return createVNode('div')
        }
      }

      const vnode = createVNode(MyWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any)

      expect(runtime.instance).toBeInstanceOf(MyWidget)
      expect(runtime.instance).toBeInstanceOf(Widget)
    })

    it('应该创建函数组件实例', () => {
      const FnWidget = () => {
        return createVNode('div')
      }

      const vnode = createVNode(FnWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any)

      expect(runtime.instance).toBeDefined()
      expect(runtime.instance.constructor.name).toBe('FnWidget')
    })

    it('异步组件应该被正确标记为 isAsyncWidget', () => {
      const AsyncWidget = () => Promise.resolve({ default: () => createVNode('div') })

      const vnode = createVNode(AsyncWidget, {})
      new StatefulWidgetRuntime(vnode)

      // 异步组件会标记为 isAsyncWidget
      expect(vnode.isAsyncWidget).toBe(true)
    })
  })

  describe('生命周期钩子调用', () => {
    it('应该正确调用 onCreate', () => {
      const onCreate = vi.fn()
      class LifecycleWidget extends Widget {
        override onCreate() {
          onCreate()
        }
        build() {
          return createVNode('div')
        }
      }

      const vnode = createVNode(LifecycleWidget, {})
      new StatefulWidgetRuntime(vnode)

      expect(onCreate).toHaveBeenCalled()
    })

    it('应该正确调用 onBeforeUpdate', () => {
      const onBeforeUpdate = vi.fn()
      class UpdateWidget extends Widget {
        override onBeforeUpdate() {
          onBeforeUpdate()
        }
        build() {
          return createVNode('div')
        }
      }

      const vnode = createVNode(UpdateWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any)

      runtime.update()

      expect(onBeforeUpdate).toHaveBeenCalled()
    })

    it('应该正确调用 onUpdated', () => {
      const onUpdated = vi.fn()
      class UpdateWidget extends Widget {
        override onUpdated() {
          onUpdated()
        }
        build() {
          return createVNode('div')
        }
      }

      const vnode = createVNode(UpdateWidget, {})
      mountNode(vnode)
      const runtime = vnode.instance!

      runtime.update()
      flushScheduler()

      expect(onUpdated).toHaveBeenCalled()
    })

    it('钩子不存在时不应该报错', () => {
      class MinimalWidget extends Widget {
        build() {
          return createVNode('div')
        }
      }

      const vnode = createVNode(MinimalWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any)

      expect(() => {
        runtime.invokeHook(LifecycleHooks.beforeUpdate)
        runtime.invokeHook(LifecycleHooks.updated)
      }).not.toThrow()
    })

    it('钩子抛出错误时应该调用 reportError', () => {
      const error = new Error('Hook error')
      class ErrorWidget extends Widget {
        override onBeforeUpdate() {
          throw error
        }
        override onError(error: unknown, info: ErrorInfo): unknown {
          return false
        }
        build() {
          return createVNode('div')
        }
      }

      const vnode = createVNode(ErrorWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any)
      const reportErrorSpy = vi.spyOn(runtime, 'reportError')

      runtime.invokeHook(LifecycleHooks.beforeUpdate)

      expect(reportErrorSpy).toHaveBeenCalledWith(error, expect.stringContaining('hook:'))
    })
  })

  describe('响应式依赖追踪', () => {
    it('enableAutoUpdate 为 true 时应该建立依赖订阅', () => {
      const vnode = createVNode(ReactiveWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any, {
        enableAutoUpdate: true
      })

      runtime.build()

      // 开发模式下应该记录依赖
      if (process.env.NODE_ENV !== 'production') {
        expect(runtime.deps).toBeDefined()
      }
    })

    it('响应式数据变化应该自动触发更新', async () => {
      const vnode = renderAndMount(ReactiveWidget)
      const runtime = vnode.instance!
      expect(runtime.deps?.size).toBe(1)
      // 修改响应式数据
      runtime.instance.count.value++
      flushScheduler()
      expect(vnode.el!.textContent).toBe('1')
    })

    it('开发模式下应该记录 deps 依赖映射', () => {
      const vnode = createVNode(ReactiveWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any)

      runtime.build()

      // 开发模式下 deps 应该被记录
      if (process.env.NODE_ENV !== 'production') {
        expect(runtime.deps).not.toBeNull()
      }
    })

    it('enableAutoUpdate 为 false 时不应追踪依赖', () => {
      const vnode = createVNode(ReactiveWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any, {
        enableAutoUpdate: false
      })

      runtime.build()

      // 不应该建立订阅
      expect((runtime as any).renderDepsSubscriber).toBeNull()
    })

    it('build 调用前应该清理旧的订阅器', () => {
      const vnode = createVNode(ReactiveWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any)

      // 第一次 build
      runtime.build()
      const firstSubscriber = (runtime as any).renderDepsSubscriber

      // 第二次 build
      runtime.build()
      const secondSubscriber = (runtime as any).renderDepsSubscriber

      // 订阅器应该被重新创建
      expect(secondSubscriber).not.toBe(firstSubscriber)
    })
  })

  describe('更新调度机制', () => {
    it('enableScheduler 为 true 时应该异步批量更新', () => {
      const vnode = createVNode(TestWidget, {})
      mountNode(vnode)
      const runtime = vnode.instance!

      const queueJobSpy = vi.spyOn(Scheduler, 'queueJob')

      runtime.update()

      expect(queueJobSpy).toHaveBeenCalled()
    })

    it('enableScheduler 为 false 时应该同步更新', () => {
      const vnode = createVNode(TestWidget, {})
      mountNode(vnode)
      const runtime = vnode.instance!
      runtime.build()

      const buildSpy = vi.spyOn(runtime, 'build')

      runtime.update()
      flushScheduler()

      // 同步更新，立即执行
      expect(buildSpy).toHaveBeenCalled()
    })

    it('多次调用 update 应该合并为一次更新', () => {
      const vnode = createVNode(TestWidget, {})
      mountNode(vnode)
      const runtime = vnode.instance!

      const queueJobSpy = vi.spyOn(Scheduler, 'queueJob')

      runtime.update()
      runtime.update()
      runtime.update()
      flushScheduler()

      // queueJob 应该只被调用一次（因为 hasPendingUpdate 标志）
      expect(queueJobSpy).toHaveBeenCalledTimes(1)
    })

    it('Unmounted 状态下不应该执行更新', () => {
      const vnode = createVNode(TestWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any, {
        enableScheduler: false
      })
      vnode.state = NodeState.Unmounted

      const buildSpy = vi.spyOn(runtime, 'build')

      runtime.update()

      expect(buildSpy).not.toHaveBeenCalled()
    })

    it('Deactivated 状态下应该标记 dirty 而不更新', () => {
      const vnode = createVNode(TestWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any, {
        enableScheduler: false
      })
      vnode.state = NodeState.Deactivated

      runtime.update()

      expect(runtime.dirty).toBe(true)
    })

    it('dirty 为 true 时激活后应该触发更新', () => {
      const vnode = createVNode(TestWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode, {
        enableScheduler: false
      })
      renderNode(vnode)
      mountNode(vnode, document.createElement('div'))
      deactivateNode(vnode)
      runtime.update()
      activateNode(vnode)
      // patch 方法会重置 dirty
      expect(runtime.dirty).toBe(false)
    })
  })

  describe('错误处理流程', () => {
    it('应该优先调用组件实例的 onError', () => {
      const onError = vi.fn(() => false)
      class ErrorHandlerWidget extends Widget {
        override onError() {
          return onError()
        }
        build() {
          return createVNode('div')
        }
      }

      const vnode = createVNode(ErrorHandlerWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any)

      runtime.reportError(new Error('test'), 'build')

      expect(onError).toHaveBeenCalled()
    })

    it('onError 返回 false 应该停止错误冒泡', () => {
      const onError = vi.fn(() => false)
      class ParentWidget extends Widget {
        override onError() {
          return onError()
        }
        build() {
          return createVNode('div')
        }
      }

      const vnode = createVNode(ParentWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any)

      const result = runtime.reportError(new Error('test'), 'build')

      expect(result).toBeUndefined()
      expect(onError).toHaveBeenCalled()
    })

    it('onError 返回 VNode 应该渲染错误视图', () => {
      const errorVNode = createVNode('div', { children: 'Error!' })
      class ErrorWidget extends Widget {
        override onError() {
          return errorVNode
        }
        build() {
          return createVNode('div')
        }
      }

      const vnode = createVNode(ErrorWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any)

      const result = runtime.reportError(new Error('test'), 'build')

      expect(result).toBe(errorVNode)
    })

    it('应该向上冒泡到父组件的 onError', () => {
      const parentOnError = vi.fn(() => false)
      class ParentWidget extends Widget {
        override onError() {
          return parentOnError()
        }
        build() {
          return createVNode(ChildWidget, {})
        }
      }

      class ChildWidget extends Widget {
        build(): Renderable {
          throw new Error('child error')
        }
      }

      const parentVNode = createVNode(ParentWidget, {})
      const parentRuntime = new StatefulWidgetRuntime(parentVNode)

      renderNode(parentVNode)
      parentRuntime.reportError(new Error('child error'), 'build')

      expect(parentOnError).toHaveBeenCalled()
    })

    it('无父组件时应该调用应用级 errorHandler', () => {
      const appErrorHandler = vi.fn()
      const vnode = createVNode(TestWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any)

      vnode.appContext = {
        config: {
          errorHandler: appErrorHandler
        }
      } as any

      runtime.reportError(new Error('test'), 'build')

      expect(appErrorHandler).toHaveBeenCalled()
    })

    it('onError 钩子本身抛错应该防止无限循环', () => {
      const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})

      class InfiniteErrorWidget extends Widget {
        override onError() {
          throw new Error('Error in onError')
        }
        build() {
          return createVNode('div')
        }
      }

      const vnode = createVNode(InfiniteErrorWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any)

      // 不应该导致无限循环
      expect(() => {
        runtime.reportError(new Error('test'), 'build')
      }).not.toThrow('Error in onError')
      errorSpy.mockRestore()
    })

    it('build 失败应该返回注释节点', () => {
      class BuildErrorWidget extends Widget {
        override onError(error: unknown, info: ErrorInfo): any {
          return false
        }
        build(): any {
          throw new Error('Build failed')
        }
      }

      const vnode = createVNode(BuildErrorWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any)

      const result = (runtime as any).buildChildVNode()

      expect(result.type).toBe('comment')
      expect(result.props.text).toContain('build failed')
    })
  })

  describe('虚拟节点构建', () => {
    it('build 返回 VNode 应该正确处理', () => {
      const expectedVNode = createVNode('span')
      class VNodeWidget extends Widget {
        build() {
          return expectedVNode
        }
      }

      const vnode = createVNode(VNodeWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any)

      const result = (runtime as any).buildChildVNode()

      expect(result).toBe(expectedVNode)
    })

    it('build 返回字符串应该转换为文本节点', () => {
      class StringWidget extends Widget {
        build(): any {
          return 'Hello'
        }
      }

      const vnode = createVNode(StringWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any)

      const result = (runtime as any).buildChildVNode()

      expect(result.type).toBe('plain-text')
      expect(result.props.text).toBe('Hello')
    })

    it('build 返回数字应该转换为文本节点', () => {
      class NumberWidget extends Widget {
        build(): any {
          return 123
        }
      }

      const vnode = createVNode(NumberWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any)

      const result = (runtime as any).buildChildVNode()

      expect(result.type).toBe('plain-text')
      expect(result.props.text).toBe('123')
    })

    it('build 返回其他类型应该创建注释节点', () => {
      class InvalidWidget extends Widget {
        build(): any {
          return { foo: 'bar' }
        }
      }

      const vnode = createVNode(InvalidWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any)

      const result = (runtime as any).buildChildVNode()

      expect(result.type).toBe('comment')
      expect(result.props.text).toContain('returned invalid type')
    })

    it('应该正确链接父节点关系', () => {
      const vnode = createVNode(TestWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any)

      const child = (runtime as any).buildChildVNode()

      expect(findParentNode(child)).toBe(vnode)
    })

    it('build 抛错应该被捕获并处理', () => {
      class ThrowWidget extends Widget {
        override onError(): any {
          return false
        }
        build(): any {
          throw new Error('Build error')
        }
      }

      const vnode = createVNode(ThrowWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any)

      // 不应该抛出错误，而是返回注释节点
      const result = (runtime as any).buildChildVNode()

      expect(result.type).toBe('comment')
    })
  })

  describe('补丁更新', () => {
    it('Created 状态下应该直接返回新节点', () => {
      const vnode = createVNode(TestWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any)
      vnode.state = NodeState.Created

      const newChild = (runtime as any).patch()

      expect(newChild).toBeDefined()
    })

    it('存在 $patchUpdate 时应该调用自定义更新', () => {
      const customPatch = vi.fn((_old, newNode) => newNode)
      class CustomPatchWidget extends Widget {
        override $patchUpdate(old: any, newNode: any) {
          return customPatch(old, newNode)
        }
        build() {
          return createVNode('div')
        }
      }

      const vnode = createVNode(CustomPatchWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode)
      vnode.state = NodeState.Activated
      runtime.update()
      flushScheduler()
      expect(customPatch).toHaveBeenCalled()
    })
  })

  describe('资源销毁', () => {
    it('应该释放 renderDepsSubscriber', () => {
      const vnode = createVNode(ReactiveWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any)
      runtime.build()

      const subscriber = (runtime as any).renderDepsSubscriber
      const disposeSpy = subscriber ? vi.spyOn(subscriber, 'dispose') : null

      runtime.destroy()

      if (disposeSpy) {
        expect(disposeSpy).toHaveBeenCalled()
      }
      expect((runtime as any).renderDepsSubscriber).toBeNull()
    })

    it('应该清空 deps', () => {
      const vnode = createVNode(ReactiveWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any)
      runtime.build()

      runtime.destroy()

      expect(runtime.deps).toBeNull()
    })

    it('应该释放 EffectScope', () => {
      const vnode = createVNode(TestWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any)
      const scopeDisposeSpy = vi.spyOn(runtime.scope, 'dispose')

      runtime.destroy()

      expect(scopeDisposeSpy).toHaveBeenCalled()
    })

    it('应该调用父类 destroy', () => {
      const vnode = createVNode(TestWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode as any)
      runtime.build()

      runtime.destroy()

      expect(runtime.cachedChildVNode).toBeNull()
      expect(vnode.instance).toBeUndefined()
    })
  })
})
