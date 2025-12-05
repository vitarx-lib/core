# ref 与 reactive 的选择

<cite>
**本文档引用的文件**  
- [ref.ts](file://packages/responsive/src/signal/ref/ref.ts)
- [proxy-handler.ts](file://packages/responsive/src/signal/reactive/proxy-handler.ts)
- [helpers.ts](file://packages/responsive/src/signal/ref/helpers.ts)
- [types/ref.ts](file://packages/responsive/src/signal/types/ref.ts)
- [types/proxy.ts](file://packages/responsive/src/signal/types/proxy.ts)
- [constants.ts](file://packages/responsive/src/signal/constants.ts)
- [children.test.ts](file://packages/runtime-core/__tests__/vnode/normalizer/children.test.ts)
- [reactive.test.ts](file://packages/responsive/__tests__/signal/reactive.test.ts)
</cite>

## 目录
1. [引言](#引言)
2. [ref 的实现与使用场景](#ref-的实现与使用场景)
3. [reactive 的实现与使用场景](#reactive-的实现与使用场景)
4. [ref 与 reactive 的技术差异](#ref-与-reactive-的技术差异)
5. [性能对比与选择建议](#性能对比与选择建议)
6. [常见误用模式与调试建议](#常见误用模式与调试建议)

## 引言
在 Vitarx 框架中，`ref` 和 `reactive` 是实现响应式系统的核心机制。两者都用于创建响应式数据，但其设计目标、实现方式和适用场景存在显著差异。`ref` 通过 `.value` 包装基本类型和对象类型，适用于需要替换根引用的场景；而 `reactive` 基于 Proxy 实现深层响应式代理，更适合处理对象类型且频繁修改属性的场景。本文档将深入分析两者的实现原理、技术差异、性能特点，并提供实际代码示例来指导开发者在不同场景下做出正确的选择。

## ref 的实现与使用场景

`ref` 在 Vitarx 框架中通过 `Ref` 类实现，其核心是通过 `.value` 属性来包装和访问响应式数据。`Ref` 类实现了 `RefSignal` 接口，该接口定义了 `value` 属性的 getter 和 setter，确保对值的访问和修改能够触发依赖追踪和更新通知。

当 `ref` 被创建时，它会根据配置决定是否对对象类型进行深度代理。如果 `deep` 配置为 `true`（默认值），并且值是对象类型，`ref` 会使用 `reactive` 函数创建一个响应式代理，并将其存储在 `_reactiveValue` 属性中。这种设计使得 `ref` 既能处理基本类型，也能处理复杂对象，同时保持了 API 的一致性。

`ref` 特别适用于需要替换整个引用的场景，例如计数器、布尔标志或动态切换的数据源。由于 `ref` 对象本身是响应式的，重新赋值 `ref.value` 会触发所有依赖于该 `ref` 的副作用函数重新执行。

**Section sources**
- [ref.ts](file://packages/responsive/src/signal/ref/ref.ts#L70-L287)
- [types/ref.ts](file://packages/responsive/src/signal/types/ref.ts#L10-L22)

## reactive 的实现与使用场景

`reactive` 在 Vitarx 框架中基于 ES6 的 `Proxy` 实现，用于创建深层响应式代理对象。其核心是 `ReactiveProxyHandler` 类，该类实现了 `ProxyHandler` 接口，通过拦截对象的 `get`、`set`、`deleteProperty` 等操作来实现响应式追踪。

`ReactiveProxyHandler` 在 `get` 拦截器中，当访问对象的属性时，会检查该属性值是否为对象类型。如果是，则会惰性地创建一个子代理，并建立父子代理之间的关系，从而实现深层响应式。这种惰性代理机制避免了在创建代理时对整个对象树进行递归处理，提高了性能。

`reactive` 最适合处理复杂的对象类型，尤其是当对象的深层属性需要频繁修改时。由于 `reactive` 返回的是一个代理对象，直接修改其属性会自动触发更新，无需通过 `.value` 访问，代码更加简洁直观。

**Section sources**
- [proxy-handler.ts](file://packages/responsive/src/signal/reactive/proxy-handler.ts#L83-L300)
- [helpers.ts](file://packages/responsive/src/signal/reactive/helpers.ts#L35-L43)

## ref 与 reactive 的技术差异

`ref` 和 `reactive` 在技术实现和行为上存在几个关键差异：

1.  **访问方式**：`ref` 必须通过 `.value` 属性来访问和修改其内部值，而 `reactive` 直接通过属性访问，语法更自然。
2.  **解包机制**：在模板中，`ref` 会被自动解包。这意味着当 `ref` 作为子节点或属性值传递给 VNode 时，其 `.value` 会被自动提取。这在 `children.test.ts` 的测试用例中得到了验证，`ref('Ref Text')` 会被解包为 `'Ref Text'`。而 `reactive` 对象在解构时会丢失响应性，因为解构操作会创建新的普通变量，与原始代理对象的连接被切断。
3.  **类型推导**：`ref` 的类型推导相对简单，`ref<T>` 的类型就是 `Ref<T>`。`reactive` 的类型推导则更复杂，它会递归地将对象中所有 `RefSignal` 类型的属性解包，这在 `UnwrapNestedRefs` 类型中有所体现。
4.  **重新赋值**：`ref` 可以安全地重新赋值，例如 `count.value = 5`。而 `reactive` 对象本身不能被重新赋值，只能修改其内部属性。

**Section sources**
- [ref.ts](file://packages/responsive/src/signal/ref/ref.ts#L136-L147)
- [proxy-handler.ts](file://packages/responsive/src/signal/reactive/proxy-handler.ts#L171-L214)
- [helpers.ts](file://packages/responsive/src/signal/ref/helpers.ts#L38-L40)
- [children.test.ts](file://packages/runtime-core/__tests__/vnode/normalizer/children.test.ts#L118-L125)
- [reactive.test.ts](file://packages/responsive/__tests__/signal/reactive.test.ts#L126-L139)

## 性能对比与选择建议

`ref` 和 `reactive` 在性能上各有优劣：

*   **ref**：由于每次访问 `.value` 都需要经过 getter/setter，存在额外的访问开销。然而，这种开销通常可以忽略不计。`ref` 的主要优势在于灵活性，它适用于所有类型的数据，并且在需要替换整个引用时非常方便。
*   **reactive**：基于 `Proxy` 的实现，对于对象属性的访问和修改性能更优，因为它直接拦截了底层操作。但是，`reactive` 的限制较多，不能重新赋值，并且在解构时会丢失响应性。

**选择建议**：
*   优先使用 `ref` 的场景：计数器 (`const count = ref(0)`)、布尔标志 (`const loading = ref(false)`)、需要动态替换整个对象的场景。
*   优先使用 `reactive` 的场景：复杂的用户信息对象 (`const user = reactive({ name: 'John', profile: { age: 25 } })`)、表单数据对象、任何需要频繁修改深层属性的对象。

```mermaid
flowchart TD
A[选择 ref 还是 reactive] --> B{数据类型}
B --> |基本类型<br/>或需要替换根引用| C[使用 ref]
B --> |复杂对象<br/>且频繁修改属性| D[使用 reactive]
C --> E[语法: const x = ref(value)]
C --> F[访问: x.value]
D --> G[语法: const obj = reactive({})]
D --> H[访问: obj.property]
```

**Diagram sources**
- [ref.ts](file://packages/responsive/src/signal/ref/ref.ts)
- [proxy-handler.ts](file://packages/responsive/src/signal/reactive/proxy-handler.ts)

## 常见误用模式与调试建议

开发者在使用 `ref` 和 `reactive` 时容易陷入一些常见误区：

1.  **忘记 `.value`**：在 JavaScript/TypeScript 中访问 `ref` 时，必须使用 `.value`，否则操作的是 `Ref` 实例本身而非其内部值。
2.  **解构 `reactive` 对象**：直接解构 `reactive` 对象会破坏响应性。应使用 `toRefs` 函数将 `reactive` 对象的每个属性转换为 `ref`，然后再进行解构。
3.  **将 `ref` 赋值给 `reactive` 对象的属性**：虽然框架会自动解包 `ref`，但应避免这种混淆。直接将 `ref` 的 `.value` 赋值给 `reactive` 对象的属性，或确保理解其自动解包的行为。

调试建议：
*   利用框架提供的 `isRef` 和 `isReactive` 工具函数来检查变量类型。
*   使用 `toRaw` 函数获取响应式对象的原始值，用于调试或与不支持 Proxy 的库交互。
*   在开发环境中，框架可能会发出警告，例如在不支持 `ref` 的节点类型上使用 `ref` 属性时，应关注这些警告信息。

**Section sources**
- [helpers.ts](file://packages/responsive/src/signal/ref/helpers.ts#L141-L164)
- [helpers.ts](file://packages/responsive/src/signal/reactive/helpers.ts#L81-L83)
- [utils/conversion.ts](file://packages/responsive/src/signal/utils/conversion.ts#L43-L48)
- [base.test.ts](file://packages/runtime-core/__tests__/vnode/creator/base.test.ts#L96-L110)