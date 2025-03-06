import { Observers, reactive, watchPropsChange } from '../../src/core'

const data = reactive({ a: 1, b: 2 })
watchPropsChange(data, ['a', 'b'], (prop, origin) => {
  console.log(prop, origin)
})
Observers.registerProps(data, ['a', 'b'], (prop, origin) => {
  console.log('监听到变化', prop)
})
data.a++
data.a++
data.a++
data.b++
data.b++
data.b++
