# @vitarx/utils

Vitarx 共享工具库，提供常用工具函数和类型定义。

## 功能模块

### 1. 深拷贝 (clone.ts)
- **deepClone**: 深度克隆函数，可以克隆任意类型的对象，包括循环引用
  - 支持处理循环引用
  - 支持内置对象(Date, RegExp, Set, Map等)的克隆
  - 支持普通对象和数组的深度克隆
  - 支持Symbol类型的key
  - 保持原型链

### 2. 类型检测 (detect.ts)
提供多种类型检测函数：

- **isObject**: 判断是否为对象(null值不会被识别为对象)
- **isPlainObject/isRecordObject**: 判断变量是否为记录对象
- **isArray**: 判断是否为数组对象
- **isString**: 判断是否为字符串
- **isNumber**: 判断是否为number类型
- **isBool**: 判断是否为布尔值
- **isEmpty**: 判断变量是否为空
- **isAsyncFunction**: 判断函数是否使用了async关键字声明
- **isFunction**: 判断是否为函数
- **isPureFunction**: 判断是否为纯函数，非类构造函数
- **isConstructor**: 判断是否为类构造函数
- **isSimpleGetterFunction**: 判断是否为一个简单的getter函数
- **isNumString**: 判断是否为纯数字字符串
- **isMap**: 判断是否为Map对象
- **isSet**: 判断是否为Set对象
- **isWeakMap**: 判断是否为WeakMap对象
- **isWeakSet**: 判断是否为WeakSet对象
- **isCollection**: 判断是否集合对象(不区分 Map、Set、WeakMap、WeakSet)
- **isArrayEqual**: 判断两个数组是否相等
- **isDeepEqual**: 深度比较两个变量内容是否一致
- **isPromise**: 判断是否为Promise
- **hasOwnProperty**: 检查对象是否包含指定的属性

### 3. 常用工具函数 (quick.ts)
- **popProperty**: 弹出对象属性
- **sleep**: 休眠一段时间(异步延迟函数)
- **deepMergeObject**: 深度合并两个对象
- **debounce**: 防抖函数，使用setTimeout实现，在指定延迟后执行回调函数
- **throttle**: 节流函数，根据时间间隔来执行回调函数

### 4. 字符串处理 (str.ts)
- **toCamelCase**: 将字符串转换为驼峰命名格式
- **toKebabCase**: 将驼峰命名法的字符串转换为短横线命名法
- **toCapitalize**: 将字符串首字母大写

### 5. 延迟和超时控制 (delay.ts)
- **withDelayAndTimeout**: 延迟和超时控制包装函数，可用于包装Promise任务
  - 支持延迟触发回调(如显示loading)
  - 支持超时控制和回调
  - 支持任务有效性检查
  - 支持手动取消任务

### 6. 日志工具 (loggger.ts)
- **Logger**: Vitarx 日志助手类
  - 支持不同级别的日志输出(DEBUG, INFO, WARN, ERROR)
  - 支持源代码位置信息显示
  - 支持自定义日志处理函数
  - 支持自定义前缀
- **logger**: vitarx框架共享的日志助手实例

### 7. 类型定义 (types.ts)
提供常用的TypeScript类型定义工具：

- **基础类型**: AnyFunction, AnyCallback, VoidCallback, AnyRecord, AnyArray, AnyMap, AnyWeakMap, AnyWeakSet, AnySet, AnyKey, AnyCollection, AnyObject, AnyPrimitive
- **DeepReadonly**: 递归将对象类型中所有属性设为只读
- **UnReadonly**: 递归移除对象类型中所有属性的只读修饰符
- **MakeRequired**: 将对象类型中的指定属性设为必填项
- **DeepRequired**: 深度必填类型，将对象类型的所有属性及其嵌套属性都变为必填
- **DeepPartial**: 深度可选类型，将对象类型的所有属性及其嵌套属性都变为可选
- **MakePartial**: 将接口的指定属性设为可选
- **OptionalKeys**: 提取对象类型中所有可选属性的键
- **PickOptional**: 挑选出对象类型中所有可选属性，并将它们转换为必选属性
- **RequiredKeys**: 提取对象类型中所有必填属性的键
- **PickRequired**: 挑选出必填属性，去除所有可选属性

## 安装

```bash
npm install @vitarx/utils
```

## 使用示例

```javascript
import { 
  deepClone, 
  isObject, 
  sleep, 
  popProperty, 
  deepMergeObject,
  debounce,
  toCamelCase,
  toKebabCase,
  logger,
  withDelayAndTimeout
} from '@vitarx/utils';

// 深拷贝示例
const obj = { a: 1, b: { c: 2 } };
const cloned = deepClone(obj);

// 类型检测示例
console.log(isObject({})); // true

// 延迟函数示例
await sleep(1000); // 延迟1秒

// 对象属性操作
const user = { name: 'John', age: 30 };
const name = popProperty(user, 'name'); // name = 'John', user = { age: 30 }

// 对象深度合并
const obj1 = { a: 1, b: { c: 2 } };
const obj2 = { b: { d: 3 }, e: 4 };
const merged = deepMergeObject(obj1, obj2); // { a: 1, b: { c: 2, d: 3 }, e: 4 }

// 防抖函数
const debouncedFn = debounce(() => console.log('执行了'), 300);

// 字符串处理
console.log(toCamelCase('hello-world')); // helloWorld
console.log(toKebabCase('helloWorld')); // hello-world

// 日志输出
logger.info('这是一条信息日志');
logger.error('这是一条错误日志');

// 延迟和超时控制
const task = fetch('/api/data').then(res => res.json());
const wrappedTask = withDelayAndTimeout(task, {
  delay: 200, // 200ms后显示加载状态
  timeout: 5000, // 5秒超时
  onDelay: () => console.log('开始加载...'),
  onTimeout: (error) => console.error('请求超时', error)
});
```

## 许可证

[MIT](LICENSE)
