/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  coveragePathIgnorePatterns: ['\\/dist\\/'],
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts'],
  transform: { "^.+\\.tsx?$": "es-jest" },
  watchPathIgnorePatterns: ['.*.js$'],
}
