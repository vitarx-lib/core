import chalk from 'chalk'
import { exec } from 'child_process'
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { promisify } from 'util'
import { build, type InlineConfig, mergeConfig } from 'vite'

const execAsync = promisify(exec)
const __dirname = fileURLToPath(new URL('.', import.meta.url))

interface PackageJson {
  name: string
  vite?: InlineConfig
  version: string
}

const log = {
  info: (msg: string) => console.log(chalk.cyan(msg)),
  success: (msg: string) => console.log(chalk.green(msg)),
  warn: (msg: string) => console.log(chalk.yellow(msg)),
  error: (msg: string) => console.error(chalk.red(msg))
}

/**
 * 使用 madge 检查指定目录下的 TypeScript 文件是否存在循环依赖。
 * 如果发现循环依赖，则记录错误并退出进程。
 * @param distPath 要检查的目录路径，例如 './dist'。
 */
async function checkForCircularDependencies(distPath: string): Promise<void> {
  log.warn(`\nChecking for circular dependencies in ${distPath}...`)
  // 构建命令
  const command = `madge --extensions js --circular ${distPath} --warning --exclude '.*\\.d\\.ts$'`

  try {
    // 执行命令
    // 注意：madge 在发现循环依赖时，会将信息输出到 stdout，但退出码为 1
    const { stdout } = await execAsync(command)

    // 如果命令成功执行（退出码为0），说明没有循环依赖
    if (stdout) {
      // madge 在没有循环依赖时通常不输出任何内容，但以防万一
      log.success('Circular dependency check passed.')
      log.success(`Madge output: ${stdout.trim()}`)
    }
  } catch (error: any) {
    // execAsync 在命令返回非零退出码时会抛出错误
    // 我们需要检查错误对象，它通常包含 stdout, stderr 和 code 属性

    // madge 在发现循环依赖时，会将路径信息输出到 stdout
    if (error.stdout) {
      const circularPaths = error.stdout.trim()
      log.error(`Circular dependencies detected:\n${circularPaths}`)
      // 在这里，你可以选择更详细的日志记录，或者发送通知等
    } else {
      // 如果是其他类型的错误（例如 madge 未安装）
      log.error(`An error occurred while running madge: ${error.message}`)
      if (error.stderr) {
        log.error(`Stderr: ${error.stderr}`)
      }
    }
    // logger.error 已经记录了，这里直接退出
    process.exit(1)
  }
}

/**
 * 清理指定的目录
 * @param dist - 需要清理的目录路径
 */
function cleanDist(dist: string) {
  // 检查目录是否存在并且是一个目录
  if (existsSync(dist) && statSync(dist).isDirectory()) {
    // 递归删除目录及其内容，强制删除
    rmSync(dist, { recursive: true, force: true })
    // 输出清理成功的日志信息
    log.info(`  ✓ Cleaned dist directory: ${dist}`)
  }
}

/**
 * 创建一个临时的TypeScript配置文件
 * @param packagePath - 项目包的路径
 * @returns {string} 返回临时配置文件的完整路径
 */
function createTempTsConfig(packagePath: string): string {
  // 定义临时配置文件的完整路径
  const tsconfigPath = join(packagePath, 'tsconfig.temp.json')
  // 定义临时配置文件的内容结构
  const tsconfigJson = {
    extends: '../../tsconfig.json', // 继承项目根目录的tsconfig配置
    compilerOptions: { outDir: 'dist' }, // 设置编译输出目录为dist
    include: ['src', 'global.d.ts'], // 包含的文件和目录
    exclude: ['dist', 'node_modules', '__tests__'] // 排除的文件和目录
  }
  // 将配置对象写入JSON文件，使用2个空格进行格式化
  writeFileSync(tsconfigPath, JSON.stringify(tsconfigJson, null, 2))
  // 返回创建的临时配置文件路径
  return tsconfigPath
}

/**
 * 将字符串转换为驼峰命名格式
 * @param name 需要转换的字符串，通常可能是包名或文件名
 * @returns {string} 返回转换后的驼峰格式字符串
 */
function toCamelCase(name: string): string {
  return name
    .replace(/^@.*\//, '') // 移除开头的@符号和任何斜杠及前面的内容（如@scope/）
    .split('-') // 按连字符分割字符串为数组
    .map(part => part.charAt(0).toUpperCase() + part.slice(1)) // 将每个单词首字母大写
    .join('') // 将处理后的单词数组连接成字符串
}

/**
 * 执行命令的异步函数
 * @param cmd - 要执行的命令字符串
 * @param cwd - 可选参数，指定命令执行的工作目录
 */
async function runCommand(cmd: string, cwd?: string) {
  try {
    // 尝试执行命令，如果提供了cwd参数，则在指定目录下执行
    await execAsync(cmd, { cwd })
  } catch (err: any) {
    // 捕获执行过程中的错误
    // 如果错误包含stdout信息则显示stdout，否则显示错误消息
    log.error(`Command failed: ${cmd}\n${err?.stdout || err?.message}`)
    // 以非零状态码退出进程，表示执行失败
    process.exit(1)
  }
}

/**
 * 构建包的异步函数
 * @param packagePath - 包的路径
 * @param packageDirName - 包的目录名称
 * @param index - 包的索引
 * @param runTest - 是否运行测试
 */
async function buildPackage(
  packagePath: string,
  packageDirName: string,
  index: number,
  runTest: boolean
) {
  // 导入并解析包的 package.json 文件
  const pkg: PackageJson = (await import(`${packagePath}/package.json`)).default
  // 创建分隔线，用于日志输出
  const separator = '='.repeat(50)
  // 记录开始构建包的信息
  log.info(`\n📦 Building package(${index + 1}): ${pkg.name}`)
  log.info(separator)

  // 如果需要运行测试
  if (runTest) {
    log.warn('🧪 Running vitest tests...')
    // 使用 vitest 运行测试
    await runCommand(`vitest run --dir ${packagePath}`)
    log.success('  ✓ Tests passed successfully')
  }

  // 解析 dist 目录路径
  const dist = resolve(packagePath, 'dist')
  // 清理 dist 目录
  cleanDist(dist)

  // TypeScript 编译阶段
  log.warn('🔨 Compiling TypeScript...')
  // 创建临时 TypeScript 配置文件
  const tempTsConfig = createTempTsConfig(packagePath)
  // 使用 tsc 编译 TypeScript
  await runCommand(`tsc -p ${tempTsConfig}`)
  // 删除临时配置文件
  rmSync(tempTsConfig)

  // vitarx 特殊版本替换处理
  if (packageDirName === 'vitarx') {
    const distPath = join(dist, 'constant.js')
    // 检查文件是否存在
    if (existsSync(distPath)) {
      // 读取文件内容
      const content = readFileSync(distPath, 'utf-8')
      // 替换版本号占位符
      writeFileSync(distPath, content.replace(/'__VERSION__'/g, `"${pkg.version}"`), 'utf-8')
    }
  }
  log.success('  ✓ TypeScript compilation completed')

  // Vite bundle
  log.warn('\n📦 Compiling bundle formats...')
  const name = toCamelCase(pkg.name)
  const defaultConfig: InlineConfig = {
    configFile: false,
    build: {
      lib: {
        name,
        entry: resolve(packagePath, 'src/index.ts'),
        formats: ['iife'],
        fileName: format => `index.${format}.js`
      },
      outDir: dist,
      emptyOutDir: false
    },
    define: { __VERSION__: JSON.stringify(pkg.version) }
  }
  await build(mergeConfig(defaultConfig, pkg.vite || {}))
  log.success(`✓ Bundle ${packageDirName} compilation completed`)
  await checkForCircularDependencies(dist)
  log.info(separator + '\n')
}

/**
 * 解析命令行参数的函数
 * @returns {Object} 返回一个包含解析结果的对象，包含packages数组和test布尔值
 */
function parseArgs(): { packages: string[]; test: boolean } {
  // 获取命令行参数数组，去掉前两个元素(node和脚本路径)
  const args = process.argv.slice(2)
  // 初始化packages数组，用于存储包名
  const packages: string[] = []
  // 初始化test标志，默认为false
  let test = false
  // 遍历所有命令行参数
  args.forEach(arg => {
    // 检查是否是测试参数
    if (arg === '--test') test = true
    // 否则将参数添加到packages数组
    else packages.push(arg)
  })
  // 返回解析结果
  return { packages, test }
}

/**
 * 构建所有指定的包
 * 这是一个异步函数，用于遍历并构建指定目录下的所有包
 */
async function buildAll() {
  // 从命令行参数中解析出目标包和测试标志
  const { packages: targetPackages, test } = parseArgs()
  // 获取包所在目录的绝对路径
  const packagesDir = resolve(__dirname, '../packages')
  // 确定要构建的包列表：如果指定了目标包则使用指定的包，否则获取所有符合条件的包
  const packages =
    targetPackages.length > 0
      ? targetPackages // 如果指定了目标包，则使用指定的包列表
      : readdirSync(packagesDir).filter(dir => {
          // 否则扫描目录获取所有符合条件的包
          // 获取目录状态信息
          const stats = statSync(join(packagesDir, dir))
          // 只返回是目录、不以点或下划线开头的目录名
          return stats.isDirectory() && !dir.startsWith('.') && !dir.startsWith('_')
        })
  // 记录开始构建的信息
  log.info(`🚀 Start Building Packages: ${packages.join(', ')}`)

  // 遍历所有包，逐个构建
  for (let i = 0; i < packages.length; i++) {
    const pkgDir = packages[i] // 当前包的目录名
    const pkgPath = resolve(packagesDir, pkgDir) // 当前包的完整路径
    // 构建单个包，传入包路径、目录名、索引和测试标志
    await buildPackage(pkgPath, pkgDir, i, test)
  }

  // 记录所有包构建完成的信息
  log.success(`✅  All packages built successfully!`)
}

buildAll().catch(err => {
  console.error(err)
  process.exit(1)
})
