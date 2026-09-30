import { nextTick, ref } from '@vitarx/responsive'
import { createView, dynamic, For } from '@vitarx/runtime-core'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Teleport } from '../src/index.js'

/**
 * 回归测试：`dynamic + Teleport + For` 开合累积（列表项重复）
 *
 * 复现 Modal 实现（`dynamic(() => open ? <Teleport>{children}</Teleport> : null)`）：
 * Teleport 的 children 是父组件生成的**单例子视图**（含 For）。
 * 反复开合时，Teleport 在 `onDispose` 中以 `child.dispose()` 清理单例内容；
 * 此前 ListView 等视图 `doDispose` 在 root=false 时不归零 hostNode，
 * 重开时 For 单例的旧 DOM/fragment 残留，导致列表项二次挂载（1 → 2）。
 * 修复：doDispose 无条件归零 hostNode（DOM 摘除仍保留 root 语义）。
 */
describe('dynamic + Teleport + For 开合不累积', () => {
  let container: HTMLElement
  let target: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    target = document.createElement('div')
    target.id = 'regress-target'
    document.body.appendChild(container)
    document.body.appendChild(target)
  })

  afterEach(() => {
    document.body.removeChild(container)
    document.body.removeChild(target)
    container.innerHTML = ''
    target.innerHTML = ''
  })

  it('Teleport 内容含 For，反复开合列表项不翻倍', async () => {
    const open = ref(true)
    const items = [{ id: '1', name: '内容运营' }]
    // 单例 children：For 渲染 items（模拟 Modal 内角色清单）
    const child = createView(For, {
      each: items,
      key: (item: any) => item.id,
      children: (item: any) => createView('div', { class: 'role', children: item.name })
    })
    // 模拟 Modal：dynamic(() => open ? <Teleport to="#xxx">{child}</Teleport> : null)
    const root = dynamic(() =>
      open.value ? createView(Teleport, { to: '#regress-target', children: child }) : null
    )
    root.mount(container)
    await nextTick()
    expect(target.querySelectorAll('.role').length).toBe(1)

    // 关闭 → 重开，多轮验证不累积
    for (let round = 0; round < 3; round++) {
      open.value = false
      await nextTick()
      expect(target.querySelectorAll('.role').length).toBe(0)

      open.value = true
      await nextTick()
      // 修复前此处会累积为 2、3、4……；修复后始终 1
      expect(target.querySelectorAll('.role').length).toBe(1)
    }
  })
})
