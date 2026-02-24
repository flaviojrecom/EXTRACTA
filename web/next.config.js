import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf-parse', 'js-tiktoken'],
  webpack: (config) => {
    config.resolve.alias['@extracta'] = resolve(__dirname, '../src');
    // Allow .js imports to resolve to .ts files (Node ESM convention used in src/)
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
    };
    return config;
  },
};

export default nextConfig;
