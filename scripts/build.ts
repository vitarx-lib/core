import { join, resolve } from 'path'
import dtsPlugin from 'unplugin-dts/vite'
import { fileURLToPath } from 'url'
import { build, type InlineConfig, mergeConfig, PluginOption } from 'vite'
import {
  createTsConfig,
  log,
  runClean,
  runMadgeCheck,
  runTypeCheck,
  runVitestTest
} from './utils.js'

interface PackageJson {
  name: string
  vite?: InlineConfig
  version: string
}

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const PACKAGES = [
  'utils',
  'responsive',
  'runtime-core',
  'runtime-dom',
  'runtime-ssr',
  'vitarx' // 主包最后构建
]
async function runViteBuild(
  packagePath: string,
  pkg: PackageJson,
  outDir: string,
  env: { dev: boolean; ssr: boolean; dts?: boolean }
): Promise<void> {
  console.log('')
  const { dev, ssr, dts = false } = env
  const tsconfigPath = resolve(packagePath, 'tsconfig.json')
  const plugins: PluginOption[] = []
  if (dts) {
    plugins.push(
      dtsPlugin({
        insertTypesEntry: true,
        bundleTypes: true,
        tsconfigPath: tsconfigPath,
        root: packagePath
      })
    )
  }
  const config: InlineConfig = {
    configFile: false,
    build: {
      lib: {
        entry: resolve(packagePath, 'src/index.ts'),
        formats: ['es'],
        fileName: format => {
          const p: string[] = ['index', `.${format}`]
          if (ssr) p.push('.ssr')
          if (!dev) p.push('-prod')
          return `${p.join('')}.js`
        }
      },
      outDir,
      emptyOutDir: false
    },
    plugins: plugins,
    define: { __DEV__: dev, __SSR__: ssr, __VERSION__: JSON.stringify(pkg.version) }
  }
  await build(mergeConfig(config, pkg.vite || {}))
}

async function buildVitarxIife(packagePath: string, pkg: PackageJson, outDir: string) {
  const config: InlineConfig = {
    configFile: false,
    build: {
      lib: {
        name: 'Vitarx',
        entry: resolve(packagePath, 'src/index.ts'),
        formats: ['iife'],
        fileName: 'index.iife'
      },
      outDir,
      emptyOutDir: false
    },
    define: { __DEV__: false, __SSR__: false, __VERSION__: JSON.stringify(pkg.version) }
  }
  await build(config)
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
): Promise<void> {
  // 创建分隔线，用于日志输出
  const separator = '='.repeat(50)
  // 记录开始构建包的信息
  log.info(`\n📦 Building package(${index + 1}): ${packageDirName}`)
  log.info(separator)
  // 创建临时 tsconfig.json 文件
  const tsconfigPath = createTsConfig(packagePath)
  // 解析 dist 目录路径
  const dist = resolve(packagePath, 'dist')
  await runTypeCheck(tsconfigPath)
  // 检测循环依赖
  await runMadgeCheck(dist)
  // 清理 dist 目录
  runClean(dist)
  // 如果需要运行测试
  if (runTest) {
    await runVitestTest(packagePath, false, false)
  }
  // 导入并解析包的 package.json 文件
  const pkg: PackageJson = (await import(`${packagePath}/package.json`)).default
  // Vite bundle
  log.warn(`\n📦 Vite Building ${pkg.name}...`)
  await runViteBuild(packagePath, pkg, dist, { dev: true, ssr: false, dts: true })
  await runViteBuild(packagePath, pkg, dist, { dev: true, ssr: true })
  await runViteBuild(packagePath, pkg, dist, { dev: false, ssr: false })
  await runViteBuild(packagePath, pkg, dist, { dev: false, ssr: true })
  if (packageDirName === 'vitarx') {
    await buildVitarxIife(packagePath, pkg, dist)
  }
  log.success(`\n✓ Bundle ${pkg.name} compilation completed`)
  log.info(separator + '\n')
}

/**
 * 解析命令行参数的函数
 * @returns {Object} 返回一个包含解析结果的对象，包含packages数组和test布尔值
 */
function parseArgs(): { packages: string[]; test: boolean; dev: boolean; ssr: boolean } {
  // 获取命令行参数数组，去掉前两个元素(node和脚本路径)
  const args = process.argv.slice(2)
  // 初始化packages数组，用于存储包名
  const packages: string[] = []
  // 初始化test标志，默认为false
  let test = false
  let dev = false
  let ssr = false
  // 遍历所有命令行参数
  args.forEach(arg => {
    // 检查是否是测试参数
    if (arg === '--test') test = true
    // 否则将参数添加到packages数组
    else packages.push(arg)
  })
  // 返回解析结果
  return { packages, test, dev, ssr }
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
      : PACKAGES
  // 记录开始构建的信息
  log.info(`🚀 Start Building Packages: ${packages.join(', ')}`)
  // 遍历所有包，逐个构建
  for (let i = 0; i < packages.length; i++) {
    const pkgDir = packages[i] // 当前包的目录名
    const pkgPath = join(packagesDir, pkgDir) // 当前包的完整路径
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
