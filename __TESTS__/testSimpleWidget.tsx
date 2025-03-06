import { createVNode, defineProps, simple } from '../src/index.js'

interface Props {
  name: string
  age?: '1' | '2' | '3'
}

const Simple = simple((p: { age: string }) => {
  return <div>{p.age}</div>
})

function Test(_props: Props) {
  const props = defineProps({ age: '1' }, _props)
  const age = props.age
  return createVNode(Simple, { age })
}

createVNode(Test)
