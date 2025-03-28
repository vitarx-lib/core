/**
 * 包发布脚本
 * 该脚本用于自动化发布指定的npm包，包括以下步骤：
 * 1. 验证包名参数和包是否存在
 * 2. 检查npm登录状态
 * 3. 运行单元测试
 * 4. 构建包
 * 5. 发布到npm仓库
 */

import { execSync } from 'child_process'
import { resolve } from 'path'
import { existsSync } from 'fs'
import chalk from 'chalk'

// 获取命令行参数，去除前两个参数(node和脚本路径)
const args = process.argv.slice(2)

// 验证是否提供了包名参数
if (!args.length) {
  console.error(chalk.red('Error: Please specify the package name to publish'))
  console.log(chalk.yellow('Usage: pnpm tsx scripts/publish.ts <package-name>'))
  process.exit(1)
}

// 获取包名并构建包路径
const packageName = args[0]
const packagePath = resolve(process.cwd(), 'packages', packageName)

// 验证包是否存在于packages目录中
if (!existsSync(packagePath)) {
  console.error(chalk.red(`Error: Package '${packageName}' not found in packages directory`))
  process.exit(1)
}

// 保存当前npm源配置
const originalRegistry = execSync('npm config get registry', { encoding: 'utf-8' }).trim()

try {
  // 切换到npm官方源
  console.log(chalk.blue('Switching to npm official registry...'))
  execSync('npm config set registry https://registry.npmjs.org/', { stdio: 'inherit' })

  // 检查用户是否已登录npm
  // 使用whoami命令验证，如果未登录则会抛出异常
  try {
    execSync('npm whoami', { stdio: 'ignore' })
  } catch (e) {
    console.error(chalk.red('Error: You are not logged in to npm. Please run `npm login` first'))
    process.exit(1)
  }

  // 构建指定的包
  // 使用build.ts脚本进行构建，生成生产环境代码
  console.log(chalk.blue(`Building package: ${packageName}...`))
  execSync(`tsx scripts/build.ts ${packageName} --test`, { stdio: 'inherit' })

  // 发布包到npm仓库
  // 切换到包目录并执行npm publish命令，设置为公共访问权限
  console.log(chalk.blue(`Publishing package: ${packageName}...`))
  execSync(`cd ${packagePath} && npm publish --access public`, { stdio: 'inherit' })

  // 发布成功提示
  console.log(chalk.green(`\n✨ Successfully published ${packageName}!`))
} catch (error) {
  // 发布过程中的错误处理
  console.error(chalk.red('\nError occurred during publishing:'))
  console.error(error)
  process.exit(1)
} finally {
  // 恢复原来的npm源配置
  console.log(chalk.blue('\nRestoring original npm registry...'))
  execSync(`npm config set registry ${originalRegistry}`, { stdio: 'inherit' })
}
