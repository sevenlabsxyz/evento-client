import nextJest from 'next/jest';

const createJestConfig = nextJest({
  dir: './',
});

const config = {
  testEnvironment: 'jest-environment-jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node', ''], // Prioritize 'node' condition, then fallback to default
  },
  setupFiles: ['<rootDir>/__tests__/setup/jest.polyfills.ts'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
  },
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testMatch: ['**/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  collectCoverageFrom: ['lib/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', '!**/*.d.ts'],
};

export default createJestConfig(config);
