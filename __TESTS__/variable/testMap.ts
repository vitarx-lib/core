import { reactive, watch } from '../../src/index.js'

const map = reactive(new Map<string, number>())
watch(map, (prop, origin) => {
  console.log('监听到map改变', prop)
})

map.set('str', 2)
