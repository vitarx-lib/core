import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createComponentView,
  onBeforeMount,
  onDispose,
  onHide,
  onInit,
  onMounted,
  onShow,
  ViewKind
} from '../../../src/index.js'
import {
  CommentView,
  ComponentInstance,
  ComponentView
} from '../../../src/view/implements/index.js'

describe('ComponentView', () => {
  // 创建一个简单的组件用于测试
  function TestComponent(props: any) {
    return props.text
  }
  TestComponent.defaultProps = {
    text: 'default text'
  }
  TestComponent.validateProps = (props: any) => {
    if (!props.text) {
      return 'text prop is required'
    }
    return true
  }

  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  it('应该创建一个 ComponentView 实例', () => {
    const componentView = new ComponentView(TestComponent, { text: 'test' })

    expect(componentView).toBeInstanceOf(ComponentView)
    expect(componentView.kind).toBe(ViewKind.COMPONENT)
    expect(componentView.props).toEqual({ text: 'test' })
  })

  it('应该使用默认属性', () => {
    const componentView = new ComponentView(TestComponent, null)

    expect(componentView.props).toEqual({ text: 'default text' })
  })

  it('应该接受 location 参数', () => {
    const location = { fileName: 'test.ts', lineNumber: 1, columnNumber: 1 }
    const componentView = new ComponentView(TestComponent, { text: 'test' }, location)

    expect(componentView.location).toBe(location)
  })

  it('应该能够获取组件名称', () => {
    const componentView = new ComponentView(TestComponent, { text: 'test' })

    expect(componentView.name).toBe('TestComponent')
  })

  it('当组件没有名称时应该使用 anonymous', () => {
    const anonymousComponent = function (props: any) {
      return 'anonymous'
    }
    Object.defineProperty(anonymousComponent, 'name', { value: undefined, writable: true })
    const componentView = new ComponentView(anonymousComponent, {})

    expect(componentView.name).toBe('anonymous')
  })

  it('应该能够获取 hostNode', () => {
    const componentView = new ComponentView(TestComponent, { text: 'test' })
    componentView.init()

    expect(componentView.subView).toBeTruthy()
  })

  it('应该能够初始化、挂载和销毁', () => {
    const componentView = new ComponentView(TestComponent, { text: 'test' })

    expect(() => {
      componentView.init()
    }).not.toThrow()

    expect(() => {
      componentView.mount(container)
    }).not.toThrow()

    expect(() => {
      componentView.dispose()
    }).not.toThrow()
  })

  it('应该能够激活和停用', () => {
    const componentView = new ComponentView(TestComponent, { text: 'test' })
    componentView.mount(container)

    expect(() => {
      componentView.deactivate()
    }).not.toThrow()

    expect(() => {
      componentView.activate()
    }).not.toThrow()
  })

  describe('错误处理', () => {
    it('当 validateProps 返回 false 时应该记录错误', () => {
      function errorComponent(props: any) {
        return 'error'
      }
      errorComponent.validateProps = () => false

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const componentView = new ComponentView(errorComponent, {})

      expect(errorSpy).toHaveBeenCalled()
      errorSpy.mockRestore()
    })

    it('当 validateProps 返回字符串时应该记录警告', () => {
      function warningComponent(props: any) {
        return 'warning'
      }
      warningComponent.validateProps = () => 'warning message'

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const componentView = new ComponentView(warningComponent, {})

      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })
  })
})

describe('ComponentInstance', () => {
  // 创建一个简单的组件用于测试
  function TestComponent(props: any) {
    return props.text
  }

  let componentView: ComponentView
  let container: HTMLElement

  beforeEach(() => {
    componentView = new ComponentView(TestComponent, { text: 'test' })
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  it('应该创建一个 ComponentInstance 实例', () => {
    componentView.init()
    const instance = componentView.instance

    expect(instance).toBeInstanceOf(ComponentInstance)
    expect(instance!.view).toBe(componentView)
  })

  it('应该能够初始化', () => {
    componentView.init()
    const instance = componentView.instance

    expect(() => {
      instance?.init()
    }).not.toThrow()
  })

  it('应该能够执行生命周期钩子', () => {
    const mockInit = vi.fn()
    const mockShow = vi.fn()
    const mockHide = vi.fn()
    const mockBeforeMount = vi.fn()
    const mockDispose = vi.fn()
    const mockMounted = vi.fn()
    const testLifecycle = () => {
      onInit(mockInit)
      onBeforeMount(mockBeforeMount)
      onMounted(mockMounted)
      onShow(mockShow)
      onHide(mockHide)
      onDispose(mockDispose)
      return null
    }
    const view = createComponentView(testLifecycle)
    view.init()
    expect(mockInit).toHaveBeenCalled()
    view.mount(container)
    expect(mockBeforeMount).toHaveBeenCalled()
    expect(mockMounted).toHaveBeenCalled()
    expect(mockShow).toHaveBeenCalled()
    view.dispose()
    expect(mockHide).toHaveBeenCalled()
    expect(mockDispose).toHaveBeenCalled()
  })

  it('应该能够显示和隐藏', () => {
    componentView.init()
    const instance = componentView.instance

    expect(() => {
      instance?.show()
    }).not.toThrow()

    expect(() => {
      instance?.hide()
    }).not.toThrow()
  })

  it('应该能够报告错误', () => {
    componentView.init()
    const instance = componentView.instance

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      instance?.reportError(new Error('test error'), 'test' as any)
    }).not.toThrow()

    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('应该能够规范化视图', () => {
    componentView.init()
    const instance = componentView.instance

    // 测试私有方法，实际项目中不推荐这样做
    const normalizeView = (instance as any).normalizeView.bind(instance)

    // 测试 null
    const nullView = normalizeView(null)
    expect(nullView).toBeInstanceOf(CommentView)

    // 测试字符串
    const stringView = normalizeView('test')
    expect(stringView).toBeTruthy()
  })
})
