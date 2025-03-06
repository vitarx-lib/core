import { computed, ref, watchDepend } from '../../src'

const data1 = ref({ a: 1 })
const data2 = ref({ b: 1 })
const compute = computed(() => {
  return data1.value.a
})
watchDepend(function () {
  console.log('收集依赖', data1.value.a, data2.value.b)
})
data1.value.a++
data1.value.a++
data1.value.a++
data2.value.b++
data2.value.b++
