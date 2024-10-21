export default abstract class LifeCycle {
  /**
   * 组件被创建时触发
   */
  onCreated?(): void

  /**
   * 当组件已经成功挂载到dom树上后调用
   *
   * 用途：异步加载数据，例如：
   *
   * ```ts
   * fetchData() {
   *   fetch('url').then(data => {
   *     // 更新状态
   *     this.setState({ data })
   *     // 直接赋值的方式更新状态
   *     this.setState(()=>{
   *        this.data = data
   *     })
   *   })
   * }
   * onMounted() {
   *   // 从服务端拉取数据
   *   this.fetchData()
   * }
   * ```
   */
  onMounted?(): any

  /**
   * 组件被临时移除时调用。
   */
  onDeactivate?(): any

  /**
   * 组件被临时移除后又恢复时触发
   */
  onActivated?(): any

  /**
   * 当组件将要被销毁时调用
   *
   * 用途：停止监听事件，清理定时器等
   */
  onDestroy?(): any

  /**
   * 子组件抛出异常时触发，可以返回一个`Vitarx.VNode`做为异常组件显示
   *
   * @param {Error} error 错误对象
   */
  onError?(error: Error): Vitarx.VNode | void
}
