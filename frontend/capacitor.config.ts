import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aitaskbot.app',
  appName: 'AI Task Bot',
  webDir: 'dist',
  server: {
    cleartext: true
  }
};

export default config;
