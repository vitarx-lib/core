class TestObject {
  #name = 1
  get name() {
    return this.#name
  }

  test() {
    return this.#name
  }
}

const proxy = new Proxy(new TestObject(), {
  get(target, prop, receiver) {
    console.log(prop)
    return Reflect.get(target, prop, receiver)
  }
})
console.log(proxy.test())
