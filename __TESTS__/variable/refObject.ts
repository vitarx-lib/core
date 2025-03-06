const map = new Map([
  [1, 2],
  [2, 3]
])
const hand = {
  get(target: any, p: string | symbol, receiver: any): any {
    if (p === 'set') {
      return Reflect.get(target, p, receiver).bind(target)
    }
    return Reflect.get(target, p) // 对其他属性使用默认行为
  }
}

class TestObject {
  map = new Proxy(map, hand)
  #name = 1

  get name() {
    return this.#name
  }
}

const refObj = new Proxy(new TestObject(), hand)
refObj.map.set(4, 5)
console.log(refObj.map === map) // 现在可以正确输出了
