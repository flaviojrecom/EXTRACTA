import type { Meta, StoryObj } from '@storybook/react';
import TechDebtList from './TechDebtList';

const meta = {
  title: 'TechDebtList',
  component: TechDebtList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays a list of technical debt items for the system. ' +
          'Shows priority, description, and allows dismissing items.',
      },
    },
  },
  argTypes: {
    items: {
      control: false,
      description: 'Array of tech debt items',
      table: { type: { summary: 'array' } },
    },
    onDismiss: {
      control: false,
      description: 'Callback when item is dismissed',
      table: { type: { summary: 'function' } },
    },
  },
} satisfies Meta<typeof TechDebtList>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleItems = [
  {
    id: '1',
    title: 'Legacy Authentication System',
    priority: 'high',
    description: 'Needs migration to OAuth 2.0',
  },
  {
    id: '2',
    title: 'Database Indexing',
    priority: 'medium',
    description: 'Missing indexes on frequently queried tables',
  },
  {
    id: '3',
    title: 'API Documentation',
    priority: 'low',
    description: 'OpenAPI specs out of sync with implementation',
  },
];

/**
 * Default tech debt list with multiple items.
 * Shows typical usage with sample data.
 */
export const Default: Story = {
  args: {
    items: sampleItems,
  },
};

/**
 * Empty state - no tech debt.
 * Shows how component behaves when list is empty.
 */
export const Empty: Story = {
  args: {
    items: [],
  },
};

/**
 * High priority items only.
 * Shows critical tech debt.
 */
export const HighPriority: Story = {
  args: {
    items: [
      {
        id: '1',
        title: 'Security Vulnerability in Auth',
        priority: 'high',
        description: 'OWASP Top 10 issue - authentication bypass possible',
      },
      {
        id: '2',
        title: 'Memory Leak in Event Handler',
        priority: 'high',
        description: 'WebSocket connections not properly cleaned up',
      },
    ],
  },
};

/**
 * Long list of items.
 * Tests scrolling and performance with many items.
 */
export const ManyItems: Story = {
  args: {
    items: Array.from({ length: 10 }, (_, i) => ({
      id: `item-${i}`,
      title: `Tech Debt Item ${i + 1}`,
      priority: ['high', 'medium', 'low'][i % 3],
      description: `Description for tech debt item ${i + 1}`,
    })),
  },
};

/**
 * With dismiss callback.
 * Demonstrates interactive item dismissal.
 */
export const WithDismiss: Story = {
  args: {
    items: sampleItems,
    onDismiss: (itemId: string) => alert(`Dismissed item: ${itemId}`),
  },
};
