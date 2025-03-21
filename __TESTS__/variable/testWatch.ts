import { reactive, watch } from '../../src/index.js'

const data = reactive({
  a: 1,
  b: 1,
  c: {
    d: 1
  }
})
watch(data, () => {
  console.log('监听到data变化')
})

data.a++
data.b++

watch(
  () => data.c,
  (newValue, oldValue) => {
    console.log('监听到data.c变化', newValue, oldValue)
  }
)

data.c.d++
