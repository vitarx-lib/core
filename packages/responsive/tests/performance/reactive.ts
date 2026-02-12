;(globalThis as any).__DEV__ = true

import { reactive, watch } from '../../src'

const startMemory = process.memoryUsage()
console.time('executionTime')

const max = 100000
let changeCount = 0
for (let i = 0; i < max; i++) {
  const d = reactive({ value: 0 })
  watch(
    d,
    () => {
      changeCount++
    },
    { flush: 'sync', deep: true }
  )
  d.value++
}
console.log(`changeCount: ${changeCount}`)
console.timeEnd('executionTime')
const endMemory = process.memoryUsage()
// 算出rss总内存增量，MB单位
const memoryIncrement = (endMemory.rss - startMemory.rss) / 1024 / 1024
console.log(`内存增量为${memoryIncrement.toFixed(2)} MB`)
