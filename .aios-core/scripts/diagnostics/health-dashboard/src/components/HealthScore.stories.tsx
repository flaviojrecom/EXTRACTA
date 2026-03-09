import type { Meta, StoryObj } from '@storybook/react';
import HealthScore from './HealthScore';

const meta = {
  title: 'HealthScore',
  component: HealthScore,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays system health score with visual indicators and optional breakdown. ' +
          'Shows overall health percentage and detailed metrics.',
      },
    },
  },
  argTypes: {
    score: {
      control: { type: 'range', min: 0, max: 100, step: 5 },
      description: 'Health score percentage (0-100)',
      table: { type: { summary: 'number' } },
    },
    breakdown: {
      control: false,
      description: 'Optional breakdown of score components',
      table: { type: { summary: 'object' } },
    },
  },
  args: {
    score: 85,
  },
} satisfies Meta<typeof HealthScore>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleBreakdown = {
  uptime: 99.5,
  performance: 87,
  reliability: 82,
};

/**
 * Healthy system - high score.
 * Shows green/positive health indicator.
 */
export const Healthy: Story = {
  args: {
    score: 92,
    breakdown: sampleBreakdown,
  },
};

/**
 * Good health - above average.
 * Normal operating condition.
 */
export const Good: Story = {
  args: {
    score: 78,
    breakdown: { uptime: 98, performance: 75, reliability: 72 },
  },
};

/**
 * At-risk health - warning level.
 * Needs attention but not critical.
 */
export const AtRisk: Story = {
  args: {
    score: 52,
    breakdown: { uptime: 92, performance: 45, reliability: 38 },
  },
};

/**
 * Critical health - low score.
 * Immediate attention required.
 */
export const Critical: Story = {
  args: {
    score: 28,
    breakdown: { uptime: 65, performance: 20, reliability: 15 },
  },
};

/**
 * Perfect score.
 * All systems optimal.
 */
export const Perfect: Story = {
  args: {
    score: 100,
    breakdown: { uptime: 100, performance: 100, reliability: 100 },
  },
};

/**
 * Without breakdown details.
 * Simple score display only.
 */
export const WithoutBreakdown: Story = {
  args: {
    score: 75,
  },
};
