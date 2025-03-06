import { isPromise } from 'node:util/types'
import { sleep } from '../src/index.js'

export class Scope {
  static current: Scope | undefined

  constructor(public name: string) {}

  /**
   * 获取当前作用域
   */
  static getCurrentScope(): Scope | undefined {
    return this.current
  }

  /**
   * 运行同步函数
   */
  run<T>(fn: () => T): T {
    const old = Scope.getCurrentScope()
    Scope.current = this
    try {
      return fn()
    } finally {
      Scope.current = old
    }
  }
}

// 测试代码
async function test() {
  const scope1 = new Scope('scope1')
  const scope2 = new Scope('scope2')
  const withContext = async (fn: () => any) => {
    const current = Scope.getCurrentScope()
    const result = fn()
    if (isPromise(result)) {
      Scope.current = undefined
      try {
        return await result
      } finally {
        Scope.current = current
      }
    } else {
      return result
    }
  }
  scope1.run(async () => {
    await withContext(() => sleep(200))
    console.log('fn1', Scope.getCurrentScope()?.name) // 输出fn1 scope1
  })
  scope1.run(() => {
    console.log('fn1-', Scope.getCurrentScope()?.name) // 输出fn1 scope1
  })
  scope2.run(async () => {
    await withContext(() => sleep(100))
    console.log('fn2', Scope.getCurrentScope()?.name) // 输出fn2 scope2
  })
}

test()
