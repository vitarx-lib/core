import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { Logger, LogLevel, logger, getStackTrace, getCallSource, CodeSource } from '../src/logger'

describe('Logger', () => {
  let consoleDebugSpy: any
  let consoleInfoSpy: any
  let consoleWarnSpy: any
  let consoleErrorSpy: any

  beforeEach(() => {
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should create logger with default config', () => {
      const log = new Logger()
      const config = log.getConfig()
      expect(config).toHaveProperty('level')
      expect(config).toHaveProperty('includeSourceInfo')
      expect(config.prefix).toBe('')
    })

    it('should create logger with custom config', () => {
      const log = new Logger({ level: LogLevel.ERROR, prefix: 'Test' })
      const config = log.getConfig()
      expect(config.level).toBe(LogLevel.ERROR)
      expect(config.prefix).toBe('Test')
    })
  })

  describe('setConfig', () => {
    it('should merge config with existing config', () => {
      const log = new Logger({ level: LogLevel.DEBUG })
      log.setConfig({ prefix: 'NewPrefix' })
      const config = log.getConfig()
      expect(config.level).toBe(LogLevel.DEBUG)
      expect(config.prefix).toBe('NewPrefix')
    })

    it('should return this for chaining', () => {
      const log = new Logger()
      const result = log.setConfig({ level: LogLevel.INFO })
      expect(result).toBe(log)
    })
  })

  describe('getConfig', () => {
    it('should return a copy of config', () => {
      const log = new Logger({ level: LogLevel.WARN })
      const config1 = log.getConfig()
      const config2 = log.getConfig()
      expect(config1).not.toBe(config2)
      expect(config1).toEqual(config2)
    })
  })

  describe('log levels', () => {
    it('should log debug message', () => {
      const log = new Logger({ level: LogLevel.DEBUG })
      log.debug('test message')
      expect(consoleDebugSpy).toHaveBeenCalled()
    })

    it('should log info message', () => {
      const log = new Logger({ level: LogLevel.DEBUG })
      log.info('test message')
      expect(consoleInfoSpy).toHaveBeenCalled()
    })

    it('should log warn message', () => {
      const log = new Logger({ level: LogLevel.DEBUG })
      log.warn('test message')
      expect(consoleWarnSpy).toHaveBeenCalled()
    })

    it('should log error message', () => {
      const log = new Logger({ level: LogLevel.DEBUG })
      log.error('test message')
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should compare log levels using string comparison', () => {
      const log = new Logger({ level: LogLevel.ERROR })
      log.debug('debug message')
      log.warn('warn message')
      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalled()
    })

    it('should log error regardless of level', () => {
      const log = new Logger({ level: LogLevel.ERROR })
      log.error('error message')
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('formatMessage', () => {
    it('should format message with level', () => {
      const log = new Logger({ prefix: '' })
      const formatted = log.formatMessage(LogLevel.INFO, 'test message')
      expect(formatted).toBe('[Info] test message')
    })

    it('should format message with prefix', () => {
      const log = new Logger({ prefix: 'App' })
      const formatted = log.formatMessage(LogLevel.WARN, 'warning message')
      expect(formatted).toBe('[App Warn] warning message')
    })

    it('should not add space if message starts with space', () => {
      const log = new Logger({ prefix: '' })
      const formatted = log.formatMessage(LogLevel.INFO, ' already spaced')
      expect(formatted).toBe('[Info] already spaced')
    })

    it('should not add space if message starts with bracket', () => {
      const log = new Logger({ prefix: '' })
      const formatted = log.formatMessage(LogLevel.INFO, '[tag] message')
      expect(formatted).toBe('[Info][tag] message')
    })

    it('should include source info when enabled', () => {
      const log = new Logger({ includeSourceInfo: true })
      const source: CodeSource = {
        fileName: '/path/to/file.ts',
        lineNumber: 42,
        columnNumber: 10
      }
      const formatted = log.formatMessage(LogLevel.ERROR, 'error message', source)
      expect(formatted).toContain('[Error] error message')
      expect(formatted).toContain('file.ts:42:10')
    })

    it('should not include source info when disabled', () => {
      const log = new Logger({ includeSourceInfo: false })
      const source: CodeSource = {
        fileName: '/path/to/file.ts',
        lineNumber: 42,
        columnNumber: 10
      }
      const formatted = log.formatMessage(LogLevel.ERROR, 'error message', source)
      expect(formatted).not.toContain('file.ts:42:10')
    })

    it('should extract short filename from path', () => {
      const log = new Logger({ includeSourceInfo: true })
      const source: CodeSource = {
        fileName: '/very/long/path/to/some/file.ts',
        lineNumber: 1,
        columnNumber: 1
      }
      const formatted = log.formatMessage(LogLevel.DEBUG, 'msg', source)
      expect(formatted).toContain('file.ts:1:1')
      expect(formatted).not.toContain('/very/long/path')
    })
  })

  describe('source info in args', () => {
    it('should extract source info from last argument', () => {
      const log = new Logger({ level: LogLevel.DEBUG, includeSourceInfo: true })
      const source: CodeSource = {
        fileName: 'test.ts',
        lineNumber: 10,
        columnNumber: 5
      }
      log.info('message', source)
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('test.ts:10:5'),
      )
    })

    it('should pass remaining args to console', () => {
      const log = new Logger({ level: LogLevel.DEBUG })
      log.info('message', { data: 123 }, 'extra')
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.any(String),
        { data: 123 },
        'extra'
      )
    })
  })

  describe('custom handler', () => {
    it('should call custom handler instead of console', () => {
      const handler = vi.fn()
      const log = new Logger({ level: LogLevel.DEBUG, handler })
      log.info('test message', { key: 'value' })

      expect(handler).toHaveBeenCalledWith(
        LogLevel.INFO,
        'test message',
        [{ key: 'value' }],
        undefined
      )
    })

    it('should call handler with source info', () => {
      const handler = vi.fn()
      const log = new Logger({ level: LogLevel.DEBUG, handler, includeSourceInfo: true })
      const source: CodeSource = { fileName: 'test.ts', lineNumber: 1, columnNumber: 1 }
      log.error('error', source)

      expect(handler).toHaveBeenCalledWith(
        LogLevel.ERROR,
        'error',
        [],
        source
      )
    })
  })
})

describe('logger instance', () => {
  it('should be a Logger instance', () => {
    expect(logger).toBeInstanceOf(Logger)
  })

  it('should have Vitarx prefix', () => {
    const config = logger.getConfig()
    expect(config.prefix).toBe('Vitarx')
  })
})

describe('getStackTrace', () => {
  it('should return a string', () => {
    const stack = getStackTrace()
    expect(typeof stack).toBe('string')
  })

  it('should return empty string if no stack available', () => {
    const originalError = global.Error
    class MockError {
      stack = undefined
    }
    global.Error = MockError as any

    const stack = getStackTrace()
    expect(stack).toBe('')

    global.Error = originalError
  })

  it('should skip specified number of frames', () => {
    const stack0 = getStackTrace(0)
    const stack2 = getStackTrace(2)
    expect(stack0).not.toBe(stack2)
  })
})

describe('getCallSource', () => {
  it('should return CodeSource object', () => {
    const source = getCallSource()
    expect(source).toHaveProperty('fileName')
    expect(source).toHaveProperty('lineNumber')
    expect(source).toHaveProperty('columnNumber')
  })

  it('should return default values if no stack available', () => {
    const originalError = global.Error
    class MockError {
      stack = undefined
    }
    global.Error = MockError as any

    const source = getCallSource()
    expect(source).toEqual({
      fileName: 'unknown',
      lineNumber: 0,
      columnNumber: 0
    })

    global.Error = originalError
  })

  it('should return default values if stack format is unrecognized', () => {
    const originalError = global.Error
    class MockError {
      stack = 'Error\ninvalid stack format'
    }
    global.Error = MockError as any

    const source = getCallSource()
    expect(source).toEqual({
      fileName: 'unknown',
      lineNumber: 0,
      columnNumber: 0
    })

    global.Error = originalError
  })

  it('should parse stack with parentheses format', () => {
    const originalError = global.Error
    class MockError {
      stack = 'Error\n    at getCallSource (file:///path/to/test.ts:10:20)\n    at test (file:///path/to/caller.ts:30:40)'
    }
    global.Error = MockError as any

    const source = getCallSource()
    expect(source.fileName).toContain('caller.ts')
    expect(source.lineNumber).toBe(30)
    expect(source.columnNumber).toBe(40)

    global.Error = originalError
  })

  it('should parse stack without parentheses format', () => {
    const originalError = global.Error
    class MockError {
      stack = 'Error\n    at getCallSource file:///path/to/test.ts:10:20\n    at test file:///path/to/caller.ts:30:40'
    }
    global.Error = MockError as any

    const source = getCallSource()
    expect(source.fileName).toContain('caller.ts')

    global.Error = originalError
  })
})
