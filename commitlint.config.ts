import { RuleConfigSeverity } from '@commitlint/types'

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      RuleConfigSeverity.Error,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'ci']
    ],
    'subject-empty': [RuleConfigSeverity.Error, 'never'],
    'scope-empty': [0],
    'body-max-line-length': [RuleConfigSeverity.Error, 'always', 200]
  }
}
