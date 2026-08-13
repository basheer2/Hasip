import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.electrician.dailyaccounting',
  appName: 'الحساب اليومي',
  webDir: 'out',
  backgroundColor: '#2563eb',
  android: {
    allowMixedContent: false,
  },
  server: {
    androidScheme: 'https',
  },
}

export default config
