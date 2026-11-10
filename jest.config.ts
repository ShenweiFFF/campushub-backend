import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],
  testTimeout: 120000,
  clearMocks: true,
  collectCoverageFrom: ["src/services/**/*.ts", "src/controllers/**/*.ts"],
  coverageThreshold: {
    "src/services/": {
      statements: 80,
      branches: 80,
    },
    "src/controllers/": {
      statements: 80,
      branches: 80,
    },
  },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.jest.json",
        compiler: "@typescript/typescript6",
      },
    ],
  },
};

module.exports = config;
