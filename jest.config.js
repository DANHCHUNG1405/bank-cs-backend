module.exports = {
  testEnvironment: "node",
  verbose: true,
  collectCoverageFrom: [
    "api/**/*.js",
    "!api/**/*.routes.js",
    "!**/node_modules/**",
  ],
  coverageDirectory: "coverage",
  testMatch: ["**/__tests__/**/*.test.js", "**/*.test.js"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testTimeout: 30000,
  modulePathIgnorePatterns: ["<rootDir>/node_modules/"],
};
