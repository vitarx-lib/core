import { AsyncLocalStorage } from 'async_hooks'

export class Scope {
  private static scopeStorage = new AsyncLocalStorage<Scope>()

  constructor(public name: string) {}

  /**
   * 获取当前作用域
   */
  static getCurrentScope(): Scope | undefined {
    return this.scopeStorage.getStore()
  }

  /**
   * 运行同步函数
   */
  run<T>(fn: () => T): T {
    return Scope.scopeStorage.run(this, () => {
      return fn()
    })
  }

  /**
   * 运行异步函数
   */
  async runAsync<T>(fn: () => Promise<T>): Promise<T> {
    return Scope.scopeStorage.run(this, () => {
      return fn()
    })
  }
}

// 测试代码
async function testNodeAsyncContext() {
  const scope1 = new Scope('scope1')
  const scope2 = new Scope('scope2')

  scope1.runAsync(async () => {
    await new Promise(resolve => setTimeout(resolve, 200))
    console.log('fn1', Scope.getCurrentScope()?.name) // 输出fn1 scope1
  })
  scope1.run(() => {
    console.log('fn1-', Scope.getCurrentScope()?.name) // 输出fn1 scope1
  })
  scope2.runAsync(async () => {
    await new Promise(resolve => setTimeout(resolve, 100))
    console.log('fn2', Scope.getCurrentScope()?.name) // 输出fn2 scope2
  })
}

testNodeAsyncContext()
