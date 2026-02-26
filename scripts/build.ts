import { join, resolve } from 'path'
import dtsPlugin from 'unplugin-dts/vite'
import { fileURLToPath } from 'url'
import { build, type InlineConfig, mergeConfig, PluginOption } from 'vite'
import { PACKAGES } from './common.js'
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
interface BuildOptions {
  format?: 'es' | 'cjs' | 'umd' | 'iife'
  define?: Record<string, string | boolean>
  dts?: boolean
  fileName?: string
  external?: string[]
}

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const packagesDir = resolve(__dirname, '../packages')

/**
 * Node.js 内置模块，构建时需要排除
 */
const NODE_EXTERNALS = ['stream', 'node:stream']

/**
 * 获取需要排除的外部模块列表
 * @param dependencies - 包的依赖对象
 * @returns - 外部模块列表
 */
function getExternalModules(dependencies?: Record<string, string>): string[] {
  return dependencies ? [...NODE_EXTERNALS, ...Object.keys(dependencies)] : [...NODE_EXTERNALS]
}

/**
 * vite 构建
 *
 * @param packagePath - 包路径
 * @param pkg - package.json 配置
 * @param outDir - 输出目录
 * @param options - 构建环境配置
 */
async function viteBuild(
  packagePath: string,
  pkg: PackageJson,
  outDir: string,
  options?: BuildOptions
): Promise<void> {
  console.log('')
  const {
    dts = false,
    format = 'es',
    define = {},
    external,
    fileName = `index.${format}`
  } = options || {}
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

  const libName = pkg.name.charAt(0).toUpperCase() + pkg.name.slice(1)

  const config: InlineConfig = {
    configFile: false,
    build: {
      outDir,
      lib: {
        name: libName,
        entry: resolve(packagePath, 'src/index.ts'),
        formats: [format],
        fileName: _ => {
          return `${fileName}.js`
        }
      },
      rollupOptions: { external },
      emptyOutDir: false,
      minify: define.__VITARX_DEV__ || dts ? false : 'oxc'
    },
    define,
    plugins
  }
  await build(mergeConfig(config, pkg.vite || {}))
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
  // 清理 dist 目录
  runClean(dist)
  // 运行测试（如果需要）
  if (runTest) {
    await runVitestTest(packagePath, false, false)
  }
  // 类型检查
  await runTypeCheck(tsconfigPath)
  // 检测循环依赖
  await runMadgeCheck(dist)

  if (packageDirName === 'vite-plugin') {
    log.info(separator + '\n')
    return void 0
  }

  // 清理输出目录
  runClean(dist)
  // 加载 package.json
  const pkg: PackageJson = (await import(`${packagePath}/package.json`)).default
  log.warn(`\n📦 Vite Building ${pkg.name}...`)
  const external =
    packageDirName === 'vitarx' ? NODE_EXTERNALS : getExternalModules(pkg.dependencies)
  const define = { __VITARX_VERSION__: JSON.stringify(pkg.version) }
  // 根据包类型选择构建方式
  await viteBuild(packagePath, pkg, dist, {
    dts: true,
    external,
    define,
    fileName: 'index.esm-bundler'
  })
  await viteBuild(packagePath, pkg, dist, {
    external,
    define: {
      ...define,
      __VITARX_DEV__: true,
      __VITARX_SSR__: true
    },
    format: 'cjs',
    fileName: 'index.cjs-dev'
  })
  await viteBuild(packagePath, pkg, dist, {
    external,
    define: {
      ...define,
      __VITARX_DEV__: false,
      __VITARX_SSR__: true
    },
    format: 'cjs',
    fileName: 'index.cjs-prod'
  })

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
