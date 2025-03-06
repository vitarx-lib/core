import { computed, ref, watch } from '../../src/core'

const data = ref(0)
const computedData = computed(() => data.value + 1)
watch(
  () => computedData.value,
  (newValue, oldValue) => {
    console.log('computedData change', newValue, oldValue)
  }
)
data.value++
data.value++
data.value++
data.value++
