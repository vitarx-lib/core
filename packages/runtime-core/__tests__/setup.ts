/**
 * 测试环境全局初始化
 *
 * 此文件在所有测试运行前执行，用于：
 * 1. 注册全局渲染器（使用 runtime-dom 的 DomRenderer）
 * 2. 注册所有节点控制器
 *
 * 这样可以确保 runtime-core 的测试能够正常运行，
 * 因为 runtime-core 本身是平台无关的，需要配合具体平台实现使用。
 */
///<reference path="../../runtime-dom/dist/index.d.ts"/>
import { DomRenderer } from '../../runtime-dom'
import { setRenderer } from '../src/index.js'

setRenderer(new DomRenderer() as any)
