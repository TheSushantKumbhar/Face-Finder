import * as dotenv from 'dotenv';
import { ExpoConfig } from '@expo/config';
import path from 'path';

const env = process.env.APP_ENV || 'development';
const envPath = path.resolve(__dirname, env === 'production' ? '.env.production' : '.env.development');

dotenv.config({ path: envPath, override: true });

export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
  return {
    ...config,
    extra: {
      BASE_URL: process.env.EXPO_PUBLIC_BASE_URL,
    },
  };
};