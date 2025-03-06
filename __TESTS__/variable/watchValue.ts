import { reactive, watch, watchValue } from '../../src/index.js'

const data = reactive({
  name: 'vitarx',
  age: {
    a: 1
  },
  arr: [1, 2, 3]
})
watchValue(data, (newValue, oldValue) => {
  console.log('监听到data变化', newValue, oldValue)
})
const data2 = reactive([1, 2, 3])
watch(
  () => data.age,
  (newValue, oldValue) => {
    console.log('监听到data.age变化', newValue, oldValue)
  }
)
data.name = 'vitarx2'
data.age.a = 2

watch(data.arr, (p, o) => {
  console.log('监听到data.arr变化', p, o)
})

data.arr.push(4)
