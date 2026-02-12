#!/usr/bin/env tsx
import chalk from 'chalk'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { runVitestTest } from './utils.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const log = {
  info: (msg: string) => console.log(chalk.cyan(msg)),
  success: (msg: string) => console.log(chalk.green(msg)),
  error: (msg: string) => console.error(chalk.red(msg))
}

/**
 * 解析命令行参数
 * 该函数用于解析命令行传入的参数，返回包含包名、是否监听模式以及是否生成覆盖率报告的对象
 * @returns {Object} 返回一个包含三个属性的对象：
 *   - packages: string[] - 包名数组，从命令行参数中获取的非选项参数
 *   - watch: boolean - 是否启用监听模式，通过 --watch 或 -w 参数设置
 *   - coverage: boolean - 是否生成覆盖率报告，通过 --coverage 参数设置
 */
function parseArgs(): { packages: string[]; watch: boolean; coverage: boolean } {
  // 获取命令行参数，排除前两个元素（node 和脚本路径）
  const args = process.argv.slice(2)
  // 初始化包名数组
  const packages: string[] = []
  // 初始化监听模式标志，默认为 false
  let watch = false
  // 初始化覆盖率报告标志，默认为 false
  let coverage = false

  // 遍历所有命令行参数
  for (const arg of args) {
    // 检查是否是监听模式参数
    if (arg === '--watch' || arg === '-w') {
      watch = true
    } else if (arg === '--coverage') {
      coverage = true
    } else {
      packages.push(arg)
    }
  }

  return { packages, watch, coverage }
}
function resolvePackages(packages: string[], packagesDir: string): string[] {
  // 如果指定了包名列表
  if (packages.length > 0) {
    // 验证指定包是否存在
    const validPackages = packages.filter(pkgName => {
      // 构建包的完整路径
      const pkgPath = join(packagesDir, pkgName)
      // 检查路径是否存在且为目录
      if (!existsSync(pkgPath) || !statSync(pkgPath).isDirectory()) {
        // 如果包不存在，记录错误日志
        log.error(`Package not found: ${pkgName}`)
        return false
      }
      return true
    })
    // 如果没有有效的包，记录错误并退出进程
    if (validPackages.length === 0) {
      log.error('No valid packages specified.')
      process.exit(1)
    }
    return validPackages
  } else {
    // 没有指定包名，测试所有包
    // 读取packages目录下的所有条目，并过滤出符合条件的目录
    return readdirSync(packagesDir).filter(dir => {
      // 获取目录状态
      const stats = statSync(join(packagesDir, dir))
      // 返回条件：是目录且不以点或下划线开头
      return stats.isDirectory() && !dir.startsWith('.') && !dir.startsWith('_')
    })
  }
}
/**
 * 主函数，负责执行测试流程
 * 它会解析命令行参数，获取目标包，然后依次执行每个包的测试
 */
async function main() {
  // 解析命令行参数，获取包名、是否开启监听模式和覆盖率模式
  const { packages: pkgArgs, watch, coverage } = parseArgs()
  const packagesDir = resolve(__dirname, '../packages')
  // 根据参数获取需要测试的目标包列表
  const packages = resolvePackages(pkgArgs, packagesDir)
  // 记录开始测试的信息，显示将要测试的包名
  log.info(`Starting tests for packages: ${packages.join(', ')}`)
  // 如果开启了监听模式，显示提示信息
  if (watch) log.info('💡 Watch mode enabled')
  // 如果开启了覆盖率模式，显示提示信息
  if (coverage) log.info('📊 Coverage enabled')
  // 遍历所有目标包，依次执行测试
  for (const pkg of packages) {
    await runVitestTest(join(packagesDir, pkg), watch, coverage)
  }
  // 所有测试完成后，显示成功信息
  log.success('\n✅ All tests completed successfully!')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
