import { nextTick, ref } from '@vitarx/responsive'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DynamicView, ViewKind } from '../../../src/index.js'
import { TextView } from '../../../src/view/implements/atomic.js'
import { ListView } from '../../../src/view/implements/list.js'

describe('DynamicView', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  it('应该创建一个 DynamicView 实例', () => {
    const source = ref('test')
    const dynamicView = new DynamicView(source)

    expect(dynamicView).toBeInstanceOf(DynamicView)
    expect(dynamicView.kind).toBe(ViewKind.DYNAMIC)
    expect(dynamicView.source).toBe(source)
  })

  it('应该接受 location 参数', () => {
    const source = ref('test')
    const location = { fileName: 'test.ts', lineNumber: 1, columnNumber: 1 }
    const dynamicView = new DynamicView(source, location)

    expect(dynamicView.location).toBe(location)
  })

  it('应该能够初始化、挂载和销毁', () => {
    const source = ref('test')
    const dynamicView = new DynamicView(source)

    expect(() => {
      dynamicView.init()
    }).not.toThrow()

    expect(() => {
      dynamicView.mount(container)
    }).not.toThrow()

    expect(() => {
      dynamicView.dispose()
    }).not.toThrow()
  })

  it('应该能够激活和停用', () => {
    const source = ref('test')
    const dynamicView = new DynamicView(source)
    dynamicView.init()
    dynamicView.mount(container)

    expect(() => {
      dynamicView.deactivate()
    }).not.toThrow()

    expect(() => {
      dynamicView.activate()
    }).not.toThrow()
  })

  it('应该根据响应式数据的变化更新视图', async () => {
    const source = ref('test text')
    const dynamicView = new DynamicView(source)
    dynamicView.init()
    dynamicView.mount(container)

    expect(container.textContent).toBe('test text')

    // 更新响应式数据
    source.value = 'updated text'
    await nextTick()

    expect(container.textContent).toBe('updated text')
  })

  it('应该处理空值', async () => {
    const source = ref<any>('test')
    const dynamicView = new DynamicView(source)
    dynamicView.init()
    dynamicView.mount(container)

    expect(container.textContent).toBe('test')

    // 测试 null 值
    source.value = null
    await nextTick()

    // 应该渲染为注释节点
    expect(container.childNodes.length).toBe(1)
    expect(container.childNodes[0].nodeType).toBe(8) // COMMENT_NODE

    // 测试 undefined 值
    source.value = undefined
    await nextTick()

    // 应该渲染为注释节点
    expect(container.childNodes.length).toBe(1)
    expect(container.childNodes[0].nodeType).toBe(8) // COMMENT_NODE

    // 测试布尔值
    source.value = false
    await nextTick()

    // 应该渲染为注释节点
    expect(container.childNodes.length).toBe(1)
    expect(container.childNodes[0].nodeType).toBe(8) // COMMENT_NODE
  })

  it('应该处理空字符串', async () => {
    const source = ref('test')
    const dynamicView = new DynamicView(source)
    dynamicView.init()
    dynamicView.mount(container)

    expect(container.textContent).toBe('test')

    // 测试空字符串
    source.value = ''
    await nextTick()

    // 应该渲染为注释节点
    expect(container.childNodes.length).toBe(1)
    expect(container.childNodes[0].nodeType).toBe(8) // COMMENT_NODE
  })

  it('应该处理不同类型的值', async () => {
    // 拦截 console.warn 以抑制不支持类型的警告信息
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const source = ref<any>('test')
    const dynamicView = new DynamicView(source)
    dynamicView.init()
    dynamicView.mount(container)

    expect(container.textContent).toBe('test')

    // 测试数字
    source.value = 123
    await nextTick()

    expect(container.textContent).toBe('123')

    // 测试对象
    source.value = { toString: () => 'object' }
    await nextTick()
    expect(container.innerHTML).toBe('<!--v-if-->')
    warnSpy.mockRestore()
  })

  it('当数据相同时应该跳过更新', async () => {
    const source = ref('test')
    const dynamicView = new DynamicView(source)
    dynamicView.init()
    dynamicView.mount(container)

    expect(container.textContent).toBe('test')

    // 再次设置相同的值
    source.value = 'test'
    await nextTick()

    // 内容应该保持不变
    expect(container.textContent).toBe('test')
  })
})

describe('DynamicView 数组渲染', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  it('应该渲染字符串数组', async () => {
    const source = ref<any>(['a', 'b', 'c'])
    const dynamicView = new DynamicView(source)
    dynamicView.init()
    dynamicView.mount(container)

    expect(container.textContent).toBe('abc')
  })

  it('应该渲染数字数组', async () => {
    const source = ref<any>([1, 2, 3])
    const dynamicView = new DynamicView(source)
    dynamicView.init()
    dynamicView.mount(container)

    expect(container.textContent).toBe('123')
  })

  it('应该渲染 View 实例数组', async () => {
    const source = ref<any>([new TextView('x'), new TextView('y')])
    const dynamicView = new DynamicView(source)
    dynamicView.init()
    dynamicView.mount(container)

    expect(container.textContent).toBe('xy')
  })

  it('应该渲染混合类型数组', async () => {
    const source = ref<any>(['hello', 42, new TextView('world')])
    const dynamicView = new DynamicView(source)
    dynamicView.init()
    dynamicView.mount(container)

    expect(container.textContent).toBe('hello42world')
  })

  it('应该渲染嵌套数组（自动扁平化）', async () => {
    const source = ref<any>([['a', 'b'], 'c'])
    const dynamicView = new DynamicView(source)
    dynamicView.init()
    dynamicView.mount(container)

    expect(container.textContent).toBe('abc')
  })

  it('应该渲染空数组', async () => {
    const source = ref<any>([])
    const dynamicView = new DynamicView(source)
    dynamicView.init()
    dynamicView.mount(container)

    expect(container.textContent).toBe('')
  })

  it('数组引用相同时应该跳过更新', async () => {
    const arr = ['a', 'b']
    const source = ref<any>(arr)
    const dynamicView = new DynamicView(source)
    dynamicView.init()
    dynamicView.mount(container)

    expect(container.textContent).toBe('ab')

    source.value = arr
    await nextTick()

    expect(container.textContent).toBe('ab')
  })

  it('数组引用不同时应该重建 ListView', async () => {
    const source = ref<any>(['a', 'b'])
    const dynamicView = new DynamicView(source)
    dynamicView.init()
    dynamicView.mount(container)

    expect(container.textContent).toBe('ab')

    source.value = ['x', 'y', 'z']
    await nextTick()

    expect(container.textContent).toBe('xyz')
  })

  it('应该支持从数组切换到文本', async () => {
    const source = ref<any>(['a', 'b'])
    const dynamicView = new DynamicView(source)
    dynamicView.init()
    dynamicView.mount(container)

    expect(container.textContent).toBe('ab')

    source.value = 'text'
    await nextTick()

    expect(container.textContent).toBe('text')
  })

  it('应该支持从文本切换到数组', async () => {
    const source = ref<any>('text')
    const dynamicView = new DynamicView(source)
    dynamicView.init()
    dynamicView.mount(container)

    expect(container.textContent).toBe('text')

    source.value = ['a', 'b']
    await nextTick()

    expect(container.textContent).toBe('ab')
  })

  it('应该支持从数组切换到空值', async () => {
    const source = ref<any>(['a', 'b'])
    const dynamicView = new DynamicView(source)
    dynamicView.init()
    dynamicView.mount(container)

    expect(container.textContent).toBe('ab')

    source.value = null
    await nextTick()

    expect(container.childNodes.length).toBe(1)
    expect(container.childNodes[0].nodeType).toBe(8)
  })

  it('应该支持从空值切换到数组', async () => {
    const source = ref<any>(null)
    const dynamicView = new DynamicView(source)
    dynamicView.init()
    dynamicView.mount(container)

    expect(container.childNodes[0].nodeType).toBe(8)

    source.value = ['a', 'b']
    await nextTick()

    expect(container.textContent).toBe('ab')
  })

  it('数组渲染的当前视图应该是 ListView', async () => {
    const source = ref<any>(['a', 'b'])
    const dynamicView = new DynamicView(source)
    dynamicView.init()
    dynamicView.mount(container)

    expect(dynamicView.currentView).toBeInstanceOf(ListView)
  })

  it('应该正确处理数组的销毁', async () => {
    const source = ref<any>(['a', 'b'])
    const dynamicView = new DynamicView(source)
    dynamicView.init()
    dynamicView.mount(container)

    expect(container.textContent).toBe('ab')

    expect(() => {
      dynamicView.dispose()
    }).not.toThrow()
  })
})
