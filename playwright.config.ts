import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'https://community-ride.lovable.app',
    headless: true,
    viewport: { width: 1280, height: 720 },
    permissions: ['notifications'],
    actionTimeout: 10000,
    navigationTimeout: 20000,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
});