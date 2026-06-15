import { defineConfig } from 'vitest/config';
import { inlinedBinary, inlinedWorker } from './vite.config.js';

export default defineConfig({
    plugins: [inlinedWorker(), inlinedBinary()],
    test: {
        include: ['tests/**/*.test.ts'],
        environment: 'node',
        testTimeout: 30000,
    },
});
