import { CompileOptions } from '../src/index'

export const defaultOptions: CompileOptions = {
  hmr: false,
  dev: false,
  ssr: false,
  runtimeModule: 'vitarx',
  sourceMap: false
}

export const devOptions: CompileOptions = {
  hmr: false,
  dev: true,
  ssr: false,
  runtimeModule: 'vitarx',
  sourceMap: false
}

export async function compile(code: string, options: CompileOptions = defaultOptions): Promise<string> {
  const { transform } = await import('../src/index')
  const result = await transform(code, '/test.tsx', options)
  return result?.code ?? ''
}
