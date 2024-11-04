import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// 获取当前模块目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const cleanJsFiles = dir => {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(file => {
      const filePath = path.join(dir, file)
      if (fs.lstatSync(filePath).isDirectory()) {
        cleanJsFiles(filePath) // 递归处理子目录
      } else if (file.endsWith('.js')) {
        fs.unlinkSync(filePath) // 删除 .js 文件
      }
    })
  }
}

// 执行清理
cleanJsFiles(path.join(__dirname, '../dist/types'))
