import { reactive, readonly } from '../../src/index.js'

const data = reactive({
  a: 1,
  b: {
    c: 2
  }
})
const readonlyData = readonly(data)
