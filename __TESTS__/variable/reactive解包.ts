import { reactive, ref } from '../../src/index.js'

const books = reactive([ref(0)])
// 不会解构
console.log(books[0])

books[0] = 1
console.log(books[0])

const map = reactive(new Map([['count', ref(0)]]))
// 这里需要 .value
console.log(map.get('count')!.value)

const set = reactive(new Set([[ref(0)]]))
// 不会解构
console.log(set.values())

const data = reactive(
  {
    count: ref(0)
  },
  false
)

// 浅层代理不会解构
console.log(data.count)
