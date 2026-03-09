import type { StorybookConfig } from '@storybook/nextjs-vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: [
    {
      directory: '../web/app',
      files: '**/*.stories.{ts,tsx}',
      titlePrefix: 'Pages',
    },
    {
      directory: '../web/components',
      files: '**/*.stories.{ts,tsx}',
      titlePrefix: 'Components',
    },
    {
      directory: '../.aios-core/scripts/diagnostics/health-dashboard/src/components',
      files: '**/*.stories.{ts,tsx}',
      titlePrefix: 'Health Dashboard',
    },
  ],

  addons: [
    '@storybook/addon-links',
    '@storybook/addon-a11y',
    '@storybook/addon-themes'
  ],

  framework: '@storybook/nextjs-vite',

  typescript: {
    reactDocgen: 'react-docgen',
    check: false,
  },

  viteFinal: async (config) => {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          '@': path.resolve(__dirname, '../web'),
          '@extracta': path.resolve(__dirname, '../src'),
        },
      },
    };
  },

  webpackFinal: async (config) => {
    return config;
  }
};

export default config;
