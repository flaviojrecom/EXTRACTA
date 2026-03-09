import type { Meta, StoryObj } from '@storybook/react';
import Chart from './Chart';

const meta = {
  title: 'Shared/Chart',
  component: Chart,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A chart component for visualizing data. ' +
          'Supports multiple chart types and configurations for displaying metrics and trends.',
      },
    },
  },
  argTypes: {
    data: {
      control: false,
      description: 'Array of data points to display',
      table: { type: { summary: 'array' } },
    },
    title: {
      control: 'text',
      description: 'Optional chart title',
      table: { type: { summary: 'string', default: 'undefined' } },
    },
    xKey: {
      control: 'text',
      description: 'Key for X-axis data',
      table: { type: { summary: 'string' } },
    },
    yKey: {
      control: 'text',
      description: 'Key for Y-axis data',
      table: { type: { summary: 'string' } },
    },
  },
} satisfies Meta<typeof Chart>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleData = [
  { name: 'Jan', value: 65 },
  { name: 'Feb', value: 72 },
  { name: 'Mar', value: 68 },
  { name: 'Apr', value: 81 },
  { name: 'May', value: 75 },
  { name: 'Jun', value: 88 },
];

/**
 * Default chart with sample data.
 * Shows basic line/area chart visualization.
 */
export const Default: Story = {
  args: {
    data: sampleData,
    title: 'Performance Metrics',
    xKey: 'name',
    yKey: 'value',
  },
};

/**
 * Chart with low values.
 * Tests chart scaling and visualization with smaller numbers.
 */
export const LowValues: Story = {
  args: {
    data: [
      { month: 'Jan', score: 5 },
      { month: 'Feb', score: 8 },
      { month: 'Mar', score: 6 },
      { month: 'Apr', score: 9 },
      { month: 'May', score: 7 },
    ],
    title: 'Score Trend',
    xKey: 'month',
    yKey: 'score',
  },
};

/**
 * Chart with high values.
 * Tests chart scaling with larger numbers.
 */
export const HighValues: Story = {
  args: {
    data: [
      { period: 'Q1', revenue: 125000 },
      { period: 'Q2', revenue: 145000 },
      { period: 'Q3', revenue: 138000 },
      { period: 'Q4', revenue: 162000 },
    ],
    title: 'Quarterly Revenue',
    xKey: 'period',
    yKey: 'revenue',
  },
};

/**
 * Chart with trending data.
 * Shows upward trend in metrics.
 */
export const TrendingUp: Story = {
  args: {
    data: [
      { week: 'W1', users: 100 },
      { week: 'W2', users: 120 },
      { week: 'W3', users: 145 },
      { week: 'W4', users: 168 },
      { week: 'W5', users: 195 },
      { week: 'W6', users: 228 },
    ],
    title: 'User Growth',
    xKey: 'week',
    yKey: 'users',
  },
};

/**
 * Chart with volatile data.
 * Shows fluctuating values.
 */
export const Volatile: Story = {
  args: {
    data: [
      { day: 'Day 1', latency: 45 },
      { day: 'Day 2', latency: 62 },
      { day: 'Day 3', latency: 38 },
      { day: 'Day 4', latency: 71 },
      { day: 'Day 5', latency: 52 },
      { day: 'Day 6', latency: 48 },
    ],
    title: 'API Latency (ms)',
    xKey: 'day',
    yKey: 'latency',
  },
};

/**
 * Chart without title.
 * Minimal chart display.
 */
export const NoTitle: Story = {
  args: {
    data: sampleData,
    xKey: 'name',
    yKey: 'value',
  },
};
