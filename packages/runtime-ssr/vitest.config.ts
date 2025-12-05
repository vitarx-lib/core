import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../vitest.config'

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      setupFiles: [fileURLToPath(new URL('./__tests__/setup.ts', import.meta.url))]
    }
  })
)
