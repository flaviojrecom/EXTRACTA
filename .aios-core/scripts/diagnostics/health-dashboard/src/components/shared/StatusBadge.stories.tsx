import type { Meta, StoryObj } from '@storybook/react';
import StatusBadge from './StatusBadge';

const meta = {
  title: 'Shared/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A status badge component that displays different status states with visual indicators. ' +
          'Use for showing health status, issue severity, or any categorical status information.',
      },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['success', 'warning', 'error', 'info'],
      description: 'The status type that determines the badge color and style',
      table: { type: { summary: 'success | warning | error | info' } },
    },
    label: {
      control: 'text',
      description: 'The text label to display inside the badge',
      table: { type: { summary: 'string' } },
    },
  },
  args: {
    status: 'success',
    label: 'Healthy',
  },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default status badge with success state.
 * Shows the primary use case for the component.
 */
export const Default: Story = {
  args: {
    status: 'success',
    label: 'Healthy',
  },
};

/**
 * Success status badge - indicates positive/healthy state.
 * Used for components that are working correctly.
 */
export const Success: Story = {
  args: {
    status: 'success',
    label: 'Operational',
  },
};

/**
 * Warning status badge - indicates caution/attention needed.
 * Used for components that need monitoring or intervention.
 */
export const Warning: Story = {
  args: {
    status: 'warning',
    label: 'At Risk',
  },
};

/**
 * Error status badge - indicates critical/failed state.
 * Used for components that have failed or need immediate action.
 */
export const Error: Story = {
  args: {
    status: 'error',
    label: 'Critical',
  },
};

/**
 * Info status badge - indicates informational state.
 * Used for neutral status information.
 */
export const Info: Story = {
  args: {
    status: 'info',
    label: 'In Progress',
  },
};

/**
 * Gallery showing all status badge variants side-by-side.
 * Useful for design system documentation and comparison.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex items-center gap-4 flex-wrap justify-center p-8">
      <StatusBadge status="success" label="Healthy" />
      <StatusBadge status="warning" label="At Risk" />
      <StatusBadge status="error" label="Critical" />
      <StatusBadge status="info" label="In Progress" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All four status badge variants displayed together for easy comparison and design validation.',
      },
    },
  },
};

/**
 * Long label variant - tests badge behavior with extended text.
 * Ensures proper text truncation and spacing.
 */
export const LongLabel: Story = {
  args: {
    status: 'warning',
    label: 'Requires Immediate Attention',
  },
};

/**
 * Short label variant - tests badge behavior with minimal text.
 * Ensures proper padding and alignment.
 */
export const ShortLabel: Story = {
  args: {
    status: 'success',
    label: 'OK',
  },
};
