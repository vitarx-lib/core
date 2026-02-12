;(globalThis as any).__DEV__ = false
import { ref, watch } from '../../src/index.js'

const arr = ref([1, 2, 3])

watch(arr.value, (newValue, oldValue) => {
  console.log(newValue, oldValue)
})
arr.value.reverse()
