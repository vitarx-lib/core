import { h } from '@vitarx/runtime-core'
import { describe, expect, it } from 'vitest'
import { createSSRApp, SSRApp } from '../../src/index.js'
import { createContainer } from '../helpers.js'

describe('SSRApp 服务端渲染应用', () => {
  it('应该创建SSRApp实例', () => {
    const App = () => h('div', null, 'Hello, World!')
    const app = createSSRApp(App)

    expect(app).toBeInstanceOf(SSRApp)
  })

  it('当容器有内容时应该进行水合挂载', async () => {
    const App = () => h('div', { id: 'content' }, 'Test Content')
    const app = createSSRApp(App)
    const container = createContainer('<div id="content">Test Content</div>')
    // 水合应该复用现有DOM
    app.mount(container)
    expect(container.querySelector('#content')).toBeTruthy()
    expect(container.querySelector('#content')?.textContent).toBe('Test Content')
  })

  it('当容器为空时应该正常挂载', async () => {
    const App = () => h('div', { id: 'test' }, 'New Content')
    const app = createSSRApp(App)
    const container = createContainer()

    await app.hydrate(container)

    expect(container.querySelector('#test')).toBeTruthy()
  })

  it('应该处理选择器字符串挂载', () => {
    const App = () => h('div', null, 'Content')
    const app = createSSRApp(App)
    createContainer()

    app.mount('#app')

    const container = document.querySelector('#app')
    expect(container).toBeTruthy()
  })

  it('如果找不到容器应该抛出错误', () => {
    const App = () => h('div', null, 'Content')
    const app = createSSRApp(App)
    expect(() => app.mount('#nonexistent')).toThrow()
  })
})
