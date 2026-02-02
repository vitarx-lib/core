import { App, render, TextView } from '../../../src/index.js'

describe('Runtime Core Shared Utils - view', () => {
  describe('render', () => {
    let container: HTMLElement

    beforeEach(() => {
      container = document.createElement('div')
      document.body.appendChild(container)
    })

    afterEach(() => {
      document.body.removeChild(container)
    })

    it('应该初始化并挂载视图到容器', () => {
      const view = new TextView('test text')
      render(view, container)

      expect(container.childNodes.length).toBe(1)
      expect(container.textContent).toBe('test text')
    })

    it('应该支持传递视图上下文', () => {
      const view = new TextView('test text')
      const mockCtx = { app: {} as App }
      render(view, container, mockCtx)

      expect(container.childNodes.length).toBe(1)
      expect(container.textContent).toBe('test text')
      expect(view.ctx).toBe(mockCtx)
      expect(view.app).toBe(mockCtx.app)
    })
  })
})
