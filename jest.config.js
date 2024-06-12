/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageReporters: ['json', 'html', 'text', 'text-summary'],
  testTimeout: 30000,
  transform: {
    '^.+\\.[tj]s$': 'ts-jest',
  },
};
