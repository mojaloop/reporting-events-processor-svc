module.exports = {
  preset: '@shelf/jest-mongodb',
  collectCoverage: false,
  coverageReporters: ['json', 'lcov', 'text'],
  coverageThreshold: {
    global: {
      statements: 70,
      functions: 70,
      branches: 70,
      lines: 70
    }
  }
}
