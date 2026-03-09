import type { Meta, StoryObj } from '@storybook/react';
import IssuesList from './IssuesList';

const meta = {
  title: 'IssuesList',
  component: IssuesList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays a list of issues or problems detected in the system. ' +
          'Shows issue severity, descriptions, and provides filtering capabilities.',
      },
    },
  },
  argTypes: {
    issues: {
      control: false,
      description: 'Array of issue objects to display',
      table: { type: { summary: 'array' } },
    },
    loading: {
      control: 'boolean',
      description: 'Whether the list is in loading state',
      table: { type: { summary: 'boolean', default: 'false' } },
    },
    onFilter: {
      control: false,
      description: 'Callback when filter is applied',
      table: { type: { summary: 'function' } },
    },
  },
} satisfies Meta<typeof IssuesList>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleIssues = [
  {
    id: '1',
    title: 'High Memory Usage',
    severity: 'warning',
    timestamp: '2 hours ago',
  },
  {
    id: '2',
    title: 'API Response Timeout',
    severity: 'error',
    timestamp: '15 minutes ago',
  },
  {
    id: '3',
    title: 'Database Replication Lag',
    severity: 'warning',
    timestamp: '45 minutes ago',
  },
];

/**
 * Default issues list with multiple items.
 * Shows typical usage with sample data.
 */
export const Default: Story = {
  args: {
    issues: sampleIssues,
    loading: false,
  },
};

/**
 * Empty state - no issues.
 * Shows how component behaves when list is empty.
 */
export const Empty: Story = {
  args: {
    issues: [],
    loading: false,
  },
};

/**
 * Loading state.
 * Shows placeholder while data is being fetched.
 */
export const Loading: Story = {
  args: {
    issues: [],
    loading: true,
  },
};

/**
 * Issues list with many items.
 * Tests scrolling and performance with larger lists.
 */
export const ManyIssues: Story = {
  args: {
    issues: Array.from({ length: 12 }, (_, i) => ({
      id: `issue-${i}`,
      title: `Issue ${i + 1}: System alert`,
      severity: ['error', 'warning', 'info'][i % 3],
      timestamp: `${i * 5} minutes ago`,
    })),
    loading: false,
  },
};

/**
 * Issues list with only errors.
 * Shows critical/error level issues.
 */
export const OnlyErrors: Story = {
  args: {
    issues: [
      {
        id: '1',
        title: 'Critical System Failure',
        severity: 'error',
        timestamp: 'now',
      },
      {
        id: '2',
        title: 'Database Connection Lost',
        severity: 'error',
        timestamp: '1 minute ago',
      },
    ],
    loading: false,
  },
};
