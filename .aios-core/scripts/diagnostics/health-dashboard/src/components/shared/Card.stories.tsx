import type { Meta, StoryObj } from '@storybook/react';
import Card from './Card';

const meta = {
  title: 'Shared/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A card component that serves as a container for content. ' +
          'Provides consistent styling, spacing, and visual hierarchy for grouping related information.',
      },
    },
  },
  argTypes: {
    children: {
      control: false,
      description: 'The content to display inside the card',
      table: { type: { summary: 'React.ReactNode' } },
    },
    title: {
      control: 'text',
      description: 'Optional title to display at the top of the card',
      table: { type: { summary: 'string', default: 'undefined' } },
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the card',
      table: { type: { summary: 'string', default: 'undefined' } },
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default card with basic content.
 * Simple container for displaying information.
 */
export const Default: Story = {
  args: {
    children: <p className="text-zinc-400">Card content goes here</p>,
  },
};

/**
 * Card with title.
 * Shows how the card displays with a header title.
 */
export const WithTitle: Story = {
  args: {
    title: 'Card Title',
    children: (
      <div className="space-y-3">
        <p className="text-zinc-400">This is the main content of the card.</p>
        <p className="text-zinc-500 text-sm">Additional details can be placed here.</p>
      </div>
    ),
  },
};

/**
 * Card with list content.
 * Demonstrates card usage with structured list data.
 */
export const WithList: Story = {
  args: {
    title: 'Items',
    children: (
      <ul className="space-y-2">
        <li className="text-zinc-400">• Item one</li>
        <li className="text-zinc-400">• Item two</li>
        <li className="text-zinc-400">• Item three</li>
      </ul>
    ),
  },
};

/**
 * Card with metrics.
 * Shows card usage for displaying numerical data.
 */
export const WithMetrics: Story = {
  args: {
    title: 'Performance',
    children: (
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-400">98%</div>
          <div className="text-xs text-zinc-500">Uptime</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">45ms</div>
          <div className="text-xs text-zinc-500">Latency</div>
        </div>
      </div>
    ),
  },
};

/**
 * Card with long content.
 * Tests card behavior with extended content and scrolling.
 */
export const WithLongContent: Story = {
  args: {
    title: 'Description',
    children: (
      <p className="text-zinc-400 leading-relaxed">
        This is a longer piece of content that demonstrates how the card handles extended text.
        The card should properly contain and display all of this content with appropriate padding
        and spacing around it.
      </p>
    ),
  },
};

/**
 * Gallery showing multiple cards.
 * Demonstrates card usage in a layout context.
 */
export const Gallery: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-8 w-full max-w-4xl">
      <Card title="Card 1">
        <p className="text-zinc-400 text-sm">First card content</p>
      </Card>
      <Card title="Card 2">
        <p className="text-zinc-400 text-sm">Second card content</p>
      </Card>
      <Card title="Card 3">
        <p className="text-zinc-400 text-sm">Third card content</p>
      </Card>
    </div>
  ),
};
