import chalk from 'chalk'
import { exec } from 'child_process'
import { existsSync, readdirSync, statSync } from 'fs'
import { rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { promisify } from 'util'
import { build, type InlineConfig, mergeConfig } from 'vite'

interface PackageJson {
  name: string
  vite?: InlineConfig
  version: string
}

const __dirname = fileURLToPath(new URL('.', import.meta.url))

/**
 * 构建单个包
 *
 * @param packagePath - 包的路径
 */
const execAsync = promisify(exec)

/**
 * 构建指定包的函数
 *
 * @param packagePath 包的路径
 * @param packageDirName 包的目录名
 * @param index 包的索引，用于显示构建顺序
 * @param runTest 是否运行测试
 */
const buildPackage = async (
  packagePath: string,
  packageDirName: string,
  index: number,
  runTest: boolean
) => {
  // 导入包的package.json文件
  const pkg = (await import(`${packagePath}/package.json`)).default as PackageJson
  // 用于分隔输出的等号线
  const separator = '='.repeat(50)

  // 输出构建包的信息
  console.log(chalk.cyan(`\n📦 Building package(${index + 1}): ${chalk.bold(pkg.name)}`))
  console.log(chalk.cyan(separator))

  // 如果需要运行测试，则执行测试命令
  if (runTest) {
    console.log(chalk.yellow('🧪 Running tests...'))
    try {
      await execAsync(`vitest run --dir ${packagePath}`)
      console.log(chalk.green('  ✓ Tests passed successfully'))
    } catch (error: any) {
      console.error(chalk.red(`❌  Tests failed:\n${error?.stdout || error?.message}`))
      process.exit(0)
    }
  }

  // 首先使用tsc编译生成.js和.d.ts文件
  console.log(chalk.yellow('🔨 Compiling TypeScript...'))
  const dist = resolve(packagePath, 'dist')
  // 清空或检查dist目录
  try {
    if (existsSync(dist)) {
      if (statSync(dist).isDirectory()) {
        // 清空dist目录
        rmSync(dist, { recursive: true, force: true })
        console.log(chalk.gray('  ✓ Cleaned dist directory'))
      }
    } else {
      console.log(chalk.gray('  ℹ dist directory does not exist, skipping cleanup'))
    }
  } catch (error) {
    console.error(chalk.red('❌  Error cleaning dist directory:'), error)
    process.exit(0)
  }
  const pakTsConfigPath = `${packagePath}/tsconfig.json`
  const isTsConfigExists = existsSync(pakTsConfigPath)
  // 执行TypeScript编译命令
  try {
    if (!isTsConfigExists) {
      // 创建 tsconfig.json
      const tsconfigJson = {
        extends: '../../tsconfig.json',
        compilerOptions: {
          outDir: 'dist'
        },
        include: ['src', 'global.d.ts'],
        exclude: ['dist', 'node_modules', '__tests__']
      }
      writeFileSync(pakTsConfigPath, JSON.stringify(tsconfigJson, null, 2))
    }
    const buildCommand = `tsc --outDir ${dist} -p ${pakTsConfigPath}`
    await execAsync(buildCommand)
    if (!isTsConfigExists) rmSync(pakTsConfigPath)
    console.log(chalk.green('  ✓ TypeScript compilation completed'))
  } catch (error: any) {
    console.error(
      chalk.red(`❌  TypeScript compilation failed:\n${error?.stdout || error?.message}`)
    )
    if (!isTsConfigExists) rmSync(pakTsConfigPath)
    process.exit(0)
  }

  // 使用vite构建不同格式的包
  console.log(chalk.yellow('\n📦 Compiling bundle formats...'))
  // 修改包名处理逻辑，使用更清晰的驼峰命名转换
  const parts = pkg.name.replace('@vitarx/', '').split('-')
  const name = parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')
  // Vite构建配置
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
    },
    define: {
      // 版本号
      __VERSION__: JSON.stringify(pkg.version)
    }
  }
  // 合并包配置与默认配置，并开始构建
  await build(mergeConfig(defaultConfig, pkg.vite || {}))
  console.log(chalk.green(`✓ Bundle ${packageDirName} compilation completed`))
  console.log(chalk.cyan(separator + '\n'))
}

/**
 * 解析命令行参数
 */
const parseArgs = (): { packages: string[]; test: boolean } => {
  const args = process.argv.slice(2)
  const packages: string[] = []
  let test = false
  let i = 0
  while (i < args.length) {
    if (args[i] === '--test') {
      test = true
      i++
      continue
    }
    packages.push(args[i])
    i++
  }
  return { packages, test }
}

/**
 * 构建指定的包或所有包
 */
const buildAll = async () => {
  const { packages: targetPackages, test } = parseArgs()
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
    await buildPackage(packagePath, pkg, i, test)
  }
  console.log(chalk.green(`✅  All packages built successfully!`))
}

buildAll().catch(err => {
  console.error(err)
  process.exit(1)
})
