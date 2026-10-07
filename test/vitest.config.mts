import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    include: ['test/e2e/app.e2e-spec.ts', 'test/unit/app.spec.ts'],
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['html', 'lcov', 'text-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/prisma/build/**', '**/*-res.dto.ts'],
    },
  },
});
