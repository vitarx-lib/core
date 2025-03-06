import { Scope, sleep, withAsyncContext } from '../src/index.js'

// 测试代码
async function test() {
  const scope1 = new Scope(true)
  const scope2 = new Scope(true)
  scope1.run(async () => {
    const r = await withAsyncContext(async () => {
      await sleep(200)
      return 'hello'
    })
    console.log(r)
    console.log('fn1', Scope.getCurrentScope() === scope1) // 输出fn1 scope1
  })
  scope1.run(() => {
    console.log('fn1-await', Scope.getCurrentScope() === scope1) // 输出fn1 scope1
  })
  scope2.run(async () => {
    await withAsyncContext(() => sleep(100))
    console.log('fn2', Scope.getCurrentScope() === scope2) // 输出fn2 scope2
  })
}

test()
