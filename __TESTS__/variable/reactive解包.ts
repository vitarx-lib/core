import { isValueProxy, reactive, ref, shallowReadonly } from '../../src/index.js'

const books = reactive([ref(0)])
// 自动解构
console.log('数组嵌套ref是否解构,', !isValueProxy(books[0]))

const map = reactive(new Map([['count', ref(0)]]))
// 这里需要 .value
console.log('map嵌套ref是否解构', !isValueProxy(map.get('count')!))

const set = reactive(new Set([ref(0)]))

// 不会解构
console.log('set嵌套ref是否自动解构', !isValueProxy(set.values().next().value))

const data = shallowReadonly({
  count: ref(0)
})

// 浅层代理不会解构
console.log('浅层代理嵌套ref是否解构', !isValueProxy(data.count))
