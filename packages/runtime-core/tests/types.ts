import { ref } from '@vitarx/responsive'
import type { AnyProps, Component } from '../src/index.js'

type TestPropTool<P extends AnyProps> = JSX.LibraryManagedAttributes<Component<P>, P>

// 测试组件默认属性是否生效
const testDefaultProps: JSX.LibraryManagedAttributes<
  {
    (props: { test: number }): JSX.Element
    defaultProps: { test: 1 }
  },
  {
    test: number
  }
> = {}
void testDefaultProps

// 测试组件 ref 属性是否生效
const testRefProps: TestPropTool<{ test: number }> = {
  test: ref(1)
}
void testRefProps

// 测试组件 v-model 属性是否生效
const testVModeProp: TestPropTool<{ modelValue: number }> = {
  'v-model': ref(1)
}
void testVModeProp
