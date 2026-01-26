import { defineConfig } from 'vitest/config'
import { entries } from './scripts/alias'

export default defineConfig({
  define: {
    __DEV__: true,
    __SSR__: false,
    ____VERSION__: JSON.stringify('0.0.0')
  },
  resolve: {
    alias: entries
  },
  test: {
    // 设置测试运行的环境为Node.js
    // 这意味着测试将在Node.js环境中执行，而不是浏览器环境
    environment: 'jsdom',

    // 指定需要包含的测试文件的匹配模式
    // 这里会匹配所有__tests__目录下的.test或.spec结尾的各种JavaScript/TypeScript文件
    include: [
      '**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '**/tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],

    // 指定需要排除的文件或目录
    // 这里排除了node_modules和dist目录，避免测试这些构建和依赖文件
    exclude: ['**/node_modules/**', '**/dist/**'],

    // 代码覆盖率配置
    coverage: {
      // 使用V8内置的覆盖率收集器
      provider: 'v8',
      // 指定覆盖率报告的输出格式：文本格式、JSON格式和HTML格式
      reporter: ['text', 'json', 'html'],
      // 指定在收集覆盖率时需要排除的文件
      // 这里排除了node_modules、dist和测试文件本身
      exclude: ['**/node_modules/**', '**/dist/**', '**/__tests__/**', '**/tests/**']
    },

    // 设置单个测试用例的超时时间为10秒
    // 如果测试执行时间超过这个值，测试将被标记为失败
    testTimeout: 10000,

    // 添加 globals 配置以支持全局测试函数
    globals: true
  }
})
