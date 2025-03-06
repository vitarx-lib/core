import { collect, ref } from '../src/index.js'

const data = ref(1)

function func() {
  data.value++
  return 10
}

console.log(collect(func).result)
