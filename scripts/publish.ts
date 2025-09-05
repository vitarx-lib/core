/**
 * 包发布脚本
 * 功能：
 * 1. 支持自定义版本号或自动升级 (patch/minor/major/prerelease)
 * 2. prerelease 支持 --preid
 * 3. 生成 CHANGELOG.md
 * 4. 自动 git commit + tag
 * 5. 发布到 npm
 * 6. git push && git push --tags
 */

import chalk from 'chalk'
import { execSync, spawnSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import semver from 'semver'

const args = process.argv.slice(2)

if (!args.length) {
  console.error(chalk.red('Error: Please specify the package name'))
  console.log(
    chalk.yellow(
      'Usage: pnpm tsx scripts/publish.ts <package-name> [version|patch|minor|major|prerelease] [--preid beta]'
    )
  )
  process.exit(1)
}

const packageName = args[0]
const packagePath = resolve(process.cwd(), 'packages', packageName)
if (!existsSync(packagePath)) {
  console.error(chalk.red(`Error: Package '${packageName}' not found`))
  process.exit(1)
}

const versionArg = args[1] // 可能是 patch / minor / major / prerelease / 1.2.3
const preidArgIndex = args.indexOf('--preid')
const preid = preidArgIndex !== -1 ? args[preidArgIndex + 1] : undefined

// 检查 npm 登录状态
try {
  execSync('pnpm whoami --registry https://registry.npmjs.org/', { stdio: 'ignore' })
} catch {
  console.error(
    chalk.red('Error: Not logged in. Run `pnpm login --registry https://registry.npmjs.org/` first')
  )
  process.exit(1)
}

// Step 1: 构建
console.log(chalk.blue(`📦 Building package: ${packageName}...`))
const buildResult = spawnSync('tsx', ['scripts/build.ts', packageName, '--test'], {
  stdio: 'inherit'
})
// 检查构建结果
if (buildResult.status !== 0) process.exit(buildResult.status)

// Step 2: 更新版本号
let versionCmd = `pnpm version --no-git-tag-version -C ./packages/${packageName}`
if (versionArg) {
  if (['patch', 'minor', 'major', 'prerelease'].includes(versionArg)) {
    versionCmd += ` ${versionArg}`
    if (versionArg === 'prerelease' && preid) {
      versionCmd += ` --preid ${preid}`
    }
  } else {
    // 用户输入自定义版本号，需要验证
    if (!semver.valid(versionArg)) {
      console.error(chalk.red(`Error: Invalid version number '${versionArg}'`))
      process.exit(1)
    }
    versionCmd += ` ${versionArg}`
  }
}
console.log(chalk.blue(`🔖 Updating version (${versionArg || 'patch'})...`))
execSync(versionCmd, { stdio: 'inherit' })

// 读取更新后的版本号
const pkgJson = JSON.parse(readFileSync(resolve(packagePath, 'package.json'), 'utf-8'))
const newVersion = pkgJson.version

// Step 3: 生成 CHANGELOG.md
console.log(chalk.blue(`📝 Generating CHANGELOG for ${packageName}...`))
const changelogPath = resolve(packagePath, 'CHANGELOG.md')
execSync(
  `pnpm dlx conventional-changelog-cli -p angular -i ${changelogPath} -s -r 0 --commit-path ${packagePath}`,
  { stdio: 'inherit' }
)

try {
  // Step 4: 提交 git
  console.log(chalk.blue('📤 Committing changes...'))
  execSync(`git add ${packagePath}/package.json ${changelogPath}`, { stdio: 'inherit' })
  execSync(`git commit -m "build(${packageName}): release v${newVersion}"`, { stdio: 'inherit' })

  // 打标签
  execSync(`git tag v${newVersion}`, { stdio: 'inherit' })

  // Step 5: 发布到 npm
  console.log(chalk.blue(`🚀 Publishing ${packageName}@${newVersion}...`))
  execSync(`pnpm publish --access public --registry https://registry.npmjs.org/`, {
    stdio: 'inherit',
    cwd: packagePath
  })

  // Step 6: 推送到远程
  console.log(chalk.blue('⬆️  Pushing to remote...'))
  execSync(`git push`, { stdio: 'inherit' })
  execSync(`git push --tags`, { stdio: 'inherit' })

  console.log(chalk.green(`\n✨ Successfully published ${packageName}@${newVersion}!`))
} catch (error) {
  console.error(chalk.red('\n❌ Publish failed, rolling back git commit and tag...'))
  try {
    execSync(`git tag -d v${newVersion}`, { stdio: 'inherit' })
    execSync(`git reset --soft HEAD~1`, { stdio: 'inherit' })
  } catch (rollbackErr) {
    console.error(chalk.red('Rollback failed:'), rollbackErr)
  }
  console.error(error)
  process.exit(1)
}

console.log(chalk.green(`\n✨ Successfully published ${packageName}@${newVersion}!`))
