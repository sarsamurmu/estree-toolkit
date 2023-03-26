/** @type import('@jest/types').Config.InitialOptions */
module.exports = {
  roots: ['__tests__'],
  testMatch: ['**/__tests__/**/*.test.js'],
  coverageReporters: ['lcov', 'text-summary'],
  collectCoverageFrom: ['dist/**/*.js'],
  moduleNameMapper: {
    '^<project>(.*)$': '<rootDir>/dist$1'
  },
  snapshotResolver: './snapshotResolver.js'
}
