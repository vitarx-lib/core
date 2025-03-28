# @vitarx/utils

Vitarx 共享工具库，提供常用工具函数和类型定义。

## 功能模块

### 1. 深拷贝 (deepClone)
- 支持处理循环引用
- 支持内置对象(Date, RegExp, Set, Map等)的克隆
- 支持普通对象和数组的深度克隆

### 2. 类型检测 (detect)
- 提供多种类型检测函数：isObject, isArray, isString, isNumber 等
- 支持检测集合类型：isMap, isSet, isWeakMap, isWeakSet
- 支持检测函数类型：isFunction, isAsyncFunction, isConstructor 等

### 3. 常用工具函数 (quick)
- **sleep**: 异步延迟函数
- **popProperty**: 弹出对象属性
- **deepMergeObject**: 深度合并对象
- **debounce**: 防抖函数
- **throttle**: 节流函数
- **microTaskDebouncedCallback**: 微队列防抖回调函数

## 安装

```bash
npm install @vitarx/utils
```

## 使用示例

```javascript
import { deepClone, isObject, sleep } from '@vitarx/utils';

// 深拷贝示例
const obj = { a: 1, b: { c: 2 } };
const cloned = deepClone(obj);

// 类型检测示例
console.log(isObject({})); // true

// 延迟函数示例
await sleep(1000); // 延迟1秒
```

## 许可证

[MIT](LICENSE)
