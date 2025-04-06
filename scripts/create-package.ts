import chalk from 'chalk'
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const args = process.argv.slice(2)
if (args.length !== 1) {
  console.error(chalk.red('请提供包名作为参数'))
  process.exit(1)
}

const packageName = args[0]
const packagePath = resolve(process.cwd(), 'packages', packageName)

if (existsSync(packagePath)) {
  console.error(chalk.red(`包 ${packageName} 已存在`))
  process.exit(1)
}

// 创建包目录结构
mkdirSync(packagePath)
mkdirSync(resolve(packagePath, 'src'))
mkdirSync(resolve(packagePath, '__tests__'))

// 创建 package.json
const packageJson = {
  name: `@vitarx/${packageName}`,
  version: '0.0.1',
  description: `Vitarx ${packageName} package`,
  author: 'ZhuChongLin <8210856@qq.com>',
  license: 'MIT',
  repository: {
    type: 'git',
    url: 'git+https://github.com/vitarx-lib/core',
    directory: `packages/${packageName}`
  },
  main: 'dist/index.js',
  module: 'dist/index.js',
  types: 'dist/index.d.ts',
  unpkg: 'dist/index.iife.js',
  jsdelivr: 'dist/index.iife.js',
  files: ['dist', 'LICENSE', 'README.md'],
  exports: {
    '.': {
      import: {
        types: './dist/index.d.ts',
        node: './index.mjs',
        default: './dist/index.js'
      }
    }
  },
  dependencies: {
    '@vitarx/utils': 'workspace:*'
  }
}

writeFileSync(resolve(packagePath, 'package.json'), JSON.stringify(packageJson, null, 2))

// 创建 src/index.ts
writeFileSync(resolve(packagePath, 'src', 'index.ts'), '// Add exports here\n')

// 创建 README.md
writeFileSync(resolve(packagePath, 'README.md'), '')

// 复制 LICENSE
copyFileSync(resolve(process.cwd(), 'LICENSE'), resolve(packagePath, 'LICENSE'))

console.log(chalk.green(`成功创建包 ${packageName}`))
