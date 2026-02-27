import type { RenderUnit, View } from 'vitarx'

interface IfBlockProps {
  /**
   * 子元素列表
   *
   * 所有子元素必须带有 v-if / v-else-if / v-else 指令，且组合顺序必须正确！
   */
  children: View[]
}
interface SwitchProps {
  /**
   * 默认渲染内容
   *
   * 当所有 `Match` 都不匹配时，渲染该内容
   */
  fallback?: RenderUnit
  /**
   * 子元素列表
   *
   * 必须是 `Match` 组件
   */
  children: View | View[]
}
interface MatchProps {
  /**
   * 匹配条件
   */
  when: unknown
  /**
   * 匹配成功时渲染的内容
   */
  children: RenderUnit
}
declare global {
  /**
   * IfBlock - 编译宏组件，无需import导入
   *
   * IfBlock 组件不具有运行时效果，它只是为了兼容tsx类型校验，
   * 例如 `<Comp><h1 v-if={cond} /><h2 v-else /><Comp>`，Comp组件的children要求传入单个元素时tsx类型会误报，使用 `IfBlock` 包裹则可以使 v-if 组合链通过 children 类型校验
   *
   * @example
   * ```tsx
   * import { View } from 'vitarx';
   * function TestComp(props:{children:View}) {
   *   return <div>{props.children}</div>
   * }
   * function App() {
   *   return (
   *    <TestComp>
   *       <IfBlock>
   *          <h1 v-if={cond}/>
   *          <h2 v-else/>
   *       </IfBlock>
   *    </TestComp>
   *   )
   * }
   * ```
   */
  const IfBlock: (props: IfBlockProps) => View
  /**
   * Switch - 编译宏组件，无需import导入
   *
   * Switch 组件用于条件渲染，`Match` 是其唯一合法子元素，
   * 通过 `when` 属性判断是否匹配，匹配则渲染 `Match` 子元素，否则渲染 `fallback`
   *
   * @example
   * ```tsx
   * function App() {
   *   return (
   *    <Switch fallback="Default">
   *       <Match when={a}>A</Match>
   *       <Match when={b}>B</Match>
   *    </Switch>
   *   )
   * }
   * ```
   */
  const Switch: (props: SwitchProps) => View
  /**
   * Match - 编译宏组件，无需import导入
   *
   * 需 `Switch` 组件搭配使用，不允许单独使用。
   */
  const Match: (props: MatchProps) => View
}
