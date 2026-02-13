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

/**
 * 包的 package.json 配置接口
 */
interface PackageJson {
  name: string
  vite?: InlineConfig
  version: string
  dependencies?: Record<string, string>
}

/**
 * 构建环境配置接口
 */
interface BuildEnv {
  dev: boolean
  ssr: boolean
  dts?: boolean
}

/**
 * 主包构建配置接口
 */
interface MainPackageBuildConfig {
  dev: boolean
  ssr: boolean
  format: 'es' | 'iife'
  fileName: string
  alias?: Record<string, string>
}

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const packagesDir = resolve(__dirname, '../packages')

/**
 * Node.js 内置模块，构建时需要排除
 */
const NODE_EXTERNALS = ['stream', 'node:stream']

/**
 * 需要构建的包列表（按依赖顺序排列）
 */
const PACKAGES = ['utils', 'responsive', 'runtime-core', 'runtime-dom', 'runtime-ssr', 'vitarx']

/**
 * 解析包的别名映射
 * 用于主包构建时引用子包的构建产物
 * @param filename - 文件名（不含扩展名）
 * @returns 别名映射对象
 */
function resolveAlias(filename: string): Record<string, string> {
  const alias: Record<string, string> = {}
  PACKAGES.slice(0, -1).forEach(packDir => {
    alias[`@vitarx/${packDir}`] = join(packagesDir, packDir, 'dist', `${filename}.js`)
  })
  return alias
}

/**
 * 获取需要排除的外部模块列表
 * @param dependencies - 包的依赖对象
 * @returns 外部模块列表
 */
function getExternalModules(dependencies?: Record<string, string>): string[] {
  return dependencies ? [...NODE_EXTERNALS, ...Object.keys(dependencies)] : [...NODE_EXTERNALS]
}

/**
 * 创建基础构建配置
 * @param packagePath - 包路径
 * @param outDir - 输出目录
 * @param external - 外部模块列表
 * @param define - 全局定义变量
 * @returns Vite 构建配置
 */
function createBaseBuildConfig(
  packagePath: string,
  outDir: string,
  external: string[],
  define: Record<string, unknown>
): InlineConfig {
  return {
    configFile: false,
    build: {
      outDir,
      lib: {
        entry: resolve(packagePath, 'src/index.ts'),
        formats: ['es'],
        fileName: 'index'
      },
      rollupOptions: { external },
      emptyOutDir: false
    },
    define
  }
}

/**
 * 构建子包
 * @param packagePath - 包路径
 * @param pkg - package.json 配置
 * @param outDir - 输出目录
 * @param env - 构建环境配置
 */
async function buildSubPackage(
  packagePath: string,
  pkg: PackageJson,
  outDir: string,
  env: BuildEnv
): Promise<void> {
  console.log('')
  const { dev, ssr, dts = false } = env
  const tsconfigPath = resolve(packagePath, 'tsconfig.json')
  const plugins: PluginOption[] = []

  // 如果需要生成类型声明文件
  if (dts) {
    plugins.push(
      dtsPlugin({
        insertTypesEntry: true,
        bundleTypes: true,
        tsconfigPath,
        root: packagePath
      })
    )
  }

  const external = getExternalModules(pkg.dependencies)
  const config: InlineConfig = {
    ...createBaseBuildConfig(packagePath, outDir, external, { __DEV__: dev, __SSR__: ssr }),
    build: {
      outDir,
      lib: {
        entry: resolve(packagePath, 'src/index.ts'),
        formats: ['es'],
        fileName: format => {
          const parts = ['index', `.${format}`]
          if (ssr) parts.push('.ssr')
          if (!dev) parts.push('-prod')
          return `${parts.join('')}.js`
        }
      },
      rollupOptions: { external },
      emptyOutDir: false
    },
    plugins
  }

  await build(mergeConfig(config, pkg.vite || {}))
}

/**
 * 构建主包的单个配置变体
 * @param packagePath - 包路径
 * @param pkg - package.json 配置
 * @param outDir - 输出目录
 * @param config - 构建配置
 */
async function buildMainPackageConfig(
  packagePath: string,
  pkg: PackageJson,
  outDir: string,
  config: MainPackageBuildConfig
): Promise<void> {
  const external = getExternalModules()
  const define: Record<string, unknown> = {
    __DEV__: config.dev,
    __SSR__: config.ssr,
    __VERSION__: JSON.stringify(pkg.version)
  }

  const buildConfig: InlineConfig = {
    configFile: false,
    resolve: config.alias ? { alias: config.alias } : undefined,
    build: {
      outDir,
      lib: {
        entry: resolve(packagePath, 'src/index.ts'),
        formats: [config.format],
        fileName: config.fileName,
        ...(config.format === 'iife' ? { name: 'Vitarx' } : {})
      },
      rollupOptions: { external },
      emptyOutDir: false
    },
    define
  }

  await build(buildConfig)
}

/**
 * 构建主包（vitarx）
 * 主包需要构建多个变体：
 * 1. ES Module 开发版（带类型声明）
 * 2. ES Module 生产版
 * 3. ES Module SSR 版
 * 4. ES Module SSR 生产版
 * 5. IIFE 格式（浏览器直接使用）
 * @param packagePath - 包路径
 * @param pkg - package.json 配置
 * @param outDir - 输出目录
 */
async function buildMainPackage(
  packagePath: string,
  pkg: PackageJson,
  outDir: string
): Promise<void> {
  const tsconfigPath = resolve(packagePath, 'tsconfig.json')

  // 构建 ES Module 开发版（带类型声明）
  await build({
    configFile: false,
    build: {
      outDir,
      lib: {
        entry: resolve(packagePath, 'src/index.ts'),
        formats: ['es'],
        fileName: 'index.es'
      },
      rollupOptions: { external: NODE_EXTERNALS },
      emptyOutDir: false
    },
    plugins: [
      dtsPlugin({
        insertTypesEntry: true,
        bundleTypes: true,
        tsconfigPath,
        root: packagePath
      })
    ],
    define: { __DEV__: true, __SSR__: false, __VERSION__: JSON.stringify(pkg.version) }
  })

  // 定义其他构建变体
  const buildConfigs: MainPackageBuildConfig[] = [
    {
      dev: false,
      ssr: false,
      format: 'es',
      fileName: 'index.es-prod',
      alias: resolveAlias('index.es-prod')
    },
    {
      dev: true,
      ssr: true,
      format: 'es',
      fileName: 'index.es.ssr',
      alias: resolveAlias('index.es.ssr')
    },
    {
      dev: false,
      ssr: true,
      format: 'es',
      fileName: 'index.es.ssr-prod',
      alias: resolveAlias('index.es.ssr-prod')
    },
    {
      dev: false,
      ssr: false,
      format: 'iife',
      fileName: 'index',
      alias: resolveAlias('index.es-prod')
    }
  ]

  // 依次构建所有变体
  for (const config of buildConfigs) {
    await buildMainPackageConfig(packagePath, pkg, outDir, config)
  }
}

/**
 * 构建单个包
 * @param packagePath - 包路径
 * @param packageDirName - 包目录名
 * @param index - 包索引（用于日志显示）
 * @param runTest - 是否运行测试
 */
async function buildPackage(
  packagePath: string,
  packageDirName: string,
  index: number,
  runTest: boolean
): Promise<void> {
  const separator = '='.repeat(50)
  log.info(`\n📦 Building package(${index + 1}): ${packageDirName}`)
  log.info(separator)

  // 创建临时 tsconfig.json
  const tsconfigPath = createTsConfig(packagePath)
  const dist = resolve(packagePath, 'dist')

  // 类型检查
  await runTypeCheck(tsconfigPath)
  // 检测循环依赖
  await runMadgeCheck(dist)
  // 清理输出目录
  runClean(dist)

  // 运行测试（如果需要）
  if (runTest) {
    await runVitestTest(packagePath, false, false)
  }

  // 加载 package.json
  const pkg: PackageJson = (await import(`${packagePath}/package.json`)).default
  log.warn(`\n📦 Vite Building ${pkg.name}...`)

  // 根据包类型选择构建方式
  if (packageDirName === 'vitarx') {
    await buildMainPackage(packagePath, pkg, dist)
  } else {
    // 子包需要构建 4 个变体
    await buildSubPackage(packagePath, pkg, dist, { dev: true, ssr: false, dts: true })
    await buildSubPackage(packagePath, pkg, dist, { dev: true, ssr: true })
    await buildSubPackage(packagePath, pkg, dist, { dev: false, ssr: false })
    await buildSubPackage(packagePath, pkg, dist, { dev: false, ssr: true })
  }

  log.success(`\n✓ Bundle ${pkg.name} compilation completed`)
  log.info(separator + '\n')
}

/**
 * 解析命令行参数
 * @returns 解析后的参数对象
 */
function parseArgs(): { packages: string[]; test: boolean } {
  const args = process.argv.slice(2)
  const packages: string[] = []
  let test = false

  args.forEach(arg => {
    if (arg === '--test') {
      test = true
    } else {
      packages.push(arg)
    }
  })

  return { packages, test }
}

/**
 * 构建所有指定的包
 */
async function buildAll(): Promise<void> {
  const { packages: targetPackages, test } = parseArgs()
  const packages = targetPackages.length > 0 ? targetPackages : PACKAGES

  log.info(`🚀 Start Building Packages: ${packages.join(', ')}`)

  for (let i = 0; i < packages.length; i++) {
    const pkgDir = packages[i]
    const pkgPath = join(packagesDir, pkgDir)
    await buildPackage(pkgPath, pkgDir, i, test)
  }

  log.success(`✅  All packages built successfully!`)
}

buildAll().catch(err => {
  console.error(err)
  process.exit(1)
})
