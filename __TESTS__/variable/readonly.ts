import { reactive, readonly, shallowReadonly } from '../../src/index.js'

const data = reactive({
  a: 1,
  b: {
    c: 2
  }
})
const readonlyData = readonly(data)
Reflect.set(readonlyData, 'a', 2)

const readonlyData2 = readonly(data)
Reflect.set(readonlyData2.b, 'c', 3)

const readonlyData3 = shallowReadonly({
  b: {
    c: 2
  }
})
readonlyData3.b.c = 3
