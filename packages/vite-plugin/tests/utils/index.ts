import { type CompileOptions, transform } from '../../src/transform.js'

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

export async function compile(
  code: string,
  options: CompileOptions = defaultOptions
): Promise<string> {
  const result = await transform(code, '/test.tsx', options)
  return result?.code ?? ''
}
