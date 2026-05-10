import type { AnyProps, Component } from '@vitarx/runtime-core'

type TestPropTool<P extends AnyProps = JSX.IntrinsicElements['div']> = JSX.LibraryManagedAttributes<
  Component<P>,
  P
>

const testStyleObject: TestPropTool = {
  style: { color: 'red' }
}
void testStyleObject

const testStyleString: TestPropTool = {
  style: 'color: red'
}
void testStyleString

const testClassObject: TestPropTool = {
  class: { 'test-class': true }
}
void testClassObject

const testClassString: TestPropTool = {
  class: 'test-class'
}
void testClassString
const testClassArray: TestPropTool = {
  class: ['test-class']
}
void testClassArray
const testClassMixed: TestPropTool = {
  class: ['test-class', undefined]
}
void testClassMixed
