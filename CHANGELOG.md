## vitarx@3.0.1 (2025-09-06)

此版本修复了runtime-core循环依赖导致不兼容vite依赖优化问题。

- 更新运行时核心版本为3.0.1
- 新增类型判断辅助函数：
  - isFragmentVNode
  - isElementVNode
  - isTextVNode
  - isCommentVNode
  - isContainerVNode
  - isNotTagVNod


## 发布vitarx@3.0.1-beta.0版本 (2025-09-06)

- 尝试修复循环引用问题，兼容vite依赖优化。

## 发布runtime-core@1.0.1-beta.0版本 (2025-09-06)

* refactor(runtime-core): 为 CommentVNode 类添加文档注释 ([c79ac32](https://github.com/vitarx-lib/core/commit/c79ac32))
* refactor(runtime-core): 优化 vnode 属性类型导入 ([6484015](https://github.com/vitarx-lib/core/commit/6484015))
* refactor(runtime-core): 优化 widget 文件的导入声明，避免循环依赖 ([a5099cb](https://github.com/vitarx-lib/core/commit/a5099cb))
* refactor(runtime-core): 优化import导入 ([b79410c](https://github.com/vitarx-lib/core/commit/b79410c))
* refactor(runtime-core): 优化类型导入方式 ([cbfe003](https://github.com/vitarx-lib/core/commit/cbfe003))
* refactor(runtime-core): 将FnWidget创建相关逻辑迁移至WidgetVNode模块内，避免循环依赖 ([591184b](https://github.com/vitarx-lib/core/commit/591184b))
* refactor(runtime-core): 更新 vnode 类型导入路径 ([b1e9d08](https://github.com/vitarx-lib/core/commit/b1e9d08))
* refactor(runtime-core): 迁移 getCurrentVNode 函数 ([79d7234](https://github.com/vitarx-lib/core/commit/79d7234))
* refactor(runtime-core): 重构 ContainerVNode 类中的子节点类型检查 ([575dbf6](https://github.com/vitarx-lib/core/commit/575dbf6))
* refactor(runtime-core): 重构 provide/inject 功能 ([abc61e3](https://github.com/vitarx-lib/core/commit/abc61e3))
* refactor(runtime-core): 重构 Suspense 组件并提取 suspense-counter ([ab214c3](https://github.com/vitarx-lib/core/commit/ab214c3))
* refactor(runtime-core): 重构 widget 文件 ([252e81f](https://github.com/vitarx-lib/core/commit/252e81f))
* refactor(runtime-core): 重构 WidgetVNode 类 ([b0f4ff6](https://github.com/vitarx-lib/core/commit/b0f4ff6))
* refactor(runtime-core): 重构VNode 相关代码并优化导入结构 ([bd999e6](https://github.com/vitarx-lib/core/commit/bd999e6))
* refactor(runtime-core): 重构获取当前 VNode 的方式 ([323cb5d](https://github.com/vitarx-lib/core/commit/323cb5d))
* refactor(vnode): 优化VNode 类型导入方式 ([f735b83](https://github.com/vitarx-lib/core/commit/f735b83))
* refactor(vnode): 优化元素类型导入 ([195dd3d](https://github.com/vitarx-lib/core/commit/195dd3d))
* refactor(vnode): 修复部分循环依赖问题 ([d7030ce](https://github.com/vitarx-lib/core/commit/d7030ce))
* refactor(vnode): 更新 isSimpleWidget 导入路径 ([f98076d](https://github.com/vitarx-lib/core/commit/f98076d))
* refactor(vnode): 调整 VNode 相关模块的导出顺序 ([0e1ddf1](https://github.com/vitarx-lib/core/commit/0e1ddf1))
* refactor(vnode): 重构虚拟节点类型检查 ([65e79b6](https://github.com/vitarx-lib/core/commit/65e79b6))
* feat(runtime-core): 添加 isClassWidget 类型谓词函数并调整相关代码 ([b03dfd9](https://github.com/vitarx-lib/core/commit/b03dfd9))
* feat(runtime-core): 添加 VNode 类型守卫函数 ([c219c86](https://github.com/vitarx-lib/core/commit/c219c86))
* feat(runtime-core): 添加类小部件的标识符 ([f61585d](https://github.com/vitarx-lib/core/commit/f61585d))
* feat(runtime-core): 添加虚拟节点上下文管理 ([d89dc84](https://github.com/vitarx-lib/core/commit/d89dc84))
* feat(runtime-core): 添加虚拟节点父子关系映射功能 ([8b8c99a](https://github.com/vitarx-lib/core/commit/8b8c99a))
* test(runtime-core): 更新 getCurrentVNode 测试用例 ([634849d](https://github.com/vitarx-lib/core/commit/634849d))
* fix(runtime-core): 解决循环导入 ([e57bc3d](https://github.com/vitarx-lib/core/commit/e57bc3d))

## [vitarx@3.0.0](https://github.com/vitarx-lib/core/compare/v2.0.2..vitarx@3.0.0)(2025-09-05)
