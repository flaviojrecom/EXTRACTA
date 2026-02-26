import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: [
    '../web/app/**/*.stories.{ts,tsx}',
    '../.aios-core/scripts/diagnostics/health-dashboard/src/components/**/*.stories.{ts,tsx}',
  ],

  addons: [
    '@storybook/addon-links',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
  ],

  framework: '@storybook/nextjs',

  docs: {
    autodocs: 'tag',
  },

  typescript: {
    reactDocgen: 'react-docgen',
    check: false,
  },

  webpackFinal: async (config) => {
    return config;
  },
};

export default config;
