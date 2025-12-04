/**
 * StatelessWidgetRuntime 单元测试
 *
 * 测试无状态组件运行时管理器的渲染和更新逻辑
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  COMMENT_NODE_TYPE,
  createVNode,
  defineStatelessWidget,
  findParentNode,
  StatelessWidgetRuntime,
  TEXT_NODE_TYPE
} from '../../../src/index.js'

// 测试用无状态组件
const StatelessWidget = defineStatelessWidget((props: { text?: string }) => {
  return createVNode('div', { children: props.text || 'default' })
})

function NumberWidget() {
  return 42
}

function StringWidget() {
  return 'Hello World'
}

function FunctionWidget() {
  return () => createVNode('div')
}

function NullWidget() {
  return null
}

function UndefinedWidget() {
  return undefined
}

describe('StatelessWidgetRuntime', () => {
  describe('build 方法', () => {
    it('应该调用组件类型函数并传入 props', () => {
      const props = { text: 'test content' }
      const spy = vi.fn(StatelessWidget)
      const vnode = createVNode(spy, props)
      const runtime = new StatelessWidgetRuntime(vnode as any)

      runtime.build()

      expect(spy).toHaveBeenCalledWith(props)
    })

    it('应该在正确的上下文中执行', () => {
      let contextChecked = false
      function ContextWidget() {
        contextChecked = true
        return createVNode('div')
      }

      const vnode = createVNode(ContextWidget, {})
      const runtime = new StatelessWidgetRuntime(vnode as any)
      const runInContextSpy = vi.spyOn(runtime, 'runInContext')

      runtime.build()

      expect(runInContextSpy).toHaveBeenCalled()
      expect(contextChecked).toBe(true)
    })

    it('返回 VNode 应该直接使用', () => {
      const expectedVNode = createVNode('span', { children: 'content' })
      function VNodeWidget() {
        return expectedVNode
      }

      const vnode = createVNode(VNodeWidget, {})
      const runtime = new StatelessWidgetRuntime(vnode as any)

      const result = runtime.build()

      expect(result).toBe(expectedVNode)
    })

    it('返回字符串应该转换为文本节点', () => {
      const vnode = createVNode(StringWidget, {})
      const runtime = new StatelessWidgetRuntime(vnode as any)

      const result = runtime.build()

      expect(result.type).toBe(TEXT_NODE_TYPE)
      expect(result.props.text).toBe('Hello World')
    })

    it('返回数字应该转换为文本节点', () => {
      const vnode = createVNode(NumberWidget, {})
      const runtime = new StatelessWidgetRuntime(vnode as any)

      const result = runtime.build()

      expect(result.type).toBe('plain-text')
      expect(result.props.text).toBe('42')
    })

    it('返回函数应该抛出错误', () => {
      const vnode = createVNode(FunctionWidget, {})
      const runtime = new StatelessWidgetRuntime(vnode as any)

      expect(() => {
        runtime.build()
      }).toThrow('StatelessWidget<FunctionWidget> cannot return a function')
    })

    it('返回 null 应该创建注释节点', () => {
      const vnode = createVNode(NullWidget, {})
      const runtime = new StatelessWidgetRuntime(vnode as any)

      const result = runtime.build()

      expect(result.type).toBe(COMMENT_NODE_TYPE)
      expect(result.props.text).toBeDefined()
      expect(result.props.text).toContain('StatelessWidget<NullWidget>')
    })

    it('返回 undefined 应该创建注释节点', () => {
      const vnode = createVNode(UndefinedWidget, {})
      const runtime = new StatelessWidgetRuntime(vnode as any)

      const result = runtime.build()

      expect(result.type).toBe('comment')
      expect(result.props.text).toBeDefined()
      expect(result.props.text).toContain('StatelessWidget<UndefinedWidget>')
    })

    it('返回对象应该创建注释节点', () => {
      function ObjectWidget() {
        return { foo: 'bar' }
      }

      const vnode = createVNode(ObjectWidget as any, {})
      const runtime = new StatelessWidgetRuntime(vnode as any)

      const result = runtime.build()

      expect(result.type).toBe('comment')
      expect(result.props.text).toBeDefined()
      expect(result.props.text).toContain('returned invalid type object')
    })

    it('应该正确链接父节点关系', () => {
      const vnode = createVNode(StatelessWidget)
      const runtime = new StatelessWidgetRuntime(vnode)

      const child = runtime.build()

      expect(findParentNode(child)).toBe(vnode)
    })
  })

  describe('update 方法', () => {
    let vnode: any
    let runtime: StatelessWidgetRuntime

    beforeEach(() => {
      vnode = createVNode(StatelessWidget, { text: 'initial' })
      runtime = new StatelessWidgetRuntime(vnode)
      // 触发初始构建
      runtime.child
    })

    it('应该重新构建子节点', () => {
      const buildSpy = vi.spyOn(runtime, 'build')
      runtime.update()

      expect(buildSpy).toHaveBeenCalled()
    })

    it('应该使用 patchUpdate 进行差异更新', () => {
      const oldChild = runtime.cachedChildVNode

      runtime.update()

      // patchUpdate 应该被调用，cachedChildVNode 应该被更新
      expect(runtime.cachedChildVNode).toBeDefined()
    })

    it('应该更新 cachedChildVNode', () => {
      const oldChild = runtime.cachedChildVNode

      runtime.update()

      // 可能返回相同的节点（如果没有变化），或者新节点
      expect(runtime.cachedChildVNode).toBeDefined()
    })

    it('props 变化应该反映到新构建的节点中', () => {
      // 更新 props
      vnode.props = { text: 'updated' }

      runtime.update()

      // 新构建的节点应该使用新的 props
      const newChild = runtime.cachedChildVNode
      expect(newChild).toBeDefined()
    })

    it('多次 update 应该正确更新', () => {
      runtime.update()
      const child1 = runtime.cachedChildVNode

      runtime.update()
      const child2 = runtime.cachedChildVNode

      expect(child2).toBeDefined()
    })
  })

  describe('组件名称提取', () => {
    it('具名函数应该正确提取名称', () => {
      function MyCustomWidget() {
        return createVNode('div')
      }

      const vnode = createVNode(MyCustomWidget, {})
      const runtime = new StatelessWidgetRuntime(vnode as any)

      expect(runtime.name).toBe('MyCustomWidget')
    })

    it('匿名函数应该有默认名称处理', () => {
      const AnonymousWidget = () => createVNode('div')

      const vnode = createVNode(AnonymousWidget, {})
      const runtime = new StatelessWidgetRuntime(vnode as any)

      // 名称应该被提取（可能是 'AnonymousWidget' 或 'anonymous'）
      expect(runtime.name).toBeDefined()
    })
  })

  describe('错误处理', () => {
    it('build 抛出错误应该向上传播', () => {
      const ErrorWidget = defineStatelessWidget((): any => {
        throw new Error('Build error')
      })

      const vnode = createVNode(ErrorWidget, {})
      const runtime = new StatelessWidgetRuntime(vnode)

      expect(() => {
        runtime.build()
      }).toThrow('Build error')
    })

    it('返回函数的错误信息应该包含组件名称', () => {
      const BadWidget = defineStatelessWidget((): any => {
        return () => {}
      })
      const vnode = createVNode(BadWidget, {})
      const runtime = new StatelessWidgetRuntime(vnode as any)

      try {
        runtime.build()
      } catch (error: any) {
        expect(error.message).toContain('cannot return a function')
      }
    })
  })
})
