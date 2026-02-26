import type { Meta, StoryObj } from '@storybook/react';
import { FileIcon } from './FileIcon';

const meta = {
  title: 'Components/FileIcon',
  component: FileIcon,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'File icon SVG component with checkmark. Displays a document with a success indicator. ' +
          'Used to show successful file uploads or processed documents.',
      },
    },
  },
} satisfies Meta<typeof FileIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default file icon.
 * Shows standard styling with emerald checkmark.
 */
export const Default: Story = {
  render: () => <FileIcon />,
};

/**
 * Icon on light background.
 * Tests contrast and visibility on light surfaces.
 */
export const OnLightBackground: Story = {
  render: () => (
    <div className="bg-white p-12 rounded-lg">
      <FileIcon />
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
      <FileIcon />
    </div>
  ),
};

/**
 * Icon in success message context.
 * Shows icon as part of a confirmation/success UI.
 */
export const InSuccessMessage: Story = {
  render: () => (
    <div className="border border-emerald-900/30 bg-emerald-950/20 rounded-lg p-8 text-center max-w-xs">
      <FileIcon />
      <p className="text-emerald-400 font-medium mt-4">
        Upload Successful
      </p>
      <p className="text-zinc-400 text-sm mt-2">
        Your document has been processed successfully
      </p>
    </div>
  ),
};

/**
 * Icon size and color variations.
 * Gallery showing different usage contexts and themes.
 */
export const VariationsGallery: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8 bg-zinc-950 rounded-lg">
      <div className="flex gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 32 32" fill="none">
              <path d="M8 4h10l8 8v16a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" />
              <path d="M18 4v8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M12 20l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-xs text-zinc-400">Default - Green</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 flex items-center justify-center">
            <svg className="w-12 h-12 text-blue-400" viewBox="0 0 32 32" fill="none">
              <path d="M8 4h10l8 8v16a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" />
              <path d="M18 4v8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M12 20l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-xs text-zinc-400">Large - Blue</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-400" viewBox="0 0 32 32" fill="none">
              <path d="M8 4h10l8 8v16a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" />
              <path d="M18 4v8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M12 20l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-xs text-zinc-400">Small - Amber</span>
        </div>
      </div>
    </div>
  ),
};

/**
 * Icon in file list item.
 * Shows icon as part of a processed file entry.
 */
export const InFileListItem: Story = {
  render: () => (
    <div className="flex items-center gap-3 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
      <FileIcon />
      <div className="flex-1">
        <p className="text-white text-sm font-medium">document.pdf</p>
        <p className="text-zinc-400 text-xs">Processed • 2.4 MB</p>
      </div>
      <span className="text-emerald-400 text-xs font-medium">Done</span>
    </div>
  ),
};
