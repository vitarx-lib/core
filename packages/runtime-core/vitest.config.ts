import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../vitest.config'

/**
 * runtime-core 包的 vitest 配置
 * 继承根配置，并添加特定的 setup 文件
 */
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      setupFiles: [fileURLToPath(new URL('./__tests__/setup.ts', import.meta.url))]
    }
  })
)
