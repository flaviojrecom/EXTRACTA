import type { Meta, StoryObj } from '@storybook/react';
import RootLayout from './layout';

const meta = {
  title: 'Templates/RootLayout',
  component: RootLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Root layout component for the application. ' +
          'Wraps all pages with global styling and HTML setup.',
      },
    },
  },
} satisfies Meta<typeof RootLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default root layout.
 * Shows basic layout structure with sample content.
 */
export const Default: Story = {
  render: () => (
    <RootLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-4">Sample Page</h1>
        <p className="text-zinc-400 mb-6">This is sample content rendered inside the RootLayout.</p>
        <div className="space-y-4">
          <div className="p-6 rounded-lg bg-zinc-900 border border-zinc-800">
            <h2 className="text-xl font-semibold text-white mb-2">Section 1</h2>
            <p className="text-zinc-400">Content section demonstrating the layout</p>
          </div>
          <div className="p-6 rounded-lg bg-zinc-900 border border-zinc-800">
            <h2 className="text-xl font-semibold text-white mb-2">Section 2</h2>
            <p className="text-zinc-400">Another content section</p>
          </div>
        </div>
      </div>
    </RootLayout>
  ),
};

/**
 * Layout with minimal content.
 * Tests layout with simple content.
 */
export const MinimalContent: Story = {
  render: () => (
    <RootLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-zinc-400">Minimal content example</p>
      </div>
    </RootLayout>
  ),
};

/**
 * Layout with extended content.
 * Tests layout with longer content.
 */
export const ExtendedContent: Story = {
  render: () => (
    <RootLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-4">Main Title</h1>
          <p className="text-zinc-400 leading-relaxed">
            This is a longer piece of content that demonstrates how the layout handles extended text.
            The layout should properly contain and display all of this content with appropriate spacing.
          </p>
        </div>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="p-6 rounded-lg bg-zinc-900 border border-zinc-800">
            <h2 className="text-xl font-semibold text-white mb-2">Section {i + 1}</h2>
            <p className="text-zinc-400">
              Content for section {i + 1}. This layout demonstrates how multiple sections stack properly.
            </p>
          </div>
        ))}
      </div>
    </RootLayout>
  ),
};
