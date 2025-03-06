import { computed, ref, watch } from '../../src/index.js'

const { memoryUsage } = process

const data = ref(1)
const startMemory = memoryUsage()
console.log('Before execution:', startMemory) // 查看执行前的内存使用情况

console.time('executionTime')

const max = 1000
let changeCount = 0
for (let i = 0; i < max; i++) {
  const c = computed(() => data.value + 100)
  // 读取计算属性，让计算属性初始化
  const d = c.value
  watch(c, () => {
    changeCount++
    if (changeCount === max) {
      const endMemory = memoryUsage()
      console.log(`所有监听器回调都已触发,共计触发次数${max}`)
      console.timeEnd('executionTime')
      // 算出rss总内存增量，MB单位
      const memoryIncrement = (endMemory.rss - startMemory.rss) / 1024 / 1024
      console.log(`内存增量为${memoryIncrement.toFixed(2)} MB`)
      console.log('After execution:', endMemory)
    }
  })
}
// 修改响应式变量
data.value++
