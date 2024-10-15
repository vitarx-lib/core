class Widget<PROPS extends Record<string, any>> {
  status?: boolean
  #props: PROPS
  private test?: boolean

  constructor(props: PROPS) {
    this.#props = props
  }

  protected setState(state: Partial<Widget<PROPS>>) {}
}
