import type { Meta, StoryObj } from '@storybook/react';
import AutoFixLog from './AutoFixLog';

const meta = {
  title: 'AutoFixLog',
  component: AutoFixLog,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays a log of automatic fix attempts and results. ' +
          'Shows progress, success/failure status, and timestamps for each fix.',
      },
    },
  },
  argTypes: {
    logs: {
      control: false,
      description: 'Array of log entries',
      table: { type: { summary: 'array' } },
    },
    status: {
      control: 'select',
      options: ['idle', 'running', 'success', 'error'],
      description: 'Current status of the auto-fix process',
      table: { type: { summary: 'idle | running | success | error' } },
    },
  },
} satisfies Meta<typeof AutoFixLog>;

export default meta;
type Story = StoryObj<typeof meta>;

const successLogs = [
  { id: '1', message: 'Fixed memory leak in event handler', timestamp: '2:15 PM' },
  { id: '2', message: 'Optimized database query', timestamp: '2:14 PM' },
  { id: '3', message: 'Cleared stale cache entries', timestamp: '2:13 PM' },
];

const mixedLogs = [
  { id: '1', message: 'Fixed memory leak', status: 'success', timestamp: '2:15 PM' },
  { id: '2', message: 'Failed to update certificate', status: 'error', timestamp: '2:14 PM' },
  { id: '3', message: 'Optimization complete', status: 'success', timestamp: '2:13 PM' },
];

/**
 * Successful auto-fix process.
 * Shows completed fixes.
 */
export const Success: Story = {
  args: {
    logs: successLogs,
    status: 'success',
  },
};

/**
 * In-progress auto-fix.
 * Shows running/processing state.
 */
export const InProgress: Story = {
  args: {
    logs: [
      { id: '1', message: 'Starting auto-fix process...', timestamp: 'now' },
      { id: '2', message: 'Analyzing system issues', timestamp: '2:15 PM' },
    ],
    status: 'running',
  },
};

/**
 * Failed auto-fix process.
 * Shows errors during fix attempts.
 */
export const Error: Story = {
  args: {
    logs: [
      { id: '1', message: 'Attempting to fix issue', status: 'error', timestamp: '2:15 PM' },
      { id: '2', message: 'Failed: Permission denied', status: 'error', timestamp: '2:14 PM' },
    ],
    status: 'error',
  },
};

/**
 * Mixed results - successes and failures.
 * Shows partial completion with some errors.
 */
export const MixedResults: Story = {
  args: {
    logs: mixedLogs,
    status: 'error',
  },
};

/**
 * Empty log.
 * Shows idle state with no entries.
 */
export const Empty: Story = {
  args: {
    logs: [],
    status: 'idle',
  },
};

/**
 * Many log entries.
 * Tests scrolling and performance with long logs.
 */
export const ManyEntries: Story = {
  args: {
    logs: Array.from({ length: 20 }, (_, i) => ({
      id: `log-${i}`,
      message: `Auto-fix action ${i + 1}: ${['Fixed issue', 'Optimized', 'Cleared cache'][i % 3]}`,
      status: ['success', 'error', 'pending'][i % 3],
      timestamp: `${20 - i}:${String((i * 3) % 60).padStart(2, '0')} PM`,
    })),
    status: 'success',
  },
};
