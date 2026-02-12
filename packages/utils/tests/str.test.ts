import { describe, expect, it } from 'vitest'
import { toCamelCase, toKebabCase, toCapitalize } from '../src/str'

describe('toCamelCase', () => {
  it('should convert kebab-case to camelCase', () => {
    expect(toCamelCase('hello-world')).toBe('helloWorld')
  })

  it('should convert multiple hyphens', () => {
    expect(toCamelCase('my-long-variable-name')).toBe('myLongVariableName')
  })

  it('should handle single word', () => {
    expect(toCamelCase('hello')).toBe('hello')
  })

  it('should handle empty string', () => {
    expect(toCamelCase('')).toBe('')
  })

  it('should handle already camelCase', () => {
    expect(toCamelCase('alreadyCamel')).toBe('alreadyCamel')
  })

  it('should handle consecutive hyphens', () => {
    expect(toCamelCase('hello--world')).toBe('hello-World')
  })

  it('should handle hyphen at the end', () => {
    expect(toCamelCase('hello-')).toBe('hello-')
  })

  it('should handle hyphen at the start', () => {
    expect(toCamelCase('-hello')).toBe('Hello')
  })

  it('should only convert lowercase letters after hyphen', () => {
    expect(toCamelCase('hello-WORLD')).toBe('hello-WORLD')
  })

  it('should handle mixed case', () => {
    expect(toCamelCase('my-variable-name')).toBe('myVariableName')
  })
})

describe('toKebabCase', () => {
  it('should convert camelCase to kebab-case', () => {
    expect(toKebabCase('helloWorld')).toBe('hello-world')
  })

  it('should convert multiple uppercase letters', () => {
    expect(toKebabCase('myLongVariableName')).toBe('my-long-variable-name')
  })

  it('should handle single word', () => {
    expect(toKebabCase('hello')).toBe('hello')
  })

  it('should handle empty string', () => {
    expect(toKebabCase('')).toBe('')
  })

  it('should handle already kebab-case', () => {
    expect(toKebabCase('already-kebab')).toBe('already-kebab')
  })

  it('should handle single uppercase letter', () => {
    expect(toKebabCase('A')).toBe('-a')
  })

  it('should handle consecutive uppercase letters', () => {
    expect(toKebabCase('XMLHttpRequest')).toBe('-x-m-l-http-request')
  })

  it('should handle starting uppercase', () => {
    expect(toKebabCase('HelloWorld')).toBe('-hello-world')
  })

  it('should convert uppercase to lowercase', () => {
    expect(toKebabCase('HELLO')).toBe('-h-e-l-l-o')
  })
})

describe('toCapitalize', () => {
  it('should capitalize first letter', () => {
    expect(toCapitalize('hello')).toBe('Hello')
  })

  it('should capitalize first letter of sentence', () => {
    expect(toCapitalize('hello world')).toBe('Hello world')
  })

  it('should handle empty string', () => {
    expect(toCapitalize('')).toBe('')
  })

  it('should handle single character', () => {
    expect(toCapitalize('a')).toBe('A')
  })

  it('should not change already capitalized string', () => {
    expect(toCapitalize('Hello')).toBe('Hello')
  })

  it('should only capitalize first letter', () => {
    expect(toCapitalize('hELLO')).toBe('HELLO')
  })

  it('should handle string starting with number', () => {
    expect(toCapitalize('123abc')).toBe('123abc')
  })

  it('should handle string starting with special character', () => {
    expect(toCapitalize('-test')).toBe('-test')
  })

  it('should preserve rest of string', () => {
    expect(toCapitalize('hello World')).toBe('Hello World')
  })

  it('should return correct type', () => {
    const result: 'Hello' = toCapitalize('hello')
    expect(result).toBe('Hello')
  })
})
