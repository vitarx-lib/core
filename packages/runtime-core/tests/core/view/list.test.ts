import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ListView, TextView, ViewKind } from '../../../src/index.js'

describe('ListView', () => {
  let listView: ListView
  let container: HTMLElement

  beforeEach(() => {
    listView = new ListView()
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  it('应该创建一个 ListView 实例', () => {
    expect(listView).toBeInstanceOf(ListView)
    expect(listView.kind).toBe(ViewKind.LIST)
    expect(listView.length).toBe(0)
  })

  it('应该接受 location 参数', () => {
    const location = { fileName: 'test.ts', lineNumber: 1, columnNumber: 1 }
    const listWithLocation = new ListView([], location)

    expect(listWithLocation.location).toBe(location)
  })

  it('应该接受初始视图数组', () => {
    const view1 = new TextView('test 1')
    const view2 = new TextView('test 2')
    const listWithItems = new ListView([view1, view2])

    expect(listWithItems.length).toBe(2)
  })

  it('应该能够追加视图', () => {
    const view = new TextView('test')
    listView.append(view)

    expect(listView.length).toBe(1)
    expect(listView.first).toBe(view)
    expect(listView.last).toBe(view)
  })

  it('应该能够插入视图', () => {
    const view1 = new TextView('test 1')
    const view2 = new TextView('test 2')
    const view3 = new TextView('test 3')

    listView.append(view1)
    listView.append(view3)
    listView.insert(view2, view3)

    expect(listView.length).toBe(3)
    expect(listView.first).toBe(view1)
    expect(listView.last).toBe(view3)
  })

  it('应该能够移动视图', () => {
    const view1 = new TextView('test 1')
    const view2 = new TextView('test 2')
    const view3 = new TextView('test 3')

    listView.append(view1)
    listView.append(view2)
    listView.append(view3)

    // 移动 view3 到 view1 之前
    listView.move(view3, view1)

    expect(listView.length).toBe(3)
    expect(listView.first).toBe(view3)
    expect(listView.last).toBe(view2)
  })

  it('应该能够移除视图', () => {
    const view1 = new TextView('test 1')
    const view2 = new TextView('test 2')

    listView.append(view1)
    listView.append(view2)
    listView.remove(view1)

    expect(listView.length).toBe(1)
    expect(listView.first).toBe(view2)
    expect(listView.last).toBe(view2)
  })

  it('应该能够遍历子视图', () => {
    const view1 = new TextView('test 1')
    const view2 = new TextView('test 2')

    listView.append(view1)
    listView.append(view2)

    const children = Array.from(listView.children)
    expect(children.length).toBe(2)
    expect(children[0]).toBe(view1)
    expect(children[1]).toBe(view2)
  })

  it('应该能够初始化、挂载和销毁', () => {
    const view = new TextView('test')
    listView.append(view)

    expect(() => {
      listView.init()
    }).not.toThrow()

    expect(() => {
      listView.mount(container)
    }).not.toThrow()

    expect(() => {
      listView.dispose()
    }).not.toThrow()
  })

  it('应该能够激活和停用', () => {
    const view = new TextView('test')
    listView.append(view)
    listView.init()
    listView.mount(container)

    expect(() => {
      listView.deactivate()
    }).not.toThrow()

    expect(() => {
      listView.activate()
    }).not.toThrow()
  })

  it('当子视图不是 View 类型时应该抛出错误', () => {
    expect(() => {
      listView.append(123 as any)
    }).toThrow()
  })

  it('当锚点不是列表的子视图时应该抛出错误', () => {
    const view1 = new TextView('test 1')
    const view2 = new TextView('test 2')
    const view3 = new TextView('test 3')

    listView.append(view1)
    listView.append(view2)

    expect(() => {
      listView.insert(view3, view3) // view3 不是列表的子视图
    }).toThrow()
  })
})
