;(globalThis as any).__VITARX_DEV__ = false
import * as process from 'node:process'
import { ref, ValueRef, watch } from '../../src/index.js'

// ====================== 配置 ======================
const SIGNAL_COUNT = 10_000
const UPDATE_ROUNDS = 100 // 热更新轮数
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
  console.log(`\n===== ${SIGNAL_COUNT} signals benchmark =====`)
  mem('start')

  // ---------- 1. create ----------
  console.time('create signals')
  const signals: ValueRef<number>[] = new Array(SIGNAL_COUNT)
  for (let i = 0; i < SIGNAL_COUNT; i++) {
    signals[i] = ref(i)
  }
  console.timeEnd('create signals')
  mem('after create')

  // ---------- 2. watch ----------
  console.time('attach watchers')
  const stops: (() => void)[] = new Array(SIGNAL_COUNT)

  const cb = () => {
    triggerCount++
  }

  for (let i = 0; i < SIGNAL_COUNT; i++) {
    const watcher = watch(() => signals[i].value, cb, { flush: 'sync' })
    stops[i] = watcher.dispose.bind(watcher)
  }
  console.timeEnd('attach watchers')
  mem('after watch')

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
  console.time('detach watchers')
  for (let i = 0; i < SIGNAL_COUNT; i++) {
    stops[i]()
  }
  console.timeEnd('detach watchers')
  mem('after detach')

  // ---------- 6. gc ----------
  gc('final')

  console.log('===== done =====')
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
