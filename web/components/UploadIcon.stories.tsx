import type { Meta, StoryObj } from '@storybook/react';
import { UploadIcon } from './UploadIcon';

const meta = {
  title: 'Components/UploadIcon',
  component: UploadIcon,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Upload icon SVG component. Displays an upload arrow with dashed box outline. ' +
          'Used in file upload zones and drop areas.',
      },
    },
  },
} satisfies Meta<typeof UploadIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default upload icon.
 * Shows standard styling with gray color.
 */
export const Default: Story = {
  render: () => <UploadIcon />,
};

/**
 * Icon on light background.
 * Tests contrast and visibility on light surfaces.
 */
export const OnLightBackground: Story = {
  render: () => (
    <div className="bg-white p-12 rounded-lg">
      <UploadIcon />
    </div>
  ),
};

/**
 * Icon on dark background.
 * Tests contrast and visibility on dark surfaces.
 */
export const OnDarkBackground: Story = {
  render: () => (
    <div className="bg-zinc-900 p-12 rounded-lg">
      <UploadIcon />
    </div>
  ),
};

/**
 * Icon in upload zone context.
 * Shows icon as part of a drop zone UI.
 */
export const InUploadZone: Story = {
  render: () => (
    <div className="border-2 border-dashed border-zinc-700 rounded-lg p-12 text-center">
      <UploadIcon />
      <p className="text-zinc-400 text-sm mt-4">
        Drag & drop your document here
      </p>
      <p className="text-zinc-500 text-xs mt-2">
        or click to browse files
      </p>
    </div>
  ),
};

/**
 * Icon sizes and color variations.
 * Gallery showing different usage contexts.
 */
export const VariationsGallery: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8 bg-zinc-950 rounded-lg">
      <div className="flex gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 flex items-center justify-center">
            <svg className="w-10 h-10 text-zinc-600" viewBox="0 0 40 40" fill="none">
              <rect x="4" y="8" width="32" height="28" rx="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
              <path d="M20 28V16M20 16l-5 5M20 16l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-xs text-zinc-400">Default Size</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 flex items-center justify-center">
            <svg className="w-16 h-16 text-blue-500" viewBox="0 0 40 40" fill="none">
              <rect x="4" y="8" width="32" height="28" rx="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
              <path d="M20 28V16M20 16l-5 5M20 16l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-xs text-zinc-400">Large - Blue</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 40 40" fill="none">
              <rect x="4" y="8" width="32" height="28" rx="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
              <path d="M20 28V16M20 16l-5 5M20 16l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-xs text-zinc-400">Small - Green</span>
        </div>
      </div>
    </div>
  ),
};
