;(globalThis as any).__VITARX_DEV__ = true
import { computed, ref, watch } from '../../src'

const { memoryUsage } = process

const data = ref(1)
const startMemory = memoryUsage()
console.time('executionTime')

const max = 10000
let changeCount = 0
for (let i = 0; i < max; i++) {
  const c = computed(() => data.value + 100)
  watch(c, () => changeCount++)
}
// 修改响应式变量
data.value++

Promise.resolve().then(() => {
  console.log(`changeCount: ${changeCount}`)
  console.timeEnd('executionTime')
  const endMemory = memoryUsage()
  // 算出rss总内存增量，MB单位
  const memoryIncrement = (endMemory.rss - startMemory.rss) / 1024 / 1024
  console.log(`内存增量为${memoryIncrement.toFixed(2)} MB`)
})
