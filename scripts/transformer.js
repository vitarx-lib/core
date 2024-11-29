import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, writeFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const projectRoot = dirname(dirname(__filename)) // 获取项目根目录
export function replaceVersion() {
  // 读取 package.json 文件
  const packageJsonPath = join(projectRoot, 'package.json')
  const packageJsonContent = readFileSync(packageJsonPath, 'utf-8')
  const packageJson = JSON.parse(packageJsonContent)
  const version = packageJson.version
  const distPath = join(projectRoot, 'dist', 'core', 'renderer', 'app-renderer.js')
  const content = readFileSync(distPath, 'utf-8')
  const updatedContent = content.replace(/__VERSION__/g, version)
  writeFileSync(distPath, updatedContent, 'utf-8')
  console.log(`Version replaced with ${version} in ${distPath}`)
}
