import { reactive, watchPropsChange, watchPropValue, watchValue } from '../../src/index.js'

const obj = reactive({ a: { b: { c: 2, b: 3 } }, v: 2 })
watchPropsChange(obj.a.b, ['c', 'b'], (prop, origin) => {
  console.log('监听到obj改变', prop, origin)
})
watchPropValue(obj.a.b, 'c', (newValue, oldValue) => {
  console.log('监听到C值改变', newValue, oldValue)
})

watchValue(obj, function (newValue, oldValue) {
  console.log(newValue, oldValue)
})
// obj.a.b.c++
const obj2 = reactive(obj)
watchValue(obj2, function (newValue, oldValue) {
  console.log('----', newValue, oldValue)
})
