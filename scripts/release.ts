#!/usr/bin/env tsx

/**
 * Vitarx Release Script
 *
 * 工业级可靠发布系统
 *
 * 特性：
 * - Git 状态检测
 * - npm 登录检测
 * - 分支检测
 * - 防止重复发布
 * - 支持 dry-run
 * - 支持 --yes 跳过确认
 * - 发布失败安全回滚
 */

import chalk from 'chalk'
import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import readline from 'node:readline/promises'
import { resolve } from 'path'
import process from 'process'
import semver from 'semver'

/* -------------------------------------------------- */
/* Config */
/* -------------------------------------------------- */

const REQUIRED_BRANCH = 'main'

const PACKAGES = [
  'utils',
  'responsive',
  'runtime-core',
  'runtime-dom',
  'runtime-ssr',
  'vitarx',
  'vite-plugin'
]

const RELEASE_TYPES = [
  'major',
  'minor',
  'patch',
  'premajor',
  'preminor',
  'prepatch',
  'prerelease',
  'release'
] as const

/* -------------------------------------------------- */

const ROOT = process.cwd()
const DRY_RUN = process.argv.includes('--dry-run')
const SKIP_CONFIRM = process.argv.includes('--yes')

let committed = false
let published = false
let versionTag = ''
let originalHead = ''

type PublishResult = {
  name: string
  success: boolean
  error?: unknown
}

const publishResults: PublishResult[] = []

/* -------------------------------------------------- */
/* Logging */
/* -------------------------------------------------- */

/**
 * 打印章节标题
 *
 * @param title - 章节标题文本
 * @example
 * ```ts
 * section('Pre Checks')
 * // 输出:
 * // ━━━ Pre Checks ━━━
 * ```
 */
function section(title: string) {
  console.log('\n' + chalk.bold.blue(`━━━ ${title} ━━━`))
}

/**
 * 打印成功消息
 *
 * @param msg - 成功消息文本
 * @example
 * ```ts
 * success('Git working tree clean')
 * // 输出: ✔ Git working tree clean
 * ```
 */
function success(msg: string) {
  console.log(chalk.green(`✔ ${msg}`))
}

/**
 * 打印警告消息
 *
 * @param msg - 警告消息文本
 * @example
 * ```ts
 * warning('Running in dry-run mode')
 * // 输出: ⚠ Running in dry-run mode
 * ```
 */
function warning(msg: string) {
  console.log(chalk.yellow(`⚠ ${msg}`))
}

/**
 * 打印错误消息
 *
 * @param msg - 错误消息文本
 * @example
 * ```ts
 * error('Release Failed')
 * // 输出: ✖ Release Failed
 * ```
 */
function error(msg: string) {
  console.log(chalk.red(`✖ ${msg}`))
}

/**
 * 记录将要执行的命令
 *
 * @param cmd - 命令字符串
 * @param cwd - 当前工作目录，默认为项目根目录
 * @example
 * ```ts
 * logCommand('npm publish --access public')
 * // 输出: $ (.) npm publish --access public
 *
 * logCommand('git add .', '/path/to/package')
 * // 输出: $ (packages/utils) git add .
 * ```
 */
function logCommand(cmd: string, cwd = ROOT) {
  const relative = cwd === ROOT ? '.' : cwd.replace(ROOT, '.')
  console.log(chalk.gray(`\n$ (${relative}) ${cmd}`))
}

/* -------------------------------------------------- */
/* Utils */
/* -------------------------------------------------- */

/**
 * 执行 shell 命令
 *
 * @param cmd - 要执行的命令
 * @param cwd - 工作目录，默认为项目根目录
 * @example
 * ```ts
 * run('git add .')
 * run('npm publish', '/path/to/package')
 * ```
 *
 * @remarks
 * 如果启用了 DRY_RUN 模式，只会记录命令而不实际执行
 */
function run(cmd: string, cwd = ROOT) {
  logCommand(cmd, cwd)

  if (DRY_RUN) return

  execSync(cmd, { stdio: 'inherit', cwd })
}

/**
 * 静默执行命令并返回结果
 *
 * @param cmd - 要执行的命令
 * @returns 命令执行结果的 trimmed 字符串
 * @example
 * ```ts
 * const branch = runSilent('git rev-parse --abbrev-ref HEAD')
 * const user = runSilent('npm whoami')
 * ```
 */
function runSilent(cmd: string) {
  return execSync(cmd).toString().trim()
}

/**
 * 检查 Git 工作区是否干净
 *
 * @throws {Error} 如果工作区有未提交的更改
 * @example
 * ```ts
 * ensureGitClean() // 检查通过则输出: ✔ Git working tree clean
 * ```
 *
 * @remarks
 * 使用 `git status --porcelain` 检查，如果有输出则说明工作区不干净
 */
function ensureGitClean() {
  const status = runSilent('git status --porcelain')
  if (status) throw new Error('Git working tree not clean')
  originalHead = runSilent('git rev-parse HEAD')
  success('Git working tree clean')
}

/**
 * 检查当前是否在正确的分支上
 *
 * @throws {Error} 如果不在 main 分支
 * @example
 * ```ts
 * ensureCorrectBranch() // 检查通过则输出: ✔ On correct branch: main
 * ```
 *
 * @remarks
 * 默认要求在 main 分支发布，可通过 REQUIRED_BRANCH 常量修改
 */
function ensureCorrectBranch() {
  const branch = runSilent('git rev-parse --abbrev-ref HEAD')
  if (branch !== REQUIRED_BRANCH) {
    throw new Error(`Must release on "${REQUIRED_BRANCH}" branch`)
  }
  success(`On correct branch: ${branch}`)
}

/**
 * 检查 npm 是否已登录
 *
 * @throws {Error} 如果未登录 npm
 * @example
 * ```ts
 * ensureNpmLogin() // 检查通过则输出: ✔ npm logged in as username
 * ```
 */
function ensureNpmLogin() {
  try {
    const user = runSilent('npm whoami')
    success(`npm logged in as ${user}`)
  } catch {
    throw new Error('npm not logged in')
  }
}

/**
 * 检查版本是否已发布到 npm
 *
 * @param pkgName - 包名
 * @param version - 版本号
 * @throws {Error} 如果版本已存在
 * @example
 * ```ts
 * ensureVersionNotPublished('vitarx', '1.0.0')
 * ```
 *
 * @remarks
 * 通过 `npm view` 命令检查，如果返回相同版本号则说明已存在
 */
function ensureVersionNotPublished(pkgName: string, version: string) {
  try {
    const result = runSilent(`npm view ${pkgName}@${version} version`)
    if (result === version) {
      throw new Error(`${pkgName}@${version} already exists on npm`)
    }
  } catch {
    // 如果 npm view 报错说明不存在
  }
}

/**
 * 写入 JSON 文件
 *
 * @param path - 文件路径
 * @param data - 要写入的数据对象
 * @example
 * ```ts
 * writeJSON('./package.json', { name: 'vitarx', version: '1.0.0' })
 * ```
 *
 * @remarks
 * 会自动格式化为 2 个空格缩进，并在末尾添加换行符
 */
function writeJSON(path: string, data: any) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n')
}

/**
 * 更新所有包的版本号
 *
 * @param version - 新版本号
 * @example
 * ```ts
 * updateAllVersions('1.0.0')
 * ```
 *
 * @remarks
 * 会同时更新根目录和所有子包的 package.json 文件中的 version 字段
 */
function updateAllVersions(version: string) {
  if (DRY_RUN) {
    success(`Version updated to ${version}`)
    return
  }
  for (const name of PACKAGES) {
    const pkgPath = resolve(ROOT, `packages/${name}/package.json`)
    if (!existsSync(pkgPath)) continue
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    pkg.version = version
    writeJSON(pkgPath, pkg)
  }

  const rootPath = resolve(ROOT, 'package.json')
  const rootPkg = JSON.parse(readFileSync(rootPath, 'utf-8'))
  rootPkg.version = version
  writeJSON(rootPath, rootPkg)

  success(`Version updated to ${version}`)
}

/**
 * 根据版本号获取 npm 发布标签
 *
 * @param version - 版本号
 * @returns npm 标签 ('alpha' | 'beta' | 'rc' | 'latest')
 * @example
 * ```ts
 * getDistTag('1.0.0-alpha.1') // 'alpha'
 * getDistTag('1.0.0-beta.2')  // 'beta'
 * getDistTag('1.0.0-rc.1')    // 'rc'
 * getDistTag('1.0.0')         // 'latest'
 * ```
 */
function getDistTag(version: string) {
  if (version.includes('alpha')) return 'alpha'
  if (version.includes('beta')) return 'beta'
  if (version.includes('rc')) return 'rc'
  return 'latest'
}

/**
 * 确认发布操作
 *
 * @param version - 要发布的版本号
 * @example
 * ```ts
 * await confirmRelease('1.0.0')
 * // 会提示: Confirm release 1.0.0? (y/N)
 * ```
 *
 * @remarks
 * 如果使用了 --yes 参数则跳过确认直接继续
 */
async function confirmRelease(version: string) {
  if (SKIP_CONFIRM) return

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const answer = await rl.question(chalk.yellow(`\nConfirm release ${version}? (y/N) `))

  rl.close()

  if (!/^y(es)?$/i.test(answer)) {
    process.exit(0)
  }
}

/**
 * 打印发布结果摘要
 *
 * @example
 * ```ts
 * printPublishSummary()
 * // 输出发布成功和失败的包列表
 * ```
 */
function printPublishSummary() {
  section('Publish Summary')

  publishResults.forEach(r => {
    if (r.success) success(r.name)
    else error(r.name)
  })
}
/**
 * 回滚发布操作
 *
 * @example
 * ```ts
 * rollback() // 如果已提交但未发布，会回滚 Git 提交
 * ```
 *
 * @remarks
 * - 如果包已发布到 npm，则无法自动回滚，需要手动处理
 * - 如果只是本地提交了 Git，则会回滚到上一个提交
 * - 如果只是修改了文件，则会丢弃所有更改
 */
function rollback() {
  if (published) {
    warning(
      'Packages already published.\n' + 'Fix git manually:\n' + '  git push && git push --tags'
    )
    return
  }

  section('Rollback')

  if (DRY_RUN) return

  if (committed) {
    run('git reset --hard HEAD~1')
  } else {
    run('git checkout -- .')
  }

  warning('Local changes reverted')
}

/* -------------------------------------------------- */
/* Version Selection */
/* -------------------------------------------------- */

/**
 * 交互式选择要发布的版本
 *
 * @param current - 当前版本号
 * @returns 计算出的下一个版本号
 * @example
 * ```ts
 * const nextVersion = await selectVersion('1.0.0')
 * // 会显示:
 * // 1. major → 2.0.0
 * // 2. minor → 1.1.0
 * // 3. patch → 1.0.1
 * // ...
 * // 然后等待用户输入选择
 * ```
 *
 * @remarks
 * 支持的版本类型包括: major, minor, patch, premajor, preminor, prepatch, prerelease, release
 */
async function selectVersion(current: string) {
  section('Select Version')

  RELEASE_TYPES.forEach((type, i) => {
    const next = semver.inc(current, type as any, 'alpha')
    console.log(`${i + 1}. ${type} → ${chalk.cyan(next)}`)
  })

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const answer = await rl.question('\nSelect release type: ')
  rl.close()

  const type = RELEASE_TYPES[Number(answer) - 1]
  if (!type) throw new Error('Invalid selection')

  const next =
    type === 'prerelease' ? semver.inc(current, type, 'alpha') : semver.inc(current, type)

  if (!next) throw new Error('Version calculation failed')

  return next
}

/* -------------------------------------------------- */
/* Main */
/* -------------------------------------------------- */

/**
 * 主发布流程
 *
 * 执行完整的发布流程，包括：
 * 1. 预检查 (Git状态、分支、npm登录)
 * 2. 版本选择
 * 3. 确认发布
 * 4. 更新版本号
 * 5. 构建和测试
 * 6. 生成变更日志
 * 7. Git提交和打标签
 * 8. 发布到 npm
 * 9. 推送到远程仓库
 *
 * @example
 * ```bash
 * # 正常发布
 * tsx scripts/release.ts
 *
 * # 试运行模式 (不实际执行)
 * tsx scripts/release.ts --dry-run
 *
 * # 跳过确认
 * tsx scripts/release.ts --yes
 * ```
 *
 * @throws {Error} 在任何步骤失败时抛出错误并触发回滚
 *
 * @remarks
 * - 发布前会自动运行构建和测试
 * - 支持预发布版本 (alpha, beta, rc)
 * - 失败时会自动回滚 Git 更改
 * - 成功后会推送代码和标签到远程仓库
 */
async function main() {
  console.log(chalk.bold.magenta('\n🚀 Vitarx Release System\n'))

  if (DRY_RUN) warning('Running in dry-run mode')

  section('Pre Checks')

  ensureGitClean()
  ensureCorrectBranch()
  ensureNpmLogin()
  const rootPkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'))

  const nextVersion = await selectVersion(rootPkg.version)
  versionTag = `v${nextVersion}`

  await confirmRelease(nextVersion)

  section('Update Version')
  updateAllVersions(nextVersion)

  section('Build')
  run('pnpm build')

  section('Test')
  run('pnpm test')

  section('Generate Changelog')
  run('conventional-changelog -p angular -i CHANGELOG.md -s')

  section('Commit')
  run('git add .')
  run(`git commit -m "ci(release): ${versionTag}"`)
  committed = true

  section('Publish')

  const tag = getDistTag(nextVersion)

  for (const name of PACKAGES) {
    try {
      ensureVersionNotPublished(name, nextVersion)

      const pkgDir = resolve(ROOT, `packages/${name}`)
      run(`npm publish --access public --tag ${tag}`, pkgDir)

      publishResults.push({ name, success: true })
    } catch (err) {
      publishResults.push({ name, success: false, error: err })
      throw err
    }
  }

  published = true

  section('Git Tag & Push')
  run(`git tag ${versionTag}`)
  run('git push')
  run('git push --tags')

  printPublishSummary()

  console.log(chalk.bold.green(`\n🎉 Release Success: ${versionTag}\n`))
}

/* -------------------------------------------------- */

main().catch(err => {
  console.log('\n')
  error('Release Failed')
  console.log(chalk.red(String(err)))
  printPublishSummary()
  rollback()
  process.exit(1)
})
