import chalk from 'chalk'
import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import * as readline from 'node:readline'
import { resolve } from 'path'
import semver from 'semver'

const args = process.argv.slice(2)

if (!args.length) {
  console.error(chalk.red('Error: Please specify the package name to publish'))
  process.exit(1)
}

// 包名，不包含前缀
const packageName = args[0]
// 包路径
const packagePath = resolve(process.cwd(), 'packages', packageName)
// changelog路径
const changelogPath = resolve(process.cwd(), 'CHANGELOG.md')
// 根包的package.json内容对象
const rootPkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8'))
// 是否是主包
const isReleaseMainPackage = packageName === rootPkg.name
// 版本参数
let versionArg: string | undefined = args[1]
// 预发布版本前缀参数
let preid: string | undefined = args[2]

// -------------------- Helpers --------------------
/**
 * 执行命令行指令的函数
 * @param cmd 要执行的命令字符串
 * @param options 可选配置参数
 * @returns 返回命令执行结果
 */
function run(cmd: string, options: { cwd?: string } = {}) {
  // 使用execSync执行命令，stdio: 'inherit'表示子进程的输入输出继承父进程
  // 同时合并options参数，允许用户自定义配置
  return execSync(cmd, { stdio: 'inherit', ...options })
}

/**
 * 回滚Git操作函数
 * @param tagName - 要删除的标签名称
 * @param hasCommitted - 是否已经提交了更改
 */
function rollbackGit(tagName: string, hasCommitted: boolean) {
  try {
    // 如果已经提交了更改，则执行软重置到上一个提交
    // 但保持工作目录和暂存区不变
    if (hasCommitted) {
      rollbackVersion()
      run('git reset --soft HEAD~1')
    }
    // 如果提供了标签名称，则删除该标签
    if (tagName) {
      run(`git tag -d ${tagName}`)
    }
  } catch {}
}

/**
 * 询问用户版本号，并根据用户输入返回相应的版本号
 * @param defaultVersion 默认建议的版本号
 * @returns 返回一个Promise，解析为用户选择的版本号
 */
function askVersion(defaultVersion: string): Promise<string> {
  return new Promise(resolve => {
    // 使用readline模块向用户提问
    rl.question(
      // 使用chalk黄色显示提示信息，包含默认版本号
      chalk.yellow(`⚡ Suggested version is ${defaultVersion} Use this version? (y/n/custom): `),
      answer => {
        if (answer.toLowerCase() === 'y' || answer.trim() === '') {
          resolve(defaultVersion)
        } else if (answer.toLowerCase() === 'n') {
          console.log(chalk.red('❌ Aborted by user'))
          process.exit(0)
        } else {
          if (!semver.valid(answer)) {
            console.error(chalk.red(`Error: Invalid version number '${answer}'`))
            process.exit(1)
          }
          resolve(answer)
        }
      }
    )
  })
}

// -------------------- Step 0: 验证包 --------------------
if (!existsSync(packagePath)) {
  console.error(chalk.red(`Error: Package '${packageName}' not found in packages directory`))
  process.exit(1)
}
// -------------------- Step 1: 检查登录和git状态 --------------------
const gitStatus = execSync('git status --porcelain').toString().trim()
if (gitStatus) {
  console.error('❌ 请先提交或暂存当前更改再发布。')
  process.exit(1)
}
try {
  run('pnpm whoami --registry https://registry.npmjs.org/')
} catch {
  console.error(
    chalk.red(
      'Error: You are not logged in to npm. Please run `pnpm login --registry https://registry.npmjs.org/` first'
    )
  )
  process.exit(1)
}

// -------------------- Step 2: 当前版本 --------------------
const pkgJsonPath = resolve(packagePath, 'package.json')
const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
let currentVersion = pkg.version

/**
 * 回退版本
 */
function rollbackVersion() {
  // 将包的版本设置为指定的旧版本
  pkg.version = currentVersion
  // 将更新后的包内容写回package.json文件，使用2个空格缩进格式化
  writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2))
  // 在控制台输出回滚操作的黄色警告提示信息
  console.log(chalk.yellow(`⚠️ Reverted ${packageName} version back to ${currentVersion}`))
}
// -------------------- Step 3: 新版本 --------------------
let newVersion: string
if (versionArg) {
  if (
    [
      'major',
      'minor',
      'patch',
      'prerelease',
      'premajor',
      'preminor',
      'prepatch',
      'release'
    ].includes(versionArg)
  ) {
    newVersion = semver.inc(currentVersion, versionArg as semver.ReleaseType, preid) as string
  } else {
    if (!semver.valid(versionArg)) {
      console.error(
        chalk.red(
          `Error: Invalid version number '${versionArg}'，valid release type (major, premajor, minor, preminor, patch, prepatch, or prerelease)`
        )
      )
      process.exit(1)
    }
    newVersion = versionArg
  }
} else {
  newVersion = currentVersion.includes('-')
    ? semver.inc(currentVersion, 'prerelease', preid)!
    : semver.inc(currentVersion, 'patch')!
}

// -------------------- Step 3.5: 确认版本 --------------------
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
newVersion = await askVersion(newVersion)
rl.close()

pkg.version = newVersion
writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2))
console.log(chalk.green(`✅ Using version ${newVersion}`))

// -------------------- Step 4: 构建 --------------------
console.log(chalk.blue(`📦 Building package: ${packageName}...`))
try {
  run(`pnpm tsx scripts/build.ts ${packageName} --test`)
} catch {
  rollbackVersion()
  process.exit(1)
}

// -------------------- Step 5: 更新日志（仅主包） --------------------
if (isReleaseMainPackage) {
  console.log(chalk.blue('📝 Generating CHANGELOG.md...'))
  try {
    run(
      `conventional-changelog -p angular -i CHANGELOG.md -s -r 5 --tag-prefix v --pkg ${pkgJsonPath}`
    )
  } catch {
    rollbackVersion()
    process.exit(1)
  }
}
// -------------------- Step 6: 提交 --------------------
let hasCommitted = false
console.log(chalk.blue('📤 Committing changes...'))
try {
  run(`git add ${pkgJsonPath} ${isReleaseMainPackage ? changelogPath : ''}`)
  run(`git commit -m "build(${packageName}): release ${packageName}@${newVersion}"`)
  hasCommitted = true
} catch {
  console.log(chalk.yellow('⚠️  Nothing to commit'))
}
// -------------------- Step 7: 打 tag（仅主包） --------------------
const tagName = `v${newVersion}`
if (isReleaseMainPackage) {
  console.log(chalk.blue(`🏷  Tagging: ${tagName}`))
  try {
    run(`git tag -a ${tagName} -m "Release ${tagName}"`)
  } catch {
    rollbackGit(tagName, hasCommitted)
    process.exit(1)
  }
}

// -------------------- Step 8: 发布 --------------------
console.log(chalk.blue(`🚀 Publishing ${packageName}@${newVersion}...`))
try {
  run(`pnpm publish --access public --registry https://registry.npmjs.org/`, { cwd: packagePath })
} catch {
  console.error(chalk.red('❌ Publish failed, rolling back...'))
  rollbackGit(tagName, hasCommitted)
  process.exit(1)
}

// -------------------- Step 9: 推送 --------------------
console.log(chalk.blue('⬆️  Pushing to remote...'))
run('git push')
if (isReleaseMainPackage) run('git push --tags')

console.log(chalk.green(`\n✨ Successfully built and published ${packageName}@${newVersion}!`))
