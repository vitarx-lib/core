import chalk from 'chalk'
import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import semver from 'semver'

const args = process.argv.slice(2)

if (!args.length) {
  console.error(chalk.red('Error: Please specify the package name to publish'))
  process.exit(1)
}

const packageName = args[0]
const packagePath = resolve(process.cwd(), 'packages', packageName)
const changelogPath = resolve(process.cwd(), 'CHANGELOG.md')
let versionArg: string | undefined = args[1]
let preid: string | undefined = args[2]

// Step 0: 验证包是否存在
if (!existsSync(packagePath)) {
  console.error(chalk.red(`Error: Package '${packageName}' not found in packages directory`))
  process.exit(1)
}

// Step 1: 检查 npm 登录
try {
  execSync('pnpm whoami --registry https://registry.npmjs.org/', { stdio: 'ignore' })
} catch (e) {
  console.error(
    chalk.red(
      'Error: You are not logged in to npm. Please run `pnpm login --registry https://registry.npmjs.org/` first'
    )
  )
  process.exit(1)
}

// Step 2: 读取当前版本号
const pkgJsonPath = resolve(packagePath, 'package.json')
const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
let currentVersion = pkg.version

// Step 3: 确定新版本号
let newVersion
if (versionArg) {
  if (
    [
      'major',
      'premajor',
      'minor',
      'preminor',
      'patch',
      'prepatch',
      'prerelease',
      'release'
    ].includes(versionArg)
  ) {
    if (versionArg === 'prerelease') {
      newVersion = semver.inc(currentVersion, 'prerelease', preid) as string
    } else {
      newVersion = semver.inc(currentVersion, versionArg as semver.ReleaseType) as string
    }
  } else {
    if (!semver.valid(versionArg)) {
      console.error(chalk.red(`Error: Invalid version number '${versionArg}'`))
      process.exit(1)
    }
    newVersion = versionArg
  }
} else {
  if (currentVersion.includes('-')) {
    newVersion = semver.inc(currentVersion, 'prerelease', preid) as string
  } else {
    newVersion = semver.inc(currentVersion, 'patch') as string
  }
}

// Step 4: 更新 package.json
pkg.version = newVersion
writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2))

// Step 5: 构建包
console.log(chalk.blue(`📦 Building package: ${packageName}...`))
try {
  execSync(`pnpm tsx scripts/build.ts ${packageName}`, { stdio: 'inherit' })
} catch (error) {
  console.error(chalk.red(`❌ Build failed for ${packageName}`))
  process.exit(1)
}

// Step 6: 生成根目录 CHANGELOG.md
console.log(chalk.blue('📝 Generating CHANGELOG.md...'))

// 获取上一个 tag
let lastTag
try {
  lastTag = execSync(`git describe --tags --abbrev=0 ${packageName}@${currentVersion}`)
    .toString()
    .trim()
} catch {
  // 没有找到 tag，则从头生成
  lastTag = ''
}
let changelogCmd = `npx conventional-changelog -p angular -i ${changelogPath} -s --commit-path packages/${packageName} --lerna-package ${packageName}`
if (lastTag) {
  changelogCmd += ` --tag-prefix ${packageName}@ --from ${lastTag}`
}

execSync(changelogCmd, { stdio: 'inherit' })
// Step 7: 提交 package.json + CHANGELOG.md
console.log(chalk.blue('📤 Committing changes...'))
try {
  execSync(`git add ${pkgJsonPath} ${changelogPath}`, { stdio: 'inherit' })
  execSync(`git commit -m "build(${packageName}): release v${newVersion}"`, { stdio: 'inherit' })
} catch {
  console.log(chalk.yellow('⚠️  Nothing to commit'))
}

// Step 8: 打 tag
const tagName = `${packageName}@${newVersion}`
console.log(chalk.blue(`🏷  Tagging: ${tagName}`))
execSync(`git tag ${tagName}`, { stdio: 'inherit' })

// Step 9: 发布到 npm
console.log(chalk.blue(`🚀 Publishing ${packageName}@${newVersion}...`))
try {
  execSync(`pnpm publish --access public --registry https://registry.npmjs.org/`, {
    stdio: 'inherit',
    cwd: packagePath
  })
} catch (error) {
  console.error(chalk.red('❌ Publish failed, rolling back git commit and tag...'))
  try {
    execSync(`git reset --soft HEAD~1`, { stdio: 'inherit' })
    execSync(`git tag -d ${tagName}`, { stdio: 'inherit' })
  } catch {}
  process.exit(1)
}

// Step 10: 推送到远程
console.log(chalk.blue('⬆️  Pushing to remote...'))
execSync('git push', { stdio: 'inherit' })
execSync('git push --tags', { stdio: 'inherit' })

console.log(chalk.green(`\n✨ Successfully built and published ${packageName}@${newVersion}!`))
