# CSS 样式与类名管理

<cite>
**本文档引用的文件**
- [style.ts](file://packages/runtime-core/src/utils/style.ts)
- [DomRenderer.ts](file://packages/runtime-dom/src/DomRenderer.ts)
- [renderer.ts](file://packages/runtime-core/src/types/renderer.ts)
- [props.ts](file://packages/runtime-core/src/types/props.ts)
- [attributes.ts](file://packages/runtime-dom/src/types/attributes.ts)
</cite>

## 目录
1. [简介](#简介)
2. [样式属性管理](#样式属性管理)
3. [类名管理](#类名管理)
4. [StyleUtils 工具类](#styleutils-工具类)
5. [渲染流程中的样式更新](#渲染流程中的样式更新)
6. [类型系统支持](#类型系统支持)

## 简介
Vitarx 框架提供了一套完整的 CSS 样式和类名管理机制，通过统一的 API 接口实现对 DOM 元素样式的高效操作。框架在 `runtime-dom` 包中实现了 `DomRenderer` 类，该类实现了 `HostRenderer` 接口，提供了对样式和类名的增删改查操作。这些操作通过 `StyleUtils` 工具类进行辅助，实现了对不同格式的样式和类名输入的统一处理。

**Section sources**
- [DomRenderer.ts](file://packages/runtime-dom/src/DomRenderer.ts#L1-L568)
- [renderer.ts](file://packages/runtime-core/src/types/renderer.ts#L1-L286)

## 样式属性管理
Vitarx 框架提供了多种方法来管理元素的样式属性，包括 `setStyle`、`addStyle` 和 `removeStyle` 方法。这些方法通过 `DomRenderer` 类实现，确保了样式操作的高效性和一致性。

### setStyle 方法
`setStyle` 方法用于批量设置元素的样式属性。该方法接收一个样式对象作为参数，将对象转换为 CSS 文本后更新元素的 `style.cssText` 属性。在更新前会进行比较，只有当新旧样式不同时才会执行更新操作，避免不必要的 DOM 操作。

```mermaid
flowchart TD
Start([setStyle 方法调用]) --> Convert["将样式对象转换为 CSS 文本"]
Convert --> Compare["比较新旧 CSS 文本"]
Compare --> |不同| Update["更新 style.cssText"]
Compare --> |相同| Skip["跳过更新"]
Update --> CheckEmpty["检查是否有有效样式"]
CheckEmpty --> |无样式| Remove["移除 style 属性"]
CheckEmpty --> |有样式| End([方法结束])
Skip --> End
```

**Diagram sources**
- [DomRenderer.ts](file://packages/runtime-dom/src/DomRenderer.ts#L239-L246)

### addStyle 和 removeStyle 方法
`addStyle` 方法用于添加单个样式属性，直接调用 DOM 元素的 `style.setProperty` 方法。`removeStyle` 方法用于移除单个样式属性，调用 `style.removeProperty` 方法，并在样式为空时自动移除 `style` 属性。

```mermaid
flowchart TD
AddStart([addStyle 方法调用]) --> SetProperty["调用 style.setProperty"]
SetProperty --> End1([方法结束])
RemoveStart([removeStyle 方法调用]) --> RemoveProperty["调用 style.removeProperty"]
RemoveProperty --> CheckLength["检查 style.length"]
CheckLength --> |为0| RemoveAttribute["移除 style 属性"]
CheckLength --> |不为0| End2([方法结束])
RemoveAttribute --> End2
```

**Diagram sources**
- [DomRenderer.ts](file://packages/runtime-dom/src/DomRenderer.ts#L180-L189)

**Section sources**
- [DomRenderer.ts](file://packages/runtime-dom/src/DomRenderer.ts#L180-L250)
- [renderer.ts](file://packages/runtime-core/src/types/renderer.ts#L154-L167)

## 类名管理
Vitarx 框架提供了 `setClass`、`addClass` 和 `removeClass` 方法来管理元素的类名。这些方法通过与 `classList` 交互，实现了对类名的灵活操作。

### setClass 方法
`setClass` 方法用于设置元素的类名。该方法接收一个字符串数组作为参数，通过 `StyleUtils.cssClassValueToString` 方法将数组转换为字符串后设置到 `class` 属性。在设置前会进行比较，只有当新旧类名不同时才会执行更新操作。

```mermaid
flowchart TD
SetClassStart([setClass 方法调用]) --> ConvertToString["将类名数组转换为字符串"]
ConvertToString --> CompareClass["比较新旧类名"]
CompareClass --> |不同| SetAttribute["设置 class 属性"]
CompareClass --> |相同| SkipSet["跳过设置"]
SetAttribute --> CheckListLength["检查 classList.length"]
CheckListLength --> |为0| RemoveClassAttribute["移除 class 属性"]
CheckListLength --> |不为0| End3([方法结束])
SkipSet --> End3
RemoveClassAttribute --> End3
```

**Diagram sources**
- [DomRenderer.ts](file://packages/runtime-dom/src/DomRenderer.ts#L197-L203)

### addClass 和 removeClass 方法
`addClass` 和 `removeClass` 方法支持处理包含空格的类名字符串。当类名字符串包含空格时，会通过 `StyleUtils.cssClassValueToArray` 方法将其分割为多个类名，然后逐个添加或移除。

```mermaid
flowchart TD
AddClassStart([addClass 方法调用]) --> CheckSpace["检查类名是否包含空格"]
CheckSpace --> |包含| SplitToArray["分割为类名数组"]
CheckSpace --> |不包含| SingleClass["单个类名"]
SplitToArray --> LoopAdd["循环添加每个类名"]
SingleClass --> AddToClassList["添加到 classList"]
LoopAdd --> AddToClassList
AddToClassList --> End4([方法结束])
RemoveClassStart([removeClass 方法调用]) --> CheckSpaceRemove["检查类名是否包含空格"]
CheckSpaceRemove --> |包含| SplitToArrayRemove["分割为类名数组"]
CheckSpaceRemove --> |不包含| SingleClassRemove["单个类名"]
SplitToArrayRemove --> LoopRemove["循环移除每个类名"]
SingleClassRemove --> RemoveFromClassList["从 classList 移除"]
LoopRemove --> RemoveFromClassList
RemoveFromClassList --> CheckListLengthRemove["检查 classList.length"]
CheckListLengthRemove --> |为0| RemoveClassAttributeRemove["移除 class 属性"]
CheckListLengthRemove --> |不为0| End5([方法结束])
RemoveClassAttributeRemove --> End5
```

**Diagram sources**
- [DomRenderer.ts](file://packages/runtime-dom/src/DomRenderer.ts#L206-L226)

**Section sources**
- [DomRenderer.ts](file://packages/runtime-dom/src/DomRenderer.ts#L197-L226)
- [renderer.ts](file://packages/runtime-core/src/types/renderer.ts#L186-L198)

## StyleUtils 工具类
`StyleUtils` 工具类是 Vitarx 框架中用于处理 CSS 样式和类名的核心工具类。该类提供了静态方法，用于在不同格式的样式和类名之间进行转换和合并。

### 样式转换方法
`StyleUtils` 提供了 `cssStyleValueToString` 和 `cssStyleValueToObject` 方法，用于在样式对象和 CSS 文本之间进行双向转换。`cssStyleValueToString` 方法会将样式对象转换为 CSS 文本，自动处理驼峰命名和 kebab-case 之间的转换。

```mermaid
classDiagram
class StyleUtils {
+mergeCssClass(c1 : ClassProperties, c2 : ClassProperties) string[]
+mergeCssStyle(style1 : StyleProperties, style2 : StyleProperties) StyleRules
+cssStyleValueToString(styleObj : StyleProperties) string
+cssStyleValueToObject(style : StyleProperties) StyleRules
+cssClassValueToArray(classInput : ClassProperties) string[]
+cssClassValueToString(classInput : ClassProperties) string
}
```

**Diagram sources**
- [style.ts](file://packages/runtime-core/src/utils/style.ts#L32-L172)

### 类名转换方法
`StyleUtils` 提供了 `cssClassValueToArray` 和 `cssClassValueToString` 方法，用于在类名的不同格式之间进行转换。这些方法支持字符串、字符串数组和对象格式的类名输入。

**Section sources**
- [style.ts](file://packages/runtime-core/src/utils/style.ts#L32-L172)
- [props.ts](file://packages/runtime-core/src/types/props.ts#L213-L237)

## 渲染流程中的样式更新
在 Vitarx 框架的渲染流程中，样式更新是通过 `setAttribute` 方法统一处理的。当设置 `style` 或 `class` 属性时，会调用相应的样式或类名管理方法。

```mermaid
flowchart TD
SetAttributeStart([setAttribute 方法调用]) --> CheckAttribute["检查属性名称"]
CheckAttribute --> |style| CallSetStyle["调用 setStyle 方法"]
CheckAttribute --> |class/className| CallSetClass["调用 setClass 方法"]
CheckAttribute --> |其他属性| DirectSet["直接设置属性"]
CallSetStyle --> End6([方法结束])
CallSetClass --> End6
DirectSet --> End6
```

**Diagram sources**
- [DomRenderer.ts](file://packages/runtime-dom/src/DomRenderer.ts#L280-L288)

**Section sources**
- [DomRenderer.ts](file://packages/runtime-dom/src/DomRenderer.ts#L253-L312)

## 类型系统支持
Vitarx 框架通过 TypeScript 类型系统为样式和类名管理提供了完整的类型支持。`StyleProperties` 类型定义了样式属性可以是字符串或 `HostStyleRules` 对象，`ClassProperties` 类型定义了类名可以是字符串、字符串数组或对象。

```mermaid
erDiagram
STYLE_PROPERTIES ||--o{ STYLE_RULES : "extends"
STYLE_PROPERTIES ||--o{ STRING : "extends"
CLASS_PROPERTIES ||--o{ STRING : "extends"
CLASS_PROPERTIES ||--o{ STRING_ARRAY : "extends"
CLASS_PROPERTIES ||--o{ CLASS_OBJECT : "extends"
class STYLE_PROPERTIES {
string | HostStyleRules
}
class STYLE_RULES {
CSS 属性键值对
}
class CLASS_PROPERTIES {
string | Array<string> | Record<string, boolean>
}
```

**Diagram sources**
- [props.ts](file://packages/runtime-core/src/types/props.ts#L190-L237)
- [attributes.ts](file://packages/runtime-dom/src/types/attributes.ts#L383-L478)

**Section sources**
- [props.ts](file://packages/runtime-core/src/types/props.ts#L190-L237)
- [attributes.ts](file://packages/runtime-dom/src/types/attributes.ts#L383-L478)