/**
 * 转换上下文模块
 * 定义编译转换过程中的上下文数据结构
 * @module context
 */
import type { File } from '@babel/types'
import type { CompileOptions } from './transform.js'

/**
 * 导入信息
 * 追踪需要注入的运行时 API
 */
export interface ImportInfo {
  /** createView - 视图创建函数 */
  createView: boolean
  /** Fragment - 片段组件 */
  Fragment: boolean
  /** branch - 条件分支函数 */
  branch: boolean
  /** dynamic - 动态值包装函数 */
  dynamic: boolean
  /** access - 属性访问函数 */
  access: boolean
  /** withDirectives - 指令包装函数 */
  withDirectives: boolean
  /** unref - ref 解包函数 */
  unref: boolean
  /** isRef - ref 类型检查函数 */
  isRef: boolean
}

/**
 * Vitarx 导入别名映射
 * 记录运行时 API 的本地别名
 */
export interface VitarxImportAliases {
  createView: string | null
  Fragment: string | null
  branch: string | null
  dynamic: string | null
  access: string | null
  withDirectives: string | null
  unref: string | null
  isRef: string | null
}

/**
 * Ref API 别名映射
 * 记录响应式 API 的本地别名
 */
export interface RefApiAliases {
  ref: string | null
  toRef: string | null
  toRefs: string | null
  shallowRef: string | null
  computed: string | null
}

/**
 * 转换上下文
 * 包含编译过程中需要的所有状态信息
 */
export interface TransformContext {
  /** 原始源代码 */
  code: string
  /** 文件标识符（可能包含查询参数） */
  id: string
  /** 文件名（不含查询参数） */
  filename: string
  /** 编译选项 */
  options: CompileOptions
  /** 解析后的 AST */
  ast: File
  /** 需要注入的导入信息 */
  imports: ImportInfo
  /** 已存在的导入名称集合 */
  existingImports: Set<string>
  /** Vitarx API 别名映射 */
  vitarxAliases: VitarxImportAliases
  /** Ref API 别名映射 */
  refApiAliases: RefApiAliases
  /** ref 变量名集合 */
  refVariables: Set<string>
}

/**
 * 创建转换上下文
 * @param code - 源代码
 * @param id - 文件标识符
 * @param options - 编译选项
 * @param ast - AST 节点
 * @returns 转换上下文对象
 */
export function createContext(
  code: string,
  id: string,
  options: CompileOptions,
  ast: File
): TransformContext {
  const filename = id.split('?')[0]
  return {
    code,
    id,
    filename,
    options,
    ast,
    imports: {
      createView: false,
      Fragment: false,
      branch: false,
      dynamic: false,
      access: false,
      withDirectives: false,
      unref: false,
      isRef: false
    },
    existingImports: new Set(),
    vitarxAliases: {
      createView: null,
      Fragment: null,
      branch: null,
      dynamic: null,
      access: null,
      withDirectives: null,
      unref: null,
      isRef: null
    },
    refApiAliases: {
      ref: null,
      toRef: null,
      toRefs: null,
      shallowRef: null,
      computed: null
    },
    refVariables: new Set()
  }
}

/**
 * 标记需要注入的导入
 * @param ctx - 转换上下文
 * @param name - 导入名称
 */
export function markImport(ctx: TransformContext, name: keyof ImportInfo): void {
  ctx.imports[name] = true
}
