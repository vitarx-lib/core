;(globalThis as any).__DEV__ = false
import * as process from 'node:process'
import { ref, runEffect, ValueRef } from '../../src/index.js'

// ====================== 配置 ======================
const SIGNAL_COUNT = 10_000
const UPDATE_ROUNDS = 100
let triggerCount = 0

// ====================== 工具 ======================
function mem(label: string) {
  const m = process.memoryUsage()
  console.log(
    `${label} | heap ${(m.heapUsed / 1024 / 1024).toFixed(2)} MB | rss ${(m.rss / 1024 / 1024).toFixed(2)} MB`
  )
}

function gc(label: string) {
  if (global.gc) {
    global.gc()
    mem(label + ' (after gc)')
  }
}

// ====================== Benchmark ======================
async function run() {
  console.log(`\n===== ${SIGNAL_COUNT} signals benchmark (runEffect track:once) =====`)
  mem('start')

  // ---------- 1. create ----------
  console.time('create signals')
  const signals: ValueRef<number>[] = new Array(SIGNAL_COUNT)
  for (let i = 0; i < SIGNAL_COUNT; i++) {
    signals[i] = ref(i)
  }
  console.timeEnd('create signals')
  mem('after create')

  // ---------- 2. attach effects ----------
  console.time('attach effects')
  const stops: (() => void)[] = new Array(SIGNAL_COUNT)

  for (let i = 0; i < SIGNAL_COUNT; i++) {
    const stop = runEffect(
      () => {
        // 依赖收集（一次）
        signals[i].value
        triggerCount++
      },
      { flush: 'sync' }
    )

    if (stop) {
      stops[i] = stop
    } else {
      // 没有依赖的情况，给个空函数保持结构一致
      stops[i] = () => {}
    }
  }

  console.timeEnd('attach effects')
  mem('after attach')

  // ---------- 3. single update ----------
  triggerCount = 0
  console.time('single update')
  for (let i = 0; i < SIGNAL_COUNT; i++) {
    signals[i].value++
  }
  console.timeEnd('single update')
  console.log('trigger count:', triggerCount)

  // ---------- 4. hot update ----------
  triggerCount = 0
  console.time(`hot update x${UPDATE_ROUNDS}`)
  for (let r = 0; r < UPDATE_ROUNDS; r++) {
    for (let i = 0; i < SIGNAL_COUNT; i++) {
      signals[i].value++
    }
  }
  console.timeEnd(`hot update x${UPDATE_ROUNDS}`)
  console.log('trigger count:', triggerCount)
  mem('after hot update')

  // ---------- 5. detach ----------
  console.time('detach effects')
  for (let i = 0; i < SIGNAL_COUNT; i++) {
    stops[i]()
  }
  console.timeEnd('detach effects')
  mem('after detach')

  // ---------- 6. gc ----------
  gc('final')

  console.log('===== done =====')
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
