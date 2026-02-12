import chalk from 'chalk'
import { exec } from 'child_process'
import { existsSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'path'
import { promisify } from 'util'

export const execAsync = promisify(exec)
export const log = {
  info: (msg: string) => console.log(chalk.cyan(msg)),
  success: (msg: string) => console.log(chalk.green(msg)),
  warn: (msg: string) => console.log(chalk.yellow(msg)),
  error: (msg: string) => console.error(chalk.red(msg))
}
/**
 * 创建一个TypeScript配置文件（用于构建）
 * @param packagePath - 项目包的路径
 * @returns {string} 返回临时配置文件的完整路径
 */
export function createTsConfig(packagePath: string): string {
  // 定义临时配置文件的完整路径
  const tsconfigPath = join(packagePath, 'tsconfig.json')
  if (existsSync(tsconfigPath)) return tsconfigPath
  // 定义临时配置文件的内容结构
  const tsconfigJson = {
    extends: '../../tsconfig.json', // 继承项目根目录的tsconfig配置
    compilerOptions: { outDir: 'dist' },
    include: ['src', '../../vite-env.d.ts'], // 包含的文件和目录
    exclude: ['dist', 'node_modules'] // 排除的文件和目录
  }
  // 将配置对象写入JSON文件，使用2个空格进行格式化
  writeFileSync(tsconfigPath, JSON.stringify(tsconfigJson, null, 2))
  // 返回创建的临时配置文件路径
  return tsconfigPath
}

/**
 * 执行命令的异步函数
 * @param cmd - 要执行的命令字符串
 * @param cwd - 可选参数，指定命令执行的工作目录
 */
export async function runCommand(cmd: string, cwd?: string): Promise<void> {
  try {
    log.info(`Execute Command: ${cmd}`)
    // 尝试执行命令，如果提供了cwd参数，则在指定目录下执行
    await execAsync(cmd, { cwd })
    log.success('Command executed successfully')
  } catch (err: any) {
    // 捕获执行过程中的错误
    // 如果错误包含stdout信息则显示stdout，否则显示错误消息
    log.error(`Command failed: ${cmd}\n${err?.stdout || err?.message}`)
    // 以非零状态码退出进程，表示执行失败
    process.exit(1)
  }
}

/**
 * 测试指定包
 *
 * @param pkgPath - 包目录
 * @param watch - 是否启用监视模式
 * @param coverage - 是否启用覆盖率测试
 */
export async function runVitestTest(
  pkgPath: string,
  watch: boolean,
  coverage: boolean
): Promise<void> {
  // 记录测试开始信息
  log.warn(`\n🧪 Running tests for package: ${chalk.bold(pkgPath)}`)
  if (!existsSync(join(pkgPath, 'tests')) && !existsSync(join(pkgPath, '__tests__'))) {
    log.warn(`⚠️ No tests or __tests__ found in ${pkgPath}`)
    return void 0
  }
  // 构建测试命令
  const cmdParts = ['vitest', 'run', `--dir ${pkgPath}`] // 基础命令
  if (watch) cmdParts.push('--watch') // 添加监视模式参数
  if (coverage) cmdParts.push('--coverage') // 添加覆盖率测试参数
  const vitestConfig = join(pkgPath, 'vitest.config.ts')
  if (existsSync(vitestConfig)) {
    cmdParts.push(`--config ${vitestConfig}`)
  }
  const cmd = cmdParts.join(' ') // 合并命令各部分
  try {
    log.info(`Execute Command: ${cmd}`)
    // 执行测试命令
    await execAsync(cmd)
    // 记录测试成功信息
    log.success(`✓ Tests passed for ${pkgPath}`)
  } catch (err: any) {
    // 处理测试失败情况
    console.error(err?.stdout || err?.message) // 输出错误信息
    log.error(`❌ Tests failed for ${pkgPath}`) // 记录失败信息
    process.exit(1) // 退出进程
  }
}

/**
 * 执行 TypeScript 类型检查
 * @param tsconfigPath - ts配置路径
 * @returns 返回临时 tsconfig.json 文件的路径
 */
export async function runTypeCheck(tsconfigPath: string): Promise<string> {
  // ts 原生校验
  log.warn('\n🧪 Running TypeCheck...') // 输出提示信息，表示正在运行 TypeScript 编译器
  // 使用 tsc 编译 TypeScript
  await runCommand(`tsc -p ${tsconfigPath}`) // 执行 TypeScript 编译命令，使用指定的配置文件
  // 类型校验成功
  log.success('✓ TypeCheck successfully')
  return tsconfigPath
}

/**
 * 使用 madge 检查指定目录下的 TypeScript 文件是否存在循环依赖。
 * 如果发现循环依赖，则记录错误并退出进程。
 * @param distPath 要检查的目录路径，例如 './dist'。
 */
export async function runMadgeCheck(distPath: string): Promise<void> {
  // 构建命令
  const command = `madge --extensions js --circular ${distPath} --warning --exclude '.*\\.d\\.ts$'`
  log.warn(`\n⭕️ Checking for circular dependencies`)
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
 * 清理指定目录
 * @param dist - 需要清理的目录路径
 */
export function runClean(dist: string): void {
  // 检查目录是否存在并且是一个目录
  if (existsSync(dist) && statSync(dist).isDirectory()) {
    // 递归删除目录及其内容，强制删除
    rmSync(dist, { recursive: true, force: true })
    // 输出清理成功的日志信息
    log.success(`✓ Cleaned dist directory: ${dist}`)
  }
}
