import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { build, type InlineConfig, mergeConfig } from 'vite'
import { existsSync, readdirSync, statSync } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'
import { rmSync } from 'node:fs'
import chalk from 'chalk'

interface PackageJson {
  name: string
  vite?: InlineConfig
}

const __dirname = fileURLToPath(new URL('.', import.meta.url))

/**
 * 构建单个包
 *
 * @param packagePath - 包的路径
 */
const execAsync = promisify(exec)

async function buildPackage(packagePath: string, packageDirName: string, index: number) {
  const pkg = (await import(`${packagePath}/package.json`, { assert: { type: 'json' } }))
    .default as PackageJson
  const separator = '='.repeat(50)

  console.log(chalk.cyan(`\n📦 Building package(${index + 1}): ${chalk.bold(pkg.name)}`))
  console.log(chalk.cyan(separator))

  // 首先使用tsc编译生成.js和.d.ts文件
  console.log(chalk.yellow('🔨 Compiling TypeScript...'))
  const dist = resolve(packagePath, 'dist')
  try {
    if (statSync(dist).isDirectory()) {
      // 清空dist目录
      rmSync(dist, { recursive: true, force: true })
      console.log(chalk.gray('  ✓ Cleaned dist directory'))
    }
  } catch (error) {
    console.error(chalk.red('❌ Error cleaning dist directory:'), error)
    throw error
  }
  try {
    const pakTsConfigPath = `${packagePath}/tsconfig.json`
    const commonConfigPath = resolve(__dirname, '../tsconfig.build.json')
    let buildCommand = `tsc --outDir ${dist} -p ${existsSync(pakTsConfigPath) ? pakTsConfigPath : commonConfigPath}`
    await execAsync(buildCommand)
    console.log(chalk.green('  ✓ TypeScript compilation completed'))
  } catch (error) {
    console.error(chalk.red('❌ TypeScript compilation failed:'), error)
    throw error
  }

  // 使用vite构建不同格式的包
  console.log(chalk.yellow('\n📦 Compiling bundle formats...'))
  // 修改包名处理逻辑，使用更清晰的驼峰命名转换
  const parts = pkg.name.replace('@vitarx/', '').split('-')
  const name = parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')
  const defaultConfig: InlineConfig = {
    configFile: false,
    build: {
      lib: {
        name,
        entry: resolve(packagePath, 'src/index.ts'),
        formats: ['iife'],
        fileName: (format: string) => `index.${format}.js`
      },
      outDir: resolve(packagePath, 'dist'),
      emptyOutDir: false
    }
  }
  await build(mergeConfig(defaultConfig, pkg.vite || {}))
  console.log(chalk.green(`✓ Bundle ${packageDirName} compilation completed`))
  console.log(chalk.cyan(separator + '\n'))
}

/**
 * 解析命令行参数
 */
function parseArgs(): { packages: string[] } {
  const args = process.argv.slice(2)
  const packages: string[] = []
  let i = 0
  while (i < args.length) {
    packages.push(args[i])
    i++
  }
  return { packages }
}

/**
 * 构建指定的包或所有包
 */
async function buildAll() {
  const { packages: targetPackages } = parseArgs()
  const packagesDir = resolve(__dirname, '../packages')
  const packages =
    targetPackages.length > 0
      ? targetPackages
      : readdirSync(packagesDir).filter(dir => {
          const stats = statSync(resolve(packagesDir, dir))
          return stats.isDirectory() && !dir.startsWith('.') && !dir.startsWith('_')
        }) // 获取所有非隐藏目录作为包名
  console.log(chalk.blue(`🚀 Start Building Packages: ${chalk.bold(packages.join(', '))}`))
  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i]
    const packagePath = resolve(packagesDir, pkg)
    await buildPackage(packagePath, pkg, i)
  }
  console.log(chalk.green(`✅  All packages built successfully!`))
}

buildAll().catch(err => {
  console.error(err)
  process.exit(1)
})
