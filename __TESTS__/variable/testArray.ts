import { reactive, watchPropValue } from '../../src/index.js'

const arr = reactive([1, {}, 3])
watchPropValue(arr, '1', (newValue, oldValue) => {
  console.log('1111', newValue, oldValue)
})
arr.shift()
console.log(arr[1])
