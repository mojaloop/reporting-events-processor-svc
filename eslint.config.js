const js = require('@eslint/js')

module.exports = [
  {
    ignores: [
      'coverage/**',
      'templates/**',
      'docs/**',
      'examples/**',
      '**/node_modules/**',
      '**/*.test.js'
    ]
  },
  {
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        ...require('globals').node,
        ...require('globals').jest
      }
    },
    rules: {
      'no-console': 'off',
      'indent': ['error', 2],
      'quotes': ['error', 'single'],
      'linebreak-style': ['error', 'unix'],
      'semi': ['error', 'never']
    }
  }
]
